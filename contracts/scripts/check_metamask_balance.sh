#!/usr/bin/env bash
set -euo pipefail

echo "🦊 Checking MetaMask Balance on Sei Testnet"
echo "==========================================="

# Load environment variables
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    exit 1
fi

source .env

if [ -z "$WALLET_ADDRESS" ]; then
    echo "❌ WALLET_ADDRESS not set in .env"
    exit 1
fi

echo "🔑 MetaMask Address: $WALLET_ADDRESS"
echo "🌐 Network: Sei Testnet (Chain ID: $SEI_CHAIN_ID)"
echo "🔗 RPC: $SEI_RPC_URL"

# Check balance using curl (EVM RPC)
echo ""
echo "💰 Checking balance via EVM RPC..."

BALANCE_HEX=$(curl -s -X POST "$SEI_RPC_URL" \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc": "2.0",
        "method": "eth_getBalance",
        "params": ["'$WALLET_ADDRESS'", "latest"],
        "id": 1
    }' | jq -r '.result')

if [ "$BALANCE_HEX" != "null" ] && [ "$BALANCE_HEX" != "" ]; then
    # Convert hex to decimal
    BALANCE_WEI=$(printf "%d" "$BALANCE_HEX")
    BALANCE_SEI=$(echo "scale=6; $BALANCE_WEI/1000000000000000000" | bc)
    
    echo "✅ Balance: $BALANCE_SEI SEI"
    echo "📊 Raw: $BALANCE_WEI wei"
    
    # Check if enough for deployment
    MIN_BALANCE=1000000000000000000  # 1 SEI in wei
    if [ "$BALANCE_WEI" -gt "$MIN_BALANCE" ]; then
        echo "🚀 Sufficient balance for deployment!"
    else
        echo "⚠️  Low balance. Recommended: 1+ SEI for deployment"
        echo "🚰 Get tokens from: https://faucet.seinetwork.io/"
    fi
else
    echo "❌ Could not fetch balance"
    echo "🔧 Possible issues:"
    echo "   - Network not configured correctly"
    echo "   - RPC endpoint down"
    echo "   - Address format incorrect"
fi

echo ""
echo "🔗 Useful Links:"
echo "   Explorer: https://seitrace.com/address/$WALLET_ADDRESS"
echo "   Faucet: https://faucet.seinetwork.io/"
echo ""

# Also try Cosmos RPC for comparison
echo "🔄 Also checking via Cosmos RPC..."
SEID="./scripts/seid"

# Convert EVM address to Sei address
SEI_ADDRESS=$($SEID debug addr "$WALLET_ADDRESS" 2>/dev/null | grep "Address (hex):" | awk '{print $3}' || echo "")

if [ ! -z "$SEI_ADDRESS" ]; then
    echo "🔄 Sei Address: $SEI_ADDRESS"
    
    COSMOS_BALANCE=$($SEID query bank balances "$SEI_ADDRESS" \
        --node "https://rpc.atlantic-2.seinetwork.io:443" \
        --output json 2>/dev/null | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")
    
    if [ "$COSMOS_BALANCE" != "0" ] && [ ! -z "$COSMOS_BALANCE" ]; then
        COSMOS_SEI=$(echo "scale=6; $COSMOS_BALANCE/1000000" | bc)
        echo "✅ Cosmos Balance: $COSMOS_SEI SEI ($COSMOS_BALANCE usei)"
    fi
fi