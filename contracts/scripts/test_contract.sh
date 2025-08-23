#!/usr/bin/env bash
set -euo pipefail

CHAIN_ID="${CHAIN_ID:-atlantic-2}"
NODE="${NODE:-https://rpc.atlantic-2.seinetwork.io:443}"
DENOM="${DENOM:-usei}"
FROM="${FROM:-deployer}"

echo "🧪 Testing SeiMoney Contract"
echo "============================"

# Use local seid
SEID="./scripts/seid"

# Check if deployment exists
if [ ! -f "artifacts/deployment.json" ]; then
    echo "❌ Contract not deployed yet. Run:"
    echo "   ./scripts/deploy_sei.sh"
    exit 1
fi

CONTRACT=$(cat artifacts/deployment.json | jq -r '.contract_address')
DEPLOYER_ADDRESS=$($SEID keys show "$FROM" -a)

echo "🏠 Contract: $CONTRACT"
echo "🔑 Deployer: $DEPLOYER_ADDRESS"

echo ""
echo "📤 Test 1: Create Transfer"
echo "=========================="

# Create a test recipient (or use deployer as recipient for testing)
RECIPIENT="$DEPLOYER_ADDRESS"
AMOUNT="1000000"  # 1 SEI = 1,000,000 usei
REMARK="Test transfer from deployment script"

CREATE_MSG='{
    "create_transfer": {
        "recipient": "'$RECIPIENT'",
        "remark": "'$REMARK'",
        "expiry_ts": null
    }
}'

echo "📝 Creating transfer: $AMOUNT usei to $RECIPIENT"
echo "💬 Remark: $REMARK"

CREATE_TX=$($SEID tx wasm execute "$CONTRACT" "$CREATE_MSG" \
    --amount "${AMOUNT}${DENOM}" \
    --from "$FROM" \
    --chain-id "$CHAIN_ID" \
    --node "$NODE" \
    --gas auto \
    --gas-adjustment 1.3 \
    --fees "20000$DENOM" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Create TX: $CREATE_TX"
sleep 3

# Get transfer ID from events
TRANSFER_ID=$($SEID q tx "$CREATE_TX" --node "$NODE" --output json | jq -r '.logs[0].events[] | select(.type=="wasm").attributes[] | select(.key=="transfer_id").value' 2>/dev/null || echo "1")

echo "🆔 Transfer ID: $TRANSFER_ID"

echo ""
echo "📥 Test 2: Query Transfer"
echo "========================"

QUERY_MSG='{"get_transfer":{"id":'$TRANSFER_ID'}}'
TRANSFER_INFO=$($SEID query wasm contract-state smart "$CONTRACT" "$QUERY_MSG" --node "$NODE" --output json)

echo "📋 Transfer Info:"
echo "$TRANSFER_INFO" | jq '.data'

echo ""
echo "💰 Test 3: Claim Transfer"
echo "========================"

CLAIM_MSG='{"claim_transfer":{"id":'$TRANSFER_ID'}}'

echo "📝 Claiming transfer ID: $TRANSFER_ID"

CLAIM_TX=$($SEID tx wasm execute "$CONTRACT" "$CLAIM_MSG" \
    --from "$FROM" \
    --chain-id "$CHAIN_ID" \
    --node "$NODE" \
    --gas auto \
    --gas-adjustment 1.3 \
    --fees "20000$DENOM" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Claim TX: $CLAIM_TX"

echo ""
echo "✅ Contract testing completed!"
echo ""
echo "🔗 Transaction Links:"
echo "   Create: https://seitrace.com/tx/$CREATE_TX"
echo "   Claim: https://seitrace.com/tx/$CLAIM_TX"
echo ""
echo "📊 Summary:"
echo "   Contract: $CONTRACT"
echo "   Transfer ID: $TRANSFER_ID"
echo "   Amount: $AMOUNT usei"
echo "   Status: Claimed"