#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Final SeiMoney Deployment"
echo "============================"

# Load environment variables
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    exit 1
fi

source .env

# Use a working RPC (try multiple)
RPC="https://rpc.atlantic-2.seinetwork.io:443"

echo "🔑 Using MetaMask private key for deployment"
echo "🌐 RPC: $RPC"

# Convert MetaMask address to Sei format
SEI_METAMASK=$(./scripts/seid debug addr ${WALLET_ADDRESS#0x} | grep "Bech32 Acc:" | awk '{print $3}')
echo "🦊 MetaMask (Sei): $SEI_METAMASK"

# Check WASM file
WASM_FILE="artifacts/seimoney_payments.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    exit 1
fi

echo "📦 WASM file: $(ls -lh $WASM_FILE | awk '{print $5}')"

# Create temporary key with MetaMask private key
TEMP_KEY="temp-deployer"
./scripts/seid keys delete "$TEMP_KEY" --keyring-backend test -y 2>/dev/null || true

echo "🔑 Adding key with private key..."
CLEAN_KEY=${PRIVATE_KEY#0x}

# Create a temporary script to handle the interactive input
cat > /tmp/add_key.sh << 'EOF'
#!/usr/bin/expect -f
set timeout 30
spawn ./scripts/seid keys add temp-deployer --keyring-backend test --recover
expect "Enter your bip39 mnemonic"
send "draft dinner stadium few report aim museum deny recall brave cattle lumber saddle slight equip ridge naive capital violin sudden merry inch between eye\r"
expect "Enter your bip39 passphrase"
send "\r"
expect eof
EOF

chmod +x /tmp/add_key.sh
/tmp/add_key.sh
rm -f /tmp/add_key.sh

# Verify imported address
IMPORTED_ADDRESS=$(./scripts/seid keys show "$TEMP_KEY" --keyring-backend test -a)
echo "✅ Imported Address: $IMPORTED_ADDRESS"

if [ "$IMPORTED_ADDRESS" != "$SEI_METAMASK" ]; then
    echo "❌ Address mismatch!"
    exit 1
fi

echo ""
echo "📤 Step 1: Storing contract code..."

STORE_TX=$(./scripts/seid tx wasm store "$WASM_FILE" \
    --from "$TEMP_KEY" \
    --keyring-backend test \
    --chain-id "atlantic-2" \
    --node "$RPC" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Store TX: $STORE_TX"
sleep 5

# Get code_id
CODE_ID=$(./scripts/seid q tx "$STORE_TX" \
    --node "$RPC" \
    --output json | jq -r '.logs[0].events[] | select(.type=="store_code").attributes[] | select(.key=="code_id").value')

echo "🆔 Code ID: $CODE_ID"

echo ""
echo "🏗️ Step 2: Instantiating contract..."

# Prepare init message
INIT_MSG='{
    "default_denom": "usei",
    "admin": "'$SEI_METAMASK'"
}'

echo "📝 Init message: $INIT_MSG"

INSTANTIATE_TX=$(./scripts/seid tx wasm instantiate "$CODE_ID" "$INIT_MSG" \
    --label "SeiMoney Payments v1.0" \
    --from "$TEMP_KEY" \
    --keyring-backend test \
    --chain-id "atlantic-2" \
    --node "$RPC" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Instantiate TX: $INSTANTIATE_TX"
sleep 5

# Get contract address
CONTRACT_ADDRESS=$(./scripts/seid q tx "$INSTANTIATE_TX" \
    --node "$RPC" \
    --output json | jq -r '.logs[0].events[] | select(.type=="instantiate").attributes[] | select(.key=="_contract_address").value')

echo "🏠 Contract Address: $CONTRACT_ADDRESS"

# Save deployment info
DEPLOYMENT_INFO='{
    "chain_id": "atlantic-2",
    "code_id": "'$CODE_ID'",
    "contract_address": "'$CONTRACT_ADDRESS'",
    "deployer_address": "'$SEI_METAMASK'",
    "metamask_address": "'$WALLET_ADDRESS'",
    "deployment_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "store_tx": "'$STORE_TX'",
    "instantiate_tx": "'$INSTANTIATE_TX'",
    "wasm_file": "'$WASM_FILE'"
}'

echo "$DEPLOYMENT_INFO" | jq '.' > artifacts/deployment.json

# Update .env file
sed -i.bak "s/PAYMENTS_CONTRACT_ADDRESS=.*/PAYMENTS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env

# Cleanup temp key
./scripts/seid keys delete "$TEMP_KEY" --keyring-backend test -y

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL! 🎉"
echo "=============================="
echo ""
echo "📄 Deployment saved to: artifacts/deployment.json"
echo "📝 Contract address updated in .env"
echo ""
echo "🔗 Contract Details:"
echo "   Chain ID: atlantic-2"
echo "   Code ID: $CODE_ID"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Deployer: $SEI_METAMASK"
echo "   Store TX: $STORE_TX"
echo "   Instantiate TX: $INSTANTIATE_TX"
echo ""
echo "🌐 Explorers:"
echo "   SeiTrace: https://seitrace.com/address/$CONTRACT_ADDRESS"
echo "   SeiStream: https://seistream.app/address/$CONTRACT_ADDRESS"
echo ""
echo "✅ Ready for Step 4: Frontend Integration!"