#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.."; pwd)

echo "💸 Funding wallet from Sei testnet faucet..."

# Check if seid is installed
if ! command -v seid &> /dev/null; then
    echo "❌ Sei CLI not found. Please run ./scripts/setup_dev.sh first"
    exit 1
fi

# Check if wallet exists
if ! seid keys list | grep -q "test"; then
    echo "❌ Wallet 'test' not found. Please run ./scripts/setup_wallet.sh first"
    exit 1
fi

# Get wallet address
ADDRESS=$(seid keys show test -a)
echo "📍 Funding wallet: $ADDRESS"

# Check current balance
echo "💰 Current balance:"
seid query bank balances $ADDRESS --node https://rpc.testnet.sei.io

echo ""
echo "🚀 Requesting funds from faucet..."

# Try multiple faucet endpoints
FAUCETS=(
    "https://sei-faucet.vercel.app/api/faucet"
    "https://faucet.sei.io/claim"
    "https://sei-testnet-faucet.vercel.app/api/faucet"
)

FUNDED=false
for faucet in "${FAUCETS[@]}"; do
    echo "🔄 Trying faucet: $faucet"
    
    if curl -s -X POST "$faucet" \
        -H "Content-Type: application/json" \
        -d "{\"address\":\"$ADDRESS\"}" > /dev/null 2>&1; then
        echo "✅ Funds requested from $faucet"
        FUNDED=true
        break
    else
        echo "❌ Failed to request from $faucet"
    fi
done

if [ "$FUNDED" = false ]; then
    echo ""
    echo "⚠️ Automatic faucet request failed"
    echo "📋 Manual steps:"
    echo "1. Visit: https://sei-faucet.vercel.app/"
    echo "2. Enter address: $ADDRESS"
    echo "3. Click 'Request Funds'"
    echo "4. Wait a few minutes for confirmation"
else
    echo ""
    echo "⏳ Waiting for funds to arrive..."
    echo "This may take a few minutes..."
    
    # Wait and check balance
    for i in {1..10}; do
        sleep 30
        echo "🔄 Checking balance (attempt $i/10)..."
        BALANCE=$(seid query bank balances $ADDRESS --node https://rpc.testnet.sei.io -o json | jq -r '.balances[0].amount // "0"')
        if [ "$BALANCE" != "0" ] && [ "$BALANCE" != "null" ]; then
            echo "🎉 Funds received! New balance: $BALANCE usei"
            break
        fi
    done
fi

echo ""
echo "💰 Final balance:"
seid query bank balances $ADDRESS --node https://rpc.testnet.sei.io

echo ""
echo "💡 You can now deploy contracts with: ./scripts/deploy_sei.sh <contract_name>"
