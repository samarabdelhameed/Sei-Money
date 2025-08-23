#!/usr/bin/env bash
set -euo pipefail

echo "🔑 Account Activation"
echo "===================="

# Check if deployer wallet exists
if ! ./scripts/seid keys show deployer >/dev/null 2>&1; then
    echo "❌ Deployer wallet not found"
    exit 1
fi

DEPLOYER_ADDRESS=$(./scripts/seid keys show deployer -a)
echo "🔑 Deployer: $DEPLOYER_ADDRESS"

# Try different RPC endpoints
RPC_ENDPOINTS=(
    "https://rpc.atlantic-2.seinetwork.io:443"
    "https://sei-testnet-rpc.polkachu.com"
    "https://rpc-testnet.sei-apis.com"
    "https://sei-testnet.rpc.kjnodes.com"
)

echo "🌐 Testing RPC endpoints..."

WORKING_RPC=""
for RPC in "${RPC_ENDPOINTS[@]}"; do
    echo "   Testing: $RPC"
    if timeout 10 ./scripts/seid status --node "$RPC" >/dev/null 2>&1; then
        echo "   ✅ Working: $RPC"
        WORKING_RPC="$RPC"
        break
    else
        echo "   ❌ Failed: $RPC"
    fi
done

if [ -z "$WORKING_RPC" ]; then
    echo "❌ No working RPC endpoint found"
    exit 1
fi

echo "🚀 Using RPC: $WORKING_RPC"

# Check if account exists
echo "🔍 Checking account status..."
ACCOUNT_INFO=$(./scripts/seid query account "$DEPLOYER_ADDRESS" \
    --node "$WORKING_RPC" \
    --output json 2>/dev/null || echo '{"error":"not_found"}')

if echo "$ACCOUNT_INFO" | grep -q "not found"; then
    echo "⚠️  Account not found on chain - needs activation"
    echo ""
    echo "💡 Account activation options:"
    echo ""
    echo "Option 1: Send funds from MetaMask"
    echo "   1. Open MetaMask"
    echo "   2. Make sure you're on Sei Testnet"
    echo "   3. Send 0.1 SEI to: $DEPLOYER_ADDRESS"
    echo "   4. This will activate the account"
    echo ""
    echo "Option 2: Use EVM format address"
    
    # Convert to EVM format
    EVM_ADDRESS=$(./scripts/seid debug addr "$DEPLOYER_ADDRESS" | grep "Address (hex):" | awk '{print "0x" $3}')
    echo "   EVM Address: $EVM_ADDRESS"
    echo "   Send 0.1 SEI to this address in MetaMask"
    echo ""
    echo "Option 3: Use faucet (if available)"
    echo "   Try: https://faucet.sei-apis.com/"
    echo "   Or: https://atlantic-2.app.sei.io/faucet"
    echo ""
    echo "After sending funds, run this script again to verify activation."
    exit 1
else
    echo "✅ Account exists on chain"
    
    # Check balance
    BALANCE_RESULT=$(./scripts/seid query bank balances "$DEPLOYER_ADDRESS" \
        --node "$WORKING_RPC" \
        --output json)
    
    BALANCE=$(echo "$BALANCE_RESULT" | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")
    
    if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ]; then
        echo "⚠️  Account activated but has no balance"
        echo "💰 Send some SEI to continue with deployment"
    else
        BALANCE_SEI=$(echo "scale=6; $BALANCE/1000000" | bc -l)
        echo "✅ Account balance: $BALANCE_SEI SEI ($BALANCE usei)"
        
        if (( $(echo "$BALANCE >= 1000000" | bc -l) )); then
            echo "🎉 Account ready for deployment!"
            echo ""
            echo "Next step: ./scripts/deploy_with_existing_wallet.sh"
        else
            echo "⚠️  Low balance - recommend at least 1 SEI for deployment"
        fi
    fi
fi

echo ""
echo "📋 Account Summary:"
echo "   Address: $DEPLOYER_ADDRESS"
echo "   EVM Format: $EVM_ADDRESS"
echo "   RPC: $WORKING_RPC"
echo "   Status: $(echo "$ACCOUNT_INFO" | grep -q "not found" && echo "Not activated" || echo "Activated")"