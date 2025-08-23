#!/usr/bin/env bash
set -euo pipefail

echo "🦊 SeiMoney Contract Deployment with MetaMask"
echo "============================================="

# Load environment variables
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    exit 1
fi

source .env

# Validate required variables
if [ -z "$PRIVATE_KEY" ] || [ -z "$WALLET_ADDRESS" ]; then
    echo "❌ Missing PRIVATE_KEY or WALLET_ADDRESS in .env"
    exit 1
fi

echo "🔑 MetaMask Address: $WALLET_ADDRESS"
echo "🌐 Network: Sei Testnet (Chain ID: $SEI_CHAIN_ID)"

# Check balance first
echo "💰 Checking balance..."
./scripts/check_metamask_balance.sh | grep "Balance:" || {
    echo "❌ Could not verify balance. Please check your MetaMask setup."
    exit 1
}

# Check if WASM file exists
WASM_FILE="artifacts/seimoney_payments.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    echo "Building contract..."
    cargo wasm
fi

echo "📦 WASM file ready: $(ls -lh $WASM_FILE | awk '{print $5}')"

# Use seid with temporary key
SEID="./scripts/seid"
TEMP_KEY="metamask-deployer"

echo "🔑 Setting up temporary deployment key..."

# Remove existing key if exists
$SEID keys delete "$TEMP_KEY" --keyring-backend test -y 2>/dev/null || true

# Create temporary key file with proper format
CLEAN_KEY=${PRIVATE_KEY#0x}
TEMP_KEY_FILE="/tmp/temp_key_$$.json"

# Create a proper key file format
cat > "$TEMP_KEY_FILE" << EOF
{
  "type": "local",
  "value": "$CLEAN_KEY"
}
EOF

# Import private key from file with automatic passphrase
echo "password123" | $SEID keys import "$TEMP_KEY" "$TEMP_KEY_FILE" --keyring-backend test

# Clean up temp file
rm -f "$TEMP_KEY_FILE"

# Get the Sei address
SEI_ADDRESS=$($SEID keys show "$TEMP_KEY" --keyring-backend test -a)
echo "🔄 Sei Address: $SEI_ADDRESS"

echo ""
echo "📤 Step 1: Storing contract code..."

STORE_TX=$($SEID tx wasm store "$WASM_FILE" \
    --from "$TEMP_KEY" \
    --keyring-backend test \
    --chain-id "$SEI_CHAIN_ID" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Store TX: $STORE_TX"
sleep 3

# Get code_id
CODE_ID=$($SEID q tx "$STORE_TX" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
    --output json | jq -r '.logs[0].events[] | select(.type=="store_code").attributes[] | select(.key=="code_id").value')

echo "🆔 Code ID: $CODE_ID"

echo ""
echo "🏗️ Step 2: Instantiating contract..."

# Prepare init message
INIT_MSG='{
    "default_denom": "usei",
    "admin": "'$SEI_ADDRESS'"
}'

echo "📝 Init message: $INIT_MSG"

INSTANTIATE_TX=$($SEID tx wasm instantiate "$CODE_ID" "$INIT_MSG" \
    --label "SeiMoney Payments v1.0" \
    --from "$TEMP_KEY" \
    --keyring-backend test \
    --chain-id "$SEI_CHAIN_ID" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Instantiate TX: $INSTANTIATE_TX"
sleep 3

# Get contract address
CONTRACT_ADDRESS=$($SEID q tx "$INSTANTIATE_TX" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
    --output json | jq -r '.logs[0].events[] | select(.type=="instantiate").attributes[] | select(.key=="_contract_address").value')

echo "🏠 Contract Address: $CONTRACT_ADDRESS"

# Save deployment info
DEPLOYMENT_INFO='{
    "chain_id": "'$SEI_CHAIN_ID'",
    "code_id": "'$CODE_ID'",
    "contract_address": "'$CONTRACT_ADDRESS'",
    "deployer_address": "'$SEI_ADDRESS'",
    "metamask_address": "'$WALLET_ADDRESS'",
    "deployment_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "store_tx": "'$STORE_TX'",
    "instantiate_tx": "'$INSTANTIATE_TX'",
    "wasm_file": "'$WASM_FILE'"
}'

echo "$DEPLOYMENT_INFO" | jq '.' > artifacts/deployment.json

# Update .env file
sed -i.bak "s/PAYMENTS_CONTRACT_ADDRESS=.*/PAYMENTS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env

# Cleanup temporary key
$SEID keys delete "$TEMP_KEY" --keyring-backend test -y

echo ""
echo "✅ Deployment completed successfully!"
echo "📄 Deployment info saved to: artifacts/deployment.json"
echo "📝 Contract address updated in .env"
echo ""
echo "🔗 Contract Details:"
echo "   Chain ID: $SEI_CHAIN_ID"
echo "   Code ID: $CODE_ID"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Store TX: $STORE_TX"
echo "   Instantiate TX: $INSTANTIATE_TX"
echo ""
echo "🌐 Explorers:"
echo "   SeiTrace: https://seitrace.com/address/$CONTRACT_ADDRESS"
echo "   SeiStream: https://seistream.app/address/$CONTRACT_ADDRESS"
echo ""
echo "🧪 Test the contract:"
echo "   ./scripts/test_metamask_contract.sh"