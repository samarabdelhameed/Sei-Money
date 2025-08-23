#!/usr/bin/env bash
set -euo pipefail

FROM="${FROM:-deployer}"
NODE="${NODE:-https://rpc.atlantic-2.seinetwork.io:443}"
SEID="./scripts/seid"

echo "💰 Checking Wallet Balance"
echo "=========================="

# Get wallet address
if ! $SEID keys show "$FROM" >/dev/null 2>&1; then
    echo "❌ Wallet '$FROM' not found"
    exit 1
fi

DEPLOYER_ADDRESS=$($SEID keys show "$FROM" -a)
echo "🔑 Address: $DEPLOYER_ADDRESS"

# Check balance
echo "🔍 Querying balance..."
BALANCE_RESULT=$($SEID query bank balances "$DEPLOYER_ADDRESS" --node "$NODE" --output json 2>/dev/null || echo '{"balances":[]}')

echo "📊 Raw Response:"
echo "$BALANCE_RESULT" | jq '.'

BALANCE=$(echo "$BALANCE_RESULT" | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")

echo ""
if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ]; then
    echo "❌ No balance found"
    echo "🚰 Get tokens from: https://faucet.seinetwork.io/"
    echo "📋 Address: $DEPLOYER_ADDRESS"
else
    echo "✅ Balance: $BALANCE usei"
    echo "💎 In SEI: $(echo "scale=6; $BALANCE/1000000" | bc) SEI"
    
    # Check if enough for deployment (need ~100k usei for gas)
    if [ "$BALANCE" -gt 100000 ]; then
        echo "🚀 Sufficient balance for deployment!"
        echo "   Run: ./scripts/deploy_sei.sh"
    else
        echo "⚠️  Low balance. Recommended: 1+ SEI for deployment"
    fi
fi