#!/bin/bash

# 🦊 SeiMoney Contract Interaction Script with MetaMask
# This script uses MetaMask private key to interact with the contract

set -e

# Load environment variables
source .env

# Check for existence of deployed contract
if [ -z "$PAYMENTS_CONTRACT_ADDRESS" ]; then
    echo "❌ Contract address not found in .env file"
    echo "💡 Please deploy the contract first using: ./scripts/deploy-metamask.sh"
    exit 1
fi

echo "🦊 Interacting with SeiMoney contract using MetaMask"
echo "📍 Contract address: $PAYMENTS_CONTRACT_ADDRESS"
echo "👤 Wallet address: $WALLET_ADDRESS"
echo ""

# Function to query contract
query_contract() {
    local query_msg="$1"
    echo "🔍 Query: $query_msg"
    
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{
            "jsonrpc": "2.0",
            "method": "eth_call",
            "params": [{
                "to": "'$PAYMENTS_CONTRACT_ADDRESS'",
                "data": "'$(echo -n "$query_msg" | base64)'"
            }, "latest"],
            "id": 1
        }' \
        $SEI_RPC_URL | jq '.'
}

# Function to execute transaction
execute_contract() {
    local exec_msg="$1"
    local amount="$2"
    echo "⚡ Execute: $exec_msg"
    echo "💰 Amount: $amount"
    
    # Here we need to use seid or another tool for signing and sending
    ./scripts/seid tx wasm execute $PAYMENTS_CONTRACT_ADDRESS "$exec_msg" \
        --from $WALLET_ADDRESS \
        --private-key $PRIVATE_KEY \
        --chain-id $SEI_CHAIN_ID \
        --node $SEI_RPC_URL \
        --amount $amount \
        --gas auto \
        --gas-adjustment 1.3 \
        --fees 1000usei \
        --broadcast-mode block \
        --yes \
        --output json | jq '.'
}

# Interaction menu
while true; do
    echo ""
    echo "🎯 SeiMoney Contract Interaction Menu:"
    echo "1. Show contract settings"
    echo "2. Search transfer by ID"
    echo "3. عرض التحويلات المرسلة"
    echo "4. عرض التحويلات المستلمة"
    echo "5. إنشاء تحويل جديد"
    echo "6. استلام تحويل"
    echo "7. استرداد تحويل"
    echo "8. فحص الرصيد"
    echo "9. خروج"
    echo ""
    read -p "اختر خيار (1-9): " choice

    case $choice in
        1)
            query_contract '{"config":{}}'
            ;;
        2)
            read -p "أدخل رقم التحويل: " transfer_id
            query_contract '{"get_transfer":{"id":'$transfer_id'}}'
            ;;
        3)
            query_contract '{"list_by_sender":{"sender":"'$WALLET_ADDRESS'","start_after":null,"limit":10}}'
            ;;
        4)
            query_contract '{"list_by_recipient":{"recipient":"'$WALLET_ADDRESS'","start_after":null,"limit":10}}'
            ;;
        5)
            read -p "أدخل عنوان المستلم: " recipient
            read -p "أدخل المبلغ (بـ usei): " amount
            read -p "أدخل ساعات انتهاء الصلاحية: " hours
            read -p "أدخل ملاحظة (اختياري): " remark
            
            expiry=$(($(date +%s) + $hours * 3600))
            exec_msg='{"create_transfer":{"recipient":"'$recipient'","remark":"'$remark'","expiry_ts":'$expiry'}}'
            execute_contract "$exec_msg" "${amount}usei"
            ;;
        6)
            read -p "أدخل رقم التحويل للاستلام: " transfer_id
            exec_msg='{"claim_transfer":{"id":'$transfer_id'}}'
            execute_contract "$exec_msg" ""
            ;;
        7)
            read -p "أدخل رقم التحويل للاسترداد: " transfer_id
            exec_msg='{"refund_transfer":{"id":'$transfer_id'}}'
            execute_contract "$exec_msg" ""
            ;;
        8)
            ./scripts/check-balance.sh
            ;;
        9)
            echo "👋 وداعاً!"
            exit 0
            ;;
        *)
            echo "❌ خيار غير صحيح. حاول مرة أخرى."
            ;;
    esac
done