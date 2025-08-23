#!/usr/bin/env bash
set -euo pipefail

echo "🤖 Automatic Transfer and Deploy"
echo "================================"

# Load environment variables
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    exit 1
fi

source .env

# Test RPC endpoints first
echo "🔍 Finding working RPC endpoint..."

RPC_ENDPOINTS=(
    "https://rpc-testnet.sei-apis.com:443"
    "https://sei-testnet.rpc.kjnodes.com:443"
    "https://rpc.atlantic-2.seinetwork.io:443"
)

WORKING_RPC=""
for RPC in "${RPC_ENDPOINTS[@]}"; do
    echo "🔄 Testing: $RPC"
    if timeout 5 curl -s "$RPC/status" >/dev/null 2>&1; then
        WORKING_RPC="$RPC"
        echo "✅ Working RPC found: $RPC"
        break
    else
        echo "❌ Failed: $RPC"
    fi
done

if [ -z "$WORKING_RPC" ]; then
    echo "❌ No working RPC found. Using default."
    WORKING_RPC="https://rpc-testnet.sei-apis.com:443"
fi

# Convert MetaMask address to Sei format
SEI_METAMASK=$(./scripts/seid debug addr ${WALLET_ADDRESS#0x} | grep "Bech32 Acc:" | awk '{print $3}')
DEPLOYER_ADDRESS=$(./scripts/seid keys show deployer -a)

echo "🦊 MetaMask (Sei): $SEI_METAMASK"
echo "🔑 Deployer: $DEPLOYER_ADDRESS"

# Check balances
echo ""
echo "💰 Checking balances..."

MM_BALANCE=$(./scripts/seid query bank balances "$SEI_METAMASK" \
    --node "$WORKING_RPC" \
    --output json | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")

DEPLOYER_BALANCE=$(./scripts/seid query bank balances "$DEPLOYER_ADDRESS" \
    --node "$WORKING_RPC" \
    --output json | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")

echo "🦊 MetaMask: $(python3 -c "print(f'{$MM_BALANCE/1000000:.6f}')") SEI"
echo "🔑 Deployer: $(python3 -c "print(f'{$DEPLOYER_BALANCE/1000000:.6f}')") SEI"

# Transfer if needed
if [ "$DEPLOYER_BALANCE" -lt 2000000 ]; then
    echo ""
    echo "💸 Transferring 2 SEI from MetaMask to Deployer..."
    
    # Create temporary key with MetaMask private key
    TEMP_KEY="temp-metamask"
    ./scripts/seid keys delete "$TEMP_KEY" --keyring-backend test -y 2>/dev/null || true
    
    # Import MetaMask private key
    CLEAN_KEY=${PRIVATE_KEY#0x}
    echo "$CLEAN_KEY" > /tmp/temp_key.txt
    echo "password123" | ./scripts/seid keys import "$TEMP_KEY" /tmp/temp_key.txt --keyring-backend test
    rm -f /tmp/temp_key.txt
    
    # Send transfer
    TRANSFER_TX=$(./scripts/seid tx bank send "$TEMP_KEY" "$DEPLOYER_ADDRESS" "2000000usei" \
        --keyring-backend test \
        --chain-id "atlantic-2" \
        --node "$WORKING_RPC" \
        --gas auto \
        --gas-adjustment 1.3 \
        --fees "20000usei" \
        --broadcast-mode block \
        --output json \
        -y | jq -r '.txhash')
    
    echo "📋 Transfer TX: $TRANSFER_TX"
    
    # Cleanup temp key
    ./scripts/seid keys delete "$TEMP_KEY" --keyring-backend test -y
    
    echo "⏳ Waiting for confirmation..."
    sleep 5
    
    # Check new balance
    DEPLOYER_BALANCE=$(./scripts/seid query bank balances "$DEPLOYER_ADDRESS" \
        --node "$WORKING_RPC" \
        --output json | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")
    
    echo "✅ New Deployer Balance: $(python3 -c "print(f'{$DEPLOYER_BALANCE/1000000:.6f}')") SEI"
fi

# Check WASM file
WASM_FILE="artifacts/seimoney_payments.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    exit 1
fi

echo ""
echo "🚀 Starting Contract Deployment..."
echo "=================================="

echo "📦 WASM file: $(ls -lh $WASM_FILE | awk '{print $5}')"

echo ""
echo "📤 Step 1: Storing contract code..."

STORE_TX=$(./scripts/seid tx wasm store "$WASM_FILE" \
    --from "deployer" \
    --chain-id "atlantic-2" \
    --node "$WORKING_RPC" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Store TX: $STORE_TX"
sleep 5

# Get code_id
CODE_ID=$(./scripts/seid q tx "$STORE_TX" \
    --node "$WORKING_RPC" \
    --output json | jq -r '.logs[0].events[] | select(.type=="store_code").attributes[] | select(.key=="code_id").value')

echo "🆔 Code ID: $CODE_ID"

echo ""
echo "🏗️ Step 2: Instantiating contract..."

# Prepare init message
INIT_MSG='{
    "default_denom": "usei",
    "admin": "'$DEPLOYER_ADDRESS'"
}'

INSTANTIATE_TX=$(./scripts/seid tx wasm instantiate "$CODE_ID" "$INIT_MSG" \
    --label "SeiMoney Payments v1.0" \
    --from "deployer" \
    --chain-id "atlantic-2" \
    --node "$WORKING_RPC" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Instantiate TX: $INSTANTIATE_TX"
sleep 5

# Get contract address
CONTRACT_ADDRESS=$(./scripts/seid q tx "$INSTANTIATE_TX" \
    --node "$WORKING_RPC" \
    --output json | jq -r '.logs[0].events[] | select(.type=="instantiate").attributes[] | select(.key=="_contract_address").value')

echo "🏠 Contract Address: $CONTRACT_ADDRESS"

# Save deployment info
DEPLOYMENT_INFO='{
    "chain_id": "atlantic-2",
    "code_id": "'$CODE_ID'",
    "contract_address": "'$CONTRACT_ADDRESS'",
    "deployer_address": "'$DEPLOYER_ADDRESS'",
    "metamask_address": "'$WALLET_ADDRESS'",
    "deployment_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "store_tx": "'$STORE_TX'",
    "instantiate_tx": "'$INSTANTIATE_TX'",
    "transfer_tx": "'${TRANSFER_TX:-none}'",
    "wasm_file": "'$WASM_FILE'",
    "rpc_used": "'$WORKING_RPC'"
}'

echo "$DEPLOYMENT_INFO" | jq '.' > artifacts/deployment.json

# Update .env file
sed -i.bak "s/PAYMENTS_CONTRACT_ADDRESS=.*/PAYMENTS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL! 🎉"
echo "=============================="
echo ""
echo "📄 Deployment saved to: artifacts/deployment.json"
echo "📝 Contract address updated in .env"
echo ""
echo "🔗 Contract Details:"
echo "   Chain ID: atlantic-2"
echo "   Code ID: $CODE_ID"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   RPC Used: $WORKING_RPC"
echo ""
echo "🌐 Explorers:"
echo "   SeiTrace: https://seitrace.com/address/$CONTRACT_ADDRESS"
echo "   SeiStream: https://seistream.app/address/$CONTRACT_ADDRESS"
echo ""
echo "✅ Ready for Step 4: Frontend Integration!"