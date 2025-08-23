#!/bin/bash

# SeiMoney Contract Deployment Script
# This script deploys the payments contract to Sei testnet

set -e

echo "🚀 Starting SeiMoney contract deployment..."

# Configuration
CHAIN_ID="atlantic-2"
NODE="https://rpc.atlantic-2.seinetwork.io:443"
WASM_FILE="artifacts/seimoney_payments.wasm"
KEYRING_BACKEND="test"
KEY_NAME="deployer"

# Check if WASM file exists
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    echo "Please run: ./scripts/build_wasm.sh"
    exit 1
fi

echo "📦 WASM file found: $WASM_FILE"

# Use local seid binary
SEID_CMD="./seid"

echo "🔑 Setting up wallet..."
# Create a new key for deployment (in test mode)
# Key already exists, just get the address
DEPLOYER_ADDRESS=$($SEID_CMD keys show $KEY_NAME --keyring-backend $KEYRING_BACKEND -a)
echo "📍 Deployer address: $DEPLOYER_ADDRESS"

echo "💰 Please fund this address with testnet tokens from: https://faucet.seinetwork.io/"
echo "Press Enter when you have funded the address..."
read

echo "💾 Storing contract..."
# Store the contract
STORE_RESULT=$($SEID_CMD tx wasm store $WASM_FILE \
    --from $KEY_NAME \
    --keyring-backend $KEYRING_BACKEND \
    --chain-id $CHAIN_ID \
    --node $NODE \
    --gas auto \
    --gas-adjustment 1.3 \
    --fees 20000usei \
    --broadcast-mode block \
    --output json \
    -y)

echo "📋 Store transaction result:"
echo "$STORE_RESULT" | jq '.'

# Extract code ID
CODE_ID=$(echo "$STORE_RESULT" | jq -r '.logs[0].events[] | select(.type=="store_code") | .attributes[] | select(.key=="code_id") | .value')
echo "🆔 Contract Code ID: $CODE_ID"

# Instantiate message
INIT_MSG='{
    "admin": "'$DEPLOYER_ADDRESS'",
    "fee_percentage": 250,
    "min_transfer_amount": "1000000",
    "max_transfer_amount": "1000000000000",
    "supported_denoms": ["usei"]
}'

echo "🏗️ Instantiating contract..."
INSTANTIATE_RESULT=$($SEID_CMD tx wasm instantiate $CODE_ID "$INIT_MSG" \
    --from $KEY_NAME \
    --keyring-backend $KEYRING_BACKEND \
    --chain-id $CHAIN_ID \
    --node $NODE \
    --label "SeiMoney Payments v1.0" \
    --gas auto \
    --gas-adjustment 1.3 \
    --fees 20000usei \
    --broadcast-mode block \
    --output json \
    -y)

echo "📋 Instantiate transaction result:"
echo "$INSTANTIATE_RESULT" | jq '.'

# Extract contract address
CONTRACT_ADDRESS=$(echo "$INSTANTIATE_RESULT" | jq -r '.logs[0].events[] | select(.type=="instantiate") | .attributes[] | select(.key=="_contract_address") | .value')
echo "🏠 Contract Address: $CONTRACT_ADDRESS"

# Save deployment info
cat > deployment_info.json << EOF
{
    "chain_id": "$CHAIN_ID",
    "code_id": "$CODE_ID",
    "contract_address": "$CONTRACT_ADDRESS",
    "deployer_address": "$DEPLOYER_ADDRESS",
    "deployment_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "wasm_file": "$WASM_FILE"
}
EOF

echo "✅ Deployment completed successfully!"
echo "📄 Deployment info saved to: deployment_info.json"
echo ""
echo "🔗 Contract Details:"
echo "   Chain ID: $CHAIN_ID"
echo "   Code ID: $CODE_ID"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Explorer: https://seitrace.com/address/$CONTRACT_ADDRESS"