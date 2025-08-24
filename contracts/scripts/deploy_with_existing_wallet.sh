#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Deploy with Existing Wallet"
echo "=============================="

# Check if deployer wallet exists
if ! ./scripts/seid keys show deployer >/dev/null 2>&1; then
    echo "❌ Deployer wallet not found"
    exit 1
fi

DEPLOYER_ADDRESS=$(./scripts/seid keys show deployer -a)
echo "🔑 Deployer: $DEPLOYER_ADDRESS"

# Find working RPC endpoint
echo "🌐 Finding working RPC endpoint..."
RPC_ENDPOINTS=(
    "https://rpc.atlantic-2.seinetwork.io:443"
    "https://sei-testnet-rpc.polkachu.com"
    "https://rpc-testnet.sei-apis.com"
    "https://sei-testnet.rpc.kjnodes.com"
)

WORKING_RPC=""
for RPC in "${RPC_ENDPOINTS[@]}"; do
    if timeout 10 ./scripts/seid status --node "$RPC" >/dev/null 2>&1; then
        WORKING_RPC="$RPC"
        echo "✅ Using RPC: $WORKING_RPC"
        break
    fi
done

if [ -z "$WORKING_RPC" ]; then
    echo "❌ No working RPC endpoint found"
    exit 1
fi

# Check if account exists on chain first
echo "🔍 Checking account status..."
ACCOUNT_CHECK=$(./scripts/seid query account "$DEPLOYER_ADDRESS" \
    --node "$WORKING_RPC" \
    --output json 2>/dev/null || echo '{"error":"not_found"}')

if echo "$ACCOUNT_CHECK" | grep -q "not found"; then
    echo "❌ Account not found on chain!"
    echo ""
    echo "🔧 Account needs activation first:"
    echo "   Run: ./scripts/activate_account.sh"
    echo ""
    echo "💡 Quick fix: Send 0.1 SEI from MetaMask to activate account"
    
    # Convert to EVM format for MetaMask
    EVM_ADDRESS=$(./scripts/seid debug addr "$DEPLOYER_ADDRESS" | grep "Address (hex):" | awk '{print "0x" $3}')
    echo "   EVM Address: $EVM_ADDRESS"
    echo ""
    exit 1
fi

# Check balance
echo "💰 Checking balance..."
BALANCE_RESULT=$(./scripts/seid query bank balances "$DEPLOYER_ADDRESS" \
    --node "$WORKING_RPC" \
    --output json 2>/dev/null || echo '{"balances":[]}')

echo "📊 Balance result: $BALANCE_RESULT"

BALANCE=$(echo "$BALANCE_RESULT" | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")

if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ]; then
    echo ""
    echo "❌ Deployer wallet needs funds!"
    echo ""
    echo "🔄 Manual transfer needed:"
    echo "   1. Open MetaMask"
    echo "   2. Make sure you're on Sei Testnet"
    echo "   3. Send 2 SEI to: $DEPLOYER_ADDRESS"
    echo "   4. Wait for confirmation"
    echo "   5. Run this script again"
    echo ""
    echo "💡 Alternative: Use the EVM format address in MetaMask:"
    
    # Convert to EVM format
    EVM_ADDRESS=$(./scripts/seid debug addr "$DEPLOYER_ADDRESS" | grep "Address (hex):" | awk '{print "0x" $3}')
    echo "   EVM Address: $EVM_ADDRESS"
    echo ""
    exit 1
fi

# Convert balance to SEI for display
BALANCE_SEI=$(echo "scale=6; $BALANCE/1000000" | bc -l)
echo "✅ Balance: $BALANCE_SEI SEI ($BALANCE usei)"

# Check WASM file
WASM_FILE="artifacts/seimoney_payments.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    exit 1
fi

echo "📦 WASM file: $(ls -lh $WASM_FILE | awk '{print $5}')"

echo ""
echo "🚀 Starting deployment..."
echo "========================"

echo ""
echo "📤 Step 1: Storing contract code..."

STORE_TX=$(./scripts/seid tx wasm store "$WASM_FILE" \
    --from "deployer" \
    --chain-id "atlantic-2" \
    --node "$RPC" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Store TX: $STORE_TX"
echo "⏳ Waiting for confirmation..."
sleep 5

# Get code_id
echo "🔍 Getting code ID..."
CODE_ID=$(./scripts/seid q tx "$STORE_TX" \
    --node "$RPC" \
    --output json | jq -r '.logs[0].events[] | select(.type=="store_code").attributes[] | select(.key=="code_id").value')

echo "🆔 Code ID: $CODE_ID"

echo ""
echo "🏗️ Step 2: Instantiating contract..."

# Prepare init message
INIT_MSG='{
    "default_denom": "usei",
    "admin": "'$DEPLOYER_ADDRESS'"
}'

echo "📝 Init message: $INIT_MSG"

INSTANTIATE_TX=$(./scripts/seid tx wasm instantiate "$CODE_ID" "$INIT_MSG" \
    --label "SeiMoney Payments v1.0" \
    --from "deployer" \
    --chain-id "atlantic-2" \
    --node "$RPC" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Instantiate TX: $INSTANTIATE_TX"
echo "⏳ Waiting for confirmation..."
sleep 5

# Get contract address
echo "🔍 Getting contract address..."
CONTRACT_ADDRESS=$(./scripts/seid q tx "$INSTANTIATE_TX" \
    --node "$RPC" \
    --output json | jq -r '.logs[0].events[] | select(.type=="instantiate").attributes[] | select(.key=="_contract_address").value')

echo "🏠 Contract Address: $CONTRACT_ADDRESS"

# Save deployment info
DEPLOYMENT_INFO='{
    "chain_id": "atlantic-2",
    "code_id": "'$CODE_ID'",
    "contract_address": "'$CONTRACT_ADDRESS'",
    "deployer_address": "'$DEPLOYER_ADDRESS'",
    "deployment_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "store_tx": "'$STORE_TX'",
    "instantiate_tx": "'$INSTANTIATE_TX'",
    "wasm_file": "'$WASM_FILE'"
}'

echo "$DEPLOYMENT_INFO" | jq '.' > artifacts/deployment.json

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL! 🎉"
echo "=============================="
echo ""
echo "📄 Deployment saved to: artifacts/deployment.json"
echo ""
echo "🔗 Contract Details:"
echo "   Chain ID: atlantic-2"
echo "   Code ID: $CODE_ID"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Deployer: $DEPLOYER_ADDRESS"
echo "   Store TX: $STORE_TX"
echo "   Instantiate TX: $INSTANTIATE_TX"
echo ""
echo "🌐 Explorers:"
echo "   SeiTrace: https://seitrace.com/address/$CONTRACT_ADDRESS"
echo "   SeiStream: https://seistream.app/address/$CONTRACT_ADDRESS"
echo ""
echo "🧪 Test the contract:"
echo "   ./scripts/test_contract.sh"
echo ""
echo "✅ Ready for Step 4: Frontend Integration!"