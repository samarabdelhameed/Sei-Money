#!/usr/bin/env bash
set -euo pipefail

echo "🔄 Activate Account and Deploy Contract"
echo "======================================"

DEPLOYER_ADDRESS=$(./scripts/seid keys show deployer -a)
echo "🔑 Deployer: $DEPLOYER_ADDRESS"

# Try different RPC endpoints
RPC_ENDPOINTS=(
    "https://rpc.atlantic-2.seinetwork.io:443"
    "https://sei-testnet-rpc.polkachu.com:443"
    "https://rpc-testnet.sei-apis.com:443"
)

WORKING_RPC=""
for RPC in "${RPC_ENDPOINTS[@]}"; do
    echo "🔄 Testing RPC: $RPC"
    
    # Test with a simple query
    if ./scripts/seid query bank balances "$DEPLOYER_ADDRESS" --node "$RPC" --output json >/dev/null 2>&1; then
        WORKING_RPC="$RPC"
        echo "✅ Working RPC: $RPC"
        break
    else
        echo "❌ Failed: $RPC"
    fi
done

if [ -z "$WORKING_RPC" ]; then
    echo "❌ No working RPC found"
    exit 1
fi

# Check balance
BALANCE_RESULT=$(./scripts/seid query bank balances "$DEPLOYER_ADDRESS" \
    --node "$WORKING_RPC" \
    --output json)

BALANCE=$(echo "$BALANCE_RESULT" | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")
BALANCE_SEI=$(echo "scale=6; $BALANCE/1000000" | bc -l)
echo "💰 Balance: $BALANCE_SEI SEI"

# Activate account with a small self-transfer
echo ""
echo "🔄 Activating account with self-transfer..."

ACTIVATE_TX=$(./scripts/seid tx bank send deployer "$DEPLOYER_ADDRESS" "1usei" \
    --chain-id "atlantic-2" \
    --node "$WORKING_RPC" \
    --gas auto \
    --gas-adjustment 1.3 \
    --fees "10000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Activation TX: $ACTIVATE_TX"
sleep 3

# Now try to deploy
echo ""
echo "🚀 Starting contract deployment..."

WASM_FILE="artifacts/seimoney_payments.wasm"
echo "📦 WASM file: $(ls -lh $WASM_FILE | awk '{print $5}')"

echo ""
echo "📤 Step 1: Storing contract code..."

STORE_TX=$(./scripts/seid tx wasm store "$WASM_FILE" \
    --from "deployer" \
    --chain-id "atlantic-2" \
    --node "$WORKING_RPC" \
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
    --node "$WORKING_RPC" \
    --output json | jq -r '.logs[0].events[] | select(.type=="store_code").attributes[] | select(.key=="code_id").value')

echo "🆔 Code ID: $CODE_ID"

echo ""
echo "🏗️ Step 2: Instantiating contract..."

# Prepare init message
INIT_MSG='{
    "default_denom": "usei",
    "admin": "'$DEPLOYER_ADDRESS'"
}'

INSTANTIATE_TX=$(./scripts/seid tx wasm instantiate "$CODE_ID" "$INIT_MSG" \
    --label "SeiMoney Payments v1.0" \
    --from "deployer" \
    --chain-id "atlantic-2" \
    --node "$WORKING_RPC" \
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
    --node "$WORKING_RPC" \
    --output json | jq -r '.logs[0].events[] | select(.type=="instantiate").attributes[] | select(.key=="_contract_address").value')

echo "🏠 Contract Address: $CONTRACT_ADDRESS"

# Save deployment info
DEPLOYMENT_INFO='{
    "chain_id": "atlantic-2",
    "code_id": "'$CODE_ID'",
    "contract_address": "'$CONTRACT_ADDRESS'",
    "deployer_address": "'$DEPLOYER_ADDRESS'",
    "deployment_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "store_tx": "'$STORE_TX'",
    "instantiate_tx": "'$INSTANTIATE_TX'",
    "activation_tx": "'$ACTIVATE_TX'",
    "rpc_used": "'$WORKING_RPC'",
    "wasm_file": "'$WASM_FILE'"
}'

echo "$DEPLOYMENT_INFO" | jq '.' > artifacts/deployment.json

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL! 🎉"
echo "=============================="
echo ""
echo "📄 Deployment saved to: artifacts/deployment.json"
echo ""
echo "🔗 Contract Details:"
echo "   Chain ID: atlantic-2"
echo "   Code ID: $CODE_ID"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Deployer: $DEPLOYER_ADDRESS"
echo "   RPC Used: $WORKING_RPC"
echo ""
echo "🌐 Explorers:"
echo "   SeiTrace: https://seitrace.com/address/$CONTRACT_ADDRESS"
echo "   SeiStream: https://seistream.app/address/$CONTRACT_ADDRESS"
echo ""
echo "✅ Ready for Step 4: Frontend Integration!"