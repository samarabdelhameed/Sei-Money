#!/bin/bash

# 💰 Check wallet balance on Sei Testnet

set -e

# Load environment variables
source .env

echo "🦊 Checking MetaMask balance on Sei Testnet..."
echo "📍 Address: $WALLET_ADDRESS"
echo ""

# Check balance using curl
echo "🔍 Checking balance..."

BALANCE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_getBalance",
    "params": ["'$WALLET_ADDRESS'", "latest"],
    "id": 1
  }' \
  $SEI_RPC_URL)

# Extract balance from response
BALANCE_HEX=$(echo $BALANCE_RESPONSE | jq -r '.result')

if [ "$BALANCE_HEX" = "null" ] || [ -z "$BALANCE_HEX" ]; then
    echo "❌ Error getting balance"
    echo "Response: $BALANCE_RESPONSE"
    exit 1
fi

# Convert from hex to decimal
BALANCE_WEI=$(printf "%d" $BALANCE_HEX)
BALANCE_SEI=$(echo "scale=6; $BALANCE_WEI / 1000000000000000000" | bc -l)

echo "💰 Current balance: $BALANCE_SEI SEI"

# Check if balance is sufficient for deployment
MIN_BALANCE="0.1"
if (( $(echo "$BALANCE_SEI < $MIN_BALANCE" | bc -l) )); then
    echo "⚠️  Warning: Balance too low for deployment!"
    echo "🔗 Get more from: https://faucet.seinetwork.io/"
    echo "📋 Enter your address: $WALLET_ADDRESS"
else
    echo "✅ Balance sufficient for deployment!"
fi

echo ""
echo "🔗 Useful links:"
echo "   Faucet: https://faucet.seinetwork.io/"
echo "   Explorer: https://seitrace.com/address/$WALLET_ADDRESS"
echo "   RPC: $SEI_RPC_URL"