#!/usr/bin/env bash
set -euo pipefail

FROM="${FROM:-deployer}"
SEID="./scripts/seid"

echo "💰 SeiMoney Wallet Funding Helper"
echo "================================="

# Get wallet address
if ! $SEID keys show "$FROM" >/dev/null 2>&1; then
    echo "❌ Wallet '$FROM' not found"
    exit 1
fi

DEPLOYER_ADDRESS=$($SEID keys show "$FROM" -a)
echo "🔑 Wallet Address: $DEPLOYER_ADDRESS"
echo ""

echo "🚰 Funding Options (Try in order):"
echo ""
echo "1. Sei Discord Faucet (Most Reliable):"
echo "   https://discord.gg/sei"
echo "   Go to #faucet channel"
echo "   Use: !faucet $DEPLOYER_ADDRESS"
echo ""
echo "2. Alternative Faucets:"
echo "   https://faucet.atlantic-2.seinetwork.io/"
echo "   https://sei-faucet.vercel.app/"
echo ""
echo "3. Community Faucets:"
echo "   Search 'Sei testnet faucet' on Google"
echo "   Check Sei documentation for updated links"
echo ""

# Copy address to clipboard if possible
if command -v pbcopy >/dev/null 2>&1; then
    echo "$DEPLOYER_ADDRESS" | pbcopy
    echo "✅ Address copied to clipboard!"
elif command -v xclip >/dev/null 2>&1; then
    echo "$DEPLOYER_ADDRESS" | xclip -selection clipboard
    echo "✅ Address copied to clipboard!"
fi

echo ""
echo "📋 Manual Steps:"
echo "1. Copy this address: $DEPLOYER_ADDRESS"
echo "2. Go to: https://faucet.seinetwork.io/"
echo "3. Paste the address and request tokens"
echo "4. Wait 1-2 minutes for confirmation"
echo "5. Run: ./scripts/check_balance.sh"
echo ""

# Wait for user confirmation
echo "Press Enter after funding the wallet..."
read -r

# Check balance
echo "🔍 Checking balance..."
NODE="https://rpc.atlantic-2.seinetwork.io:443"
BALANCE_RESULT=$($SEID query bank balances "$DEPLOYER_ADDRESS" --node "$NODE" --output json 2>/dev/null || echo '{"balances":[]}')
BALANCE=$(echo "$BALANCE_RESULT" | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")

if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ]; then
    echo "❌ No balance found. Please try again or wait a few minutes."
    echo "🔄 You can check balance manually with:"
    echo "   ./scripts/check_balance.sh"
else
    echo "✅ Balance: $BALANCE usei ($(echo "scale=6; $BALANCE/1000000" | bc) SEI)"
    echo ""
    echo "🚀 Ready to deploy! Run:"
    echo "   ./scripts/deploy_sei.sh"
fi