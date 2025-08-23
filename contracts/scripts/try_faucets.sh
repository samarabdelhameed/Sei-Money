#!/usr/bin/env bash
set -euo pipefail

FROM="${FROM:-deployer}"
SEID="./scripts/seid"

echo "🚰 Trying Multiple Sei Testnet Faucets"
echo "======================================"

# Get wallet address
if ! $SEID keys show "$FROM" >/dev/null 2>&1; then
    echo "❌ Wallet '$FROM' not found"
    exit 1
fi

DEPLOYER_ADDRESS=$($SEID keys show "$FROM" -a)
echo "🔑 Address: $DEPLOYER_ADDRESS"
echo ""

# Try different faucet endpoints
FAUCETS=(
    "https://faucet.atlantic-2.seinetwork.io/credit"
    "https://sei-faucet.vercel.app/api/faucet"
    "https://faucet.seinetwork.io/credit"
)

for i in "${!FAUCETS[@]}"; do
    FAUCET_URL="${FAUCETS[$i]}"
    echo "🔄 Trying faucet $((i+1)): $FAUCET_URL"
    
    # Try POST request with address
    RESPONSE=$(curl -s -X POST "$FAUCET_URL" \
        -H "Content-Type: application/json" \
        -d "{\"address\":\"$DEPLOYER_ADDRESS\"}" \
        --connect-timeout 10 || echo "failed")
    
    if [ "$RESPONSE" != "failed" ]; then
        echo "📋 Response: $RESPONSE"
        if echo "$RESPONSE" | grep -q "success\|Success\|sent\|Sent"; then
            echo "✅ Faucet request successful!"
            echo "⏳ Waiting 30 seconds for tokens..."
            sleep 30
            
            # Check balance
            ./scripts/check_balance.sh
            exit 0
        fi
    else
        echo "❌ Faucet $((i+1)) failed"
    fi
    
    echo ""
done

echo "❌ All automatic faucets failed."
echo ""
echo "🔧 Manual Options:"
echo ""
echo "1. Join Sei Discord and use faucet bot:"
echo "   https://discord.gg/sei"
echo "   Go to #faucet channel"
echo "   Type: !faucet $DEPLOYER_ADDRESS"
echo ""
echo "2. Use Sei Wallet interface:"
echo "   https://wallet.sei.io/"
echo "   Import your mnemonic"
echo "   Use built-in faucet"
echo ""
echo "3. Ask in Sei community:"
echo "   Telegram: https://t.me/seinetwork"
echo "   Discord: https://discord.gg/sei"
echo ""

# Show mnemonic for wallet import
echo "🔐 To import wallet elsewhere, you need the mnemonic:"
echo "   Run: $SEID keys export $FROM"
echo "   (Keep this private!)"