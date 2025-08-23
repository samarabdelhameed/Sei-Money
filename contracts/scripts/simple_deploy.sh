#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Simple SeiMoney Contract Deployment"
echo "====================================="

# Check WASM file
WASM_FILE="artifacts/seimoney_payments.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    exit 1
fi

echo "📦 WASM file ready: $(ls -lh $WASM_FILE | awk '{print $5}')"

# Use deployer wallet
SEID="./scripts/seid"
DEPLOYER_ADDRESS=$(./scripts/seid keys show deployer -a)
echo "🔑 Deployer Address: $DEPLOYER_ADDRESS"

# Check balance
echo "💰 Checking deployer balance..."
BALANCE_JSON=$(./scripts/seid query bank balances "$DEPLOYER_ADDRESS" \
    --node "https://sei-testnet-rpc.polkachu.com:443" \
    --output json 2>/dev/null || echo '{"balances":[]}')

echo "📊 Balance JSON: $BALANCE_JSON"

# Extract balance
BALANCE=$(echo "$BALANCE_JSON" | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")
echo "💰 Balance: $BALANCE usei"

if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ]; then
    echo ""
    echo "❌ No balance in deployer wallet!"
    echo ""
    echo "🔄 Transfer funds from MetaMask:"
    echo "   From: 0xF26f945C1e73278157c24C1dCBb8A19227547D29"
    echo "   To: $DEPLOYER_ADDRESS"
    echo "   Amount: 2 SEI"
    echo ""
    echo "After transfer, run this script again."
    exit 1
fi

# Convert to SEI for display
BALANCE_SEI=$(python3 -c "print(f'{$BALANCE/1000000:.6f}')")
echo "✅ Balance: $BALANCE_SEI SEI"

echo ""
echo "📤 Step 1: Storing contract code..."

STORE_TX=$($SEID tx wasm store "$WASM_FILE" \
    --from "deployer" \
    --chain-id "atlantic-2" \
    --node "https://sei-testnet-rpc.polkachu.com:443" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Store TX: $STORE_TX"
echo "⏳ Waiting for confirmation..."
sleep 5

# Get code_id
echo "🔍 Getting code ID..."
CODE_ID=$($SEID q tx "$STORE_TX" \
    --node "https://sei-testnet-rpc.polkachu.com:443" \
    --output json | jq -r '.logs[0].events[] | select(.type=="store_code").attributes[] | select(.key=="code_id").value')

echo "🆔 Code ID: $CODE_ID"

echo ""
echo "🏗️ Step 2: Instantiating contract..."

# Prepare init message
INIT_MSG='{
    "default_denom": "usei",
    "admin": "'$DEPLOYER_ADDRESS'"
}'

echo "📝 Init message: $INIT_MSG"

INSTANTIATE_TX=$($SEID tx wasm instantiate "$CODE_ID" "$INIT_MSG" \
    --label "SeiMoney Payments v1.0" \
    --from "deployer" \
    --chain-id "atlantic-2" \
    --node "https://sei-testnet-rpc.polkachu.com:443" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Instantiate TX: $INSTANTIATE_TX"
echo "⏳ Waiting for confirmation..."
sleep 5

# Get contract address
echo "🔍 Getting contract address..."
CONTRACT_ADDRESS=$($SEID q tx "$INSTANTIATE_TX" \
    --node "https://sei-testnet-rpc.polkachu.com:443" \
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
echo ""
echo "🌐 Explorers:"
echo "   SeiTrace: https://seitrace.com/address/$CONTRACT_ADDRESS"
echo "   SeiStream: https://seistream.app/address/$CONTRACT_ADDRESS"
echo ""
echo "🧪 Test the contract:"
echo "   ./scripts/test_contract.sh"