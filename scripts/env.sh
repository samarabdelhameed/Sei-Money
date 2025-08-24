#!/usr/bin/env bash

# Sei Network Environment Variables
export CHAIN_ID=sei-testnet-1
export DENOM=usei
export RPC_URL=https://rpc.testnet.sei.io
export REST_URL=https://rest.testnet.sei.io
export WALLET=test

# Optional: Override with custom values
if [ -f ".env.local" ]; then
    echo "📁 Loading .env.local..."
    source .env.local
fi

echo "🌐 Sei Network Environment:"
echo "   Chain ID: $CHAIN_ID"
echo "   Denom: $DENOM"
echo "   RPC: $RPC_URL"
echo "   Wallet: $WALLET"
echo ""
echo "💡 To use: source scripts/env.sh"
