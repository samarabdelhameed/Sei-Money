#!/bin/bash

# Deploy using REST API instead of seid CLI
set -e

# Configuration
CHAIN_ID="atlantic-2"
RPC_ENDPOINT="https://rpc.atlantic-2.seinetwork.io:443"
REST_ENDPOINT="https://rest.atlantic-2.seinetwork.io"
DENOM="usei"

# Load deployer info
if [ ! -f "artifacts/deployer_info.json" ]; then
    echo "❌ Deployer info not found. Please create wallet first."
    exit 1
fi

DEPLOYER_ADDRESS=$(cat artifacts/deployer_info.json | jq -r '.address')
MNEMONIC=$(cat artifacts/deployer_info.json | jq -r '.mnemonic')

echo "🚀 Deploying SeiMoney contract..."
echo "📍 Deployer: $DEPLOYER_ADDRESS"
echo "🌐 Chain: $CHAIN_ID"
echo "🔗 RPC: $RPC_ENDPOINT"

# Check balance first
echo "💰 Checking balance..."
BALANCE_RESPONSE=$(curl -s "$REST_ENDPOINT/cosmos/bank/v1beta1/balances/$DEPLOYER_ADDRESS")
BALANCE=$(echo $BALANCE_RESPONSE | jq -r '.balances[] | select(.denom=="usei") | .amount // "0"')

if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ]; then
    echo "❌ No balance found. Please fund your wallet:"
    echo "   Address: $DEPLOYER_ADDRESS"
    echo "   Faucet: https://faucet.seinetwork.io/"
    exit 1
fi

echo "✅ Balance: $BALANCE usei"

# Check if WASM file exists
if [ ! -f "artifacts/seimoney_payments.wasm" ]; then
    echo "❌ WASM file not found. Please build the contract first."
    exit 1
fi

echo "✅ WASM file found ($(ls -lh artifacts/seimoney_payments.wasm | awk '{print $5}'))"

echo ""
echo "📋 Ready to deploy!"
echo "   Next steps:"
echo "   1. Use CosmJS or similar tool to upload WASM"
echo "   2. Instantiate the contract"
echo "   3. Test contract functions"
echo ""
echo "   Or use the Sei web interface at:"
echo "   https://app.seinetwork.io/"