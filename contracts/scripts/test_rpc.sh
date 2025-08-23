#!/usr/bin/env bash

echo "🔍 Testing RPC Endpoints"
echo "========================"

RPC_ENDPOINTS=(
    "https://rpc.atlantic-2.seinetwork.io:443"
    "https://sei-testnet-rpc.polkachu.com:443"
    "https://rpc-testnet.sei-apis.com:443"
    "https://sei-testnet.rpc.kjnodes.com:443"
    "https://rpc.sei-apis.com:443"
)

DEPLOYER_ADDRESS="sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk"

for i in "${!RPC_ENDPOINTS[@]}"; do
    RPC="${RPC_ENDPOINTS[$i]}"
    echo ""
    echo "🔄 Testing RPC $((i+1)): $RPC"
    
    # Test with timeout
    RESULT=$(timeout 10 ./scripts/seid query bank balances "$DEPLOYER_ADDRESS" \
        --node "$RPC" \
        --output json 2>/dev/null || echo "failed")
    
    if [ "$RESULT" != "failed" ]; then
        echo "✅ Working! Response:"
        echo "$RESULT" | jq '.'
        echo ""
        echo "🎯 Use this RPC: $RPC"
        break
    else
        echo "❌ Failed"
    fi
done