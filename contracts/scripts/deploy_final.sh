#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Final SeiMoney Contract Deployment"
echo "===================================="

# Load environment variables
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    exit 1
fi

source .env

echo "🔑 MetaMask Address: $WALLET_ADDRESS"

# Convert to Sei address
SEI_ADDRESS=$(./scripts/seid debug addr ${WALLET_ADDRESS#0x} | grep "Bech32 Acc:" | awk '{print $3}')
echo "🔄 Sei Address: $SEI_ADDRESS"

# Check balance
echo "💰 Checking balance..."
BALANCE_RESULT=$(./scripts/seid query bank balances "$SEI_ADDRESS" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
    --output json)

BALANCE=$(echo "$BALANCE_RESULT" | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")
BALANCE_SEI=$(echo "scale=6; $BALANCE/1000000" | bc)

echo "✅ Balance: $BALANCE_SEI SEI ($BALANCE usei)"

if [ "$BALANCE" -lt 1000000 ]; then
    echo "❌ Insufficient balance for deployment"
    exit 1
fi

# Check WASM file
WASM_FILE="artifacts/seimoney_payments.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    exit 1
fi

echo "📦 WASM file ready: $(ls -lh $WASM_FILE | awk '{print $5}')"

# Create temporary wallet with the private key
TEMP_KEY="temp-deployer"
SEID="./scripts/seid"

# Remove existing key if exists
$SEID keys delete "$TEMP_KEY" --keyring-backend test -y 2>/dev/null || true

# Add key using private key
CLEAN_KEY=${PRIVATE_KEY#0x}
echo "password123" | $SEID keys add "$TEMP_KEY" --keyring-backend test --recover --interactive=false

# Verify the imported key
IMPORTED_ADDRESS=$($SEID keys show "$TEMP_KEY" --keyring-backend test -a)
echo "🔍 Imported Address: $IMPORTED_ADDRESS"

if [ "$IMPORTED_ADDRESS" != "$SEI_ADDRESS" ]; then
    echo "❌ Address mismatch!"
    echo "   Expected: $SEI_ADDRESS"
    echo "   Got: $IMPORTED_ADDRESS"
    exit 1
fi

echo ""
echo "📤 Step 1: Storing contract code..."

STORE_TX=$($SEID tx wasm store "$WASM_FILE" \
    --from "$TEMP_KEY" \
    --keyring-backend test \
    --chain-id "atlantic-2" \
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
    --chain-id "atlantic-2" \
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
    "chain_id": "atlantic-2",
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
echo "🎉 DEPLOYMENT SUCCESSFUL! 🎉"
echo "=============================="
echo ""
echo "📄 Deployment info saved to: artifacts/deployment.json"
echo "📝 Contract address updated in .env"
echo ""
echo "🔗 Contract Details:"
echo "   Chain ID: atlantic-2"
echo "   Code ID: $CODE_ID"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Deployer: $SEI_ADDRESS"
echo "   Store TX: $STORE_TX"
echo "   Instantiate TX: $INSTANTIATE_TX"
echo ""
echo "🌐 Explorers:"
echo "   SeiTrace: https://seitrace.com/address/$CONTRACT_ADDRESS"
echo "   SeiStream: https://seistream.app/address/$CONTRACT_ADDRESS"
echo ""
echo "🧪 Test the contract:"
echo "   ./scripts/test_contract.sh"
echo ""
echo "✅ Ready for Step 4: Frontend Integration!"