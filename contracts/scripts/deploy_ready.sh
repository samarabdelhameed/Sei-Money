#!/usr/bin/env bash
set -euo pipefail

echo "🚀 SeiMoney Contract Deployment - Ready Version"
echo "=============================================="

CHAIN_ID="atlantic-2"
NODE="https://rpc.atlantic-2.seinetwork.io:443"
DENOM="usei"
FROM="deployer"
WASM="artifacts/seimoney_payments.wasm"
LABEL="seimoney-payments"
SEID="./scripts/seid"

# Check deployer wallet
if ! $SEID keys show "$FROM" >/dev/null 2>&1; then
    echo "❌ Wallet '$FROM' not found"
    exit 1
fi

DEPLOYER_ADDRESS=$($SEID keys show "$FROM" -a)
echo "🔑 Deployer: $DEPLOYER_ADDRESS"

# Check balance
echo "💰 Checking balance..."
BALANCE_RESULT=$($SEID query bank balances "$DEPLOYER_ADDRESS" --node "$NODE" --output json)
BALANCE=$(echo "$BALANCE_RESULT" | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")

if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ]; then
    echo "❌ No balance found!"
    echo ""
    echo "🚰 Get testnet tokens from Discord:"
    echo "   1. Join: https://discord.gg/sei"
    echo "   2. Go to #faucet channel"
    echo "   3. Type: !faucet $DEPLOYER_ADDRESS"
    echo ""
    echo "📱 Or from MetaMask:"
    echo "   Send 0.1 SEI to: $DEPLOYER_ADDRESS"
    echo "   EVM format: 0xF5459166C2465989D86DE9A281AC9ECB85C929E4"
    exit 1
fi

echo "✅ Balance: $BALANCE usei ($(echo "scale=6; $BALANCE/1000000" | bc) SEI)"

# Store contract
echo ""
echo "📤 Step 1: Storing contract code..."
TX=$($SEID tx wasm store "$WASM" \
    --from "$FROM" \
    --chain-id "$CHAIN_ID" \
    --node "$NODE" \
    --gas auto \
    --gas-adjustment 1.3 \
    --fees "50000$DENOM" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Store TX: $TX"
sleep 3

# Get code_id
CODE_ID=$($SEID q tx "$TX" --node "$NODE" --output json | jq -r '.logs[0].events[] | select(.type=="store_code").attributes[] | select(.key=="code_id").value')
echo "🆔 Code ID: $CODE_ID"

# Instantiate contract
echo ""
echo "🏗️ Step 2: Instantiating contract..."
ADMIN="$DEPLOYER_ADDRESS"
INIT_MSG='{"default_denom":"usei","admin":"'$ADMIN'"}'

ITX=$($SEID tx wasm instantiate "$CODE_ID" "$INIT_MSG" \
    --label "$LABEL" \
    --from "$FROM" \
    --chain-id "$CHAIN_ID" \
    --node "$NODE" \
    --gas auto \
    --gas-adjustment 1.3 \
    --fees "50000$DENOM" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Instantiate TX: $ITX"
sleep 3

# Get contract address
CONTRACT=$($SEID q tx "$ITX" --node "$NODE" --output json | jq -r '.logs[0].events[] | select(.type=="instantiate").attributes[] | select(.key=="_contract_address").value')
echo "🏠 Contract Address: $CONTRACT"

# Save deployment info
DEPLOYMENT_INFO='{
    "chain_id": "'$CHAIN_ID'",
    "code_id": "'$CODE_ID'",
    "contract_address": "'$CONTRACT'",
    "deployer_address": "'$DEPLOYER_ADDRESS'",
    "deployment_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "store_tx": "'$TX'",
    "instantiate_tx": "'$ITX'",
    "wasm_file": "'$WASM'"
}'

echo "$DEPLOYMENT_INFO" | jq '.' > artifacts/deployment.json

echo ""
echo "✅ Deployment completed successfully!"
echo "📄 Deployment info saved to: artifacts/deployment.json"
echo ""
echo "🔗 Contract Details:"
echo "   Chain ID: $CHAIN_ID"
echo "   Code ID: $CODE_ID"
echo "   Contract Address: $CONTRACT"
echo ""
echo "🌐 Explorers:"
echo "   SeiTrace: https://seitrace.com/address/$CONTRACT"
echo "   SeiStream: https://seistream.app/address/$CONTRACT"
echo ""
echo "🧪 Next step - Test the contract:"
echo "   ./scripts/test_contract.sh"
