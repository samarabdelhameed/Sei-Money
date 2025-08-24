#!/usr/bin/env bash
set -euo pipefail

# Quick deploy all contracts to Sei testnet
# Usage: ./scripts/quick_deploy.sh

ROOT=$(cd "$(dirname "$0")/.."; pwd)

echo "🚀 Quick Deploy - All Contracts to Sei Testnet"

# Load environment
source "$ROOT/scripts/env.sh"

# Check if wallet exists
if ! seid keys list | grep -q "$WALLET"; then
    echo "❌ Wallet '$WALLET' not found. Please run: make setup-wallet"
    exit 1
fi

# Check wallet balance
ADDRESS=$(seid keys show $WALLET -a)
BALANCE=$(seid query bank balances $ADDRESS --node $RPC_URL -o json | jq -r '.balances[0].amount // "0"')

echo "💰 Wallet balance: $BALANCE $DENOM"

if [ "$BALANCE" = "0" ] || [ "$BALANCE" = "null" ]; then
    echo "⚠️ Insufficient balance. Please fund your wallet first:"
    echo "   make fund-wallet"
    exit 1
fi

# Build contracts if needed
echo "🏗️ Building contracts..."
cd "$ROOT"
make build

# Deploy all contracts
CONTRACTS=("payments" "groups" "pots" "alias" "risk_escrow" "vaults")
DEPLOYED=()

for contract in "${CONTRACTS[@]}"; do
    echo ""
    echo "🚀 Deploying $contract..."
    
    if ./scripts/deploy_sei.sh "$contract"; then
        DEPLOYED+=("$contract")
        echo "✅ $contract deployed successfully"
    else
        echo "❌ Failed to deploy $contract"
    fi
done

echo ""
echo "🎉 Deployment Summary:"
echo "✅ Successfully deployed: ${DEPLOYED[*]}"
echo "📊 Total contracts: ${#CONTRACTS[@]}"
echo "✅ Successful: ${#DEPLOYED[@]}"
echo "❌ Failed: $((${#CONTRACTS[@]} - ${#DEPLOYED[@]}))"

if [ ${#DEPLOYED[@]} -eq ${#CONTRACTS[@]} ]; then
    echo ""
    echo "🎊 All contracts deployed successfully!"
    echo "💡 Next steps:"
    echo "   1. Verify contracts: make verify ADDR=<address>"
    echo "   2. Test functionality"
    echo "   3. Update frontend configuration"
else
    echo ""
    echo "⚠️ Some contracts failed to deploy. Please check the logs above."
    exit 1
fi
