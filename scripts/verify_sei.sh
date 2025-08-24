#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/verify_sei.sh <contract_address>

if [ $# -eq 0 ]; then
    echo "❌ Usage: $0 <contract_address>"
    echo "Example: $0 sei1..."
    exit 1
fi

ADDR=$1
RPC=${RPC_URL:-https://rpc.testnet.sei.io}
CHAIN_ID=${CHAIN_ID:-sei-testnet-1}

echo "🔍 Verifying contract $ADDR on $CHAIN_ID..."

# Check if seid is installed
if ! command -v seid &> /dev/null; then
    echo "❌ seid CLI not found. Please install Sei CLI first."
    echo "Run: curl -s https://get.sei.io/install.sh | bash"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ jq not found. Please install jq first."
    exit 1
fi

echo "📋 Contract Info:"
seid query wasm contract $ADDR --node $RPC --chain-id $CHAIN_ID

echo ""
echo "🔍 Contract State:"
seid query wasm contract-state all $ADDR --node $RPC --chain-id $CHAIN_ID

echo ""
echo "💰 Contract Balance:"
seid query bank balances $ADDR --node $RPC --chain-id $CHAIN_ID

echo ""
echo "🔗 Explorer Link:"
echo "https://sei.explorers.guru/contract/$ADDR"
