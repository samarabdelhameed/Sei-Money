#!/bin/bash

# 🔍 Check deployment status

echo "🔍 Checking SeiMoney deployment status..."

# Check if seid exists (use local mock if available)
if [ -f "./seid" ]; then
    SEID_CMD="./seid"
elif command -v seid &> /dev/null; then
    SEID_CMD="seid"
else
    echo "❌ seid not installed"
    exit 1
fi

# Check if wallet exists
WALLET_NAME="deployer"
if ! $SEID_CMD keys show $WALLET_NAME 2>/dev/null; then
    echo "❌ Wallet not found. Run:"
    echo "   ./scripts/setup-dev-wallet.sh"
    exit 1
fi

ADDRESS=$($SEID_CMD keys show $WALLET_NAME -a)
echo "✅ Wallet exists: $ADDRESS"

# Check balance
echo "💰 Checking balance..."
BALANCE=$($SEID_CMD query bank balances $ADDRESS --output json 2>/dev/null | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null)
if [ -z "$BALANCE" ] || [ "$BALANCE" = "0" ]; then
    echo "❌ No balance. Get tokens from:"
    echo "   https://faucet.seinetwork.io/"
    echo "   Address: $ADDRESS"
else
    echo "✅ Balance: $BALANCE usei"
fi

# Check contract build
echo "🔧 Checking contract build..."
if [ -f "artifacts/seimoney_payments.wasm" ]; then
    SIZE=$(ls -lh artifacts/seimoney_payments.wasm | awk '{print $5}')
    echo "✅ Contract built: $SIZE"
else
    echo "❌ Contract not built. Run:"
    echo "   cd contracts && cargo build --release --target wasm32-unknown-unknown"
fi

# Check deployment
echo "📋 Checking deployment status..."
if [ -f "artifacts/deployment.json" ]; then
    echo "✅ Contract deployed:"
    cat artifacts/deployment.json | jq .
    
    CONTRACT_ADDRESS=$(cat artifacts/deployment.json | jq -r .contract_address)
    echo ""
    echo "🔗 Contract link:"
    echo "   https://seistream.app/address/$CONTRACT_ADDRESS"
else
    echo "❌ Contract not deployed. Run:"
    echo "   npm run contracts:deploy-rest"
fi

echo ""
echo "📋 Status summary:"
echo "   Wallet: $([ ! -z "$ADDRESS" ] && echo "✅" || echo "❌")"
echo "   Balance: $([ ! -z "$BALANCE" ] && [ "$BALANCE" != "0" ] && echo "✅" || echo "❌")"
echo "   Build: $([ -f "contracts/artifacts/seimoney_payments.wasm" ] && echo "✅" || echo "❌")"
echo "   Deploy: $([ -f "contracts/artifacts/deployment.json" ] && echo "✅" || echo "❌")"