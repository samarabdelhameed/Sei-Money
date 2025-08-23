#!/usr/bin/env bash
set -euo pipefail

echo "💸 Transfer from MetaMask and Deploy Contract"
echo "============================================="

# Load environment variables
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    exit 1
fi

source .env

# Convert MetaMask address to Sei format
SEI_METAMASK=$(./scripts/seid debug addr ${WALLET_ADDRESS#0x} | grep "Bech32 Acc:" | awk '{print $3}')
echo "🦊 MetaMask (Sei format): $SEI_METAMASK"

# Get deployer address
DEPLOYER_ADDRESS=$(./scripts/seid keys show deployer -a)
echo "🔑 Deployer Address: $DEPLOYER_ADDRESS"

# Check MetaMask balance
echo "💰 Checking MetaMask balance..."
MM_BALANCE=$(./scripts/seid query bank balances "$SEI_METAMASK" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
    --output json | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")

MM_SEI=$(echo "scale=6; $MM_BALANCE/1000000" | bc)
echo "✅ MetaMask Balance: $MM_SEI SEI"

# Check deployer balance
DEPLOYER_BALANCE=$(./scripts/seid query bank balances "$DEPLOYER_ADDRESS" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
    --output json | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")

if [ "$DEPLOYER_BALANCE" != "0" ] && [ ! -z "$DEPLOYER_BALANCE" ]; then
    DEPLOYER_SEI=$(echo "scale=6; $DEPLOYER_BALANCE/1000000" | bc)
else
    DEPLOYER_SEI="0.000000"
fi
echo "💼 Deployer Balance: $DEPLOYER_SEI SEI"

# If deployer has enough balance, skip transfer
if [ "$DEPLOYER_BALANCE" -gt 2000000 ]; then
    echo "✅ Deployer has sufficient balance. Proceeding with deployment..."
else
    echo "❌ Deployer needs more funds"
    echo ""
    echo "🔄 Please transfer 2 SEI from MetaMask to deployer:"
    echo "   From: $WALLET_ADDRESS"
    echo "   To: $DEPLOYER_ADDRESS"
    echo "   Amount: 2 SEI"
    echo ""
    echo "📱 Steps in MetaMask:"
    echo "   1. Make sure you're on Sei Testnet"
    echo "   2. Click Send"
    echo "   3. Paste address: $DEPLOYER_ADDRESS"
    echo "   4. Send 2 SEI"
    echo "   5. Wait for confirmation"
    echo ""
    echo "Press Enter after sending the transfer..."
    read -r
    
    # Wait and check again
    echo "⏳ Waiting 30 seconds for confirmation..."
    sleep 30
    
    DEPLOYER_BALANCE=$(./scripts/seid query bank balances "$DEPLOYER_ADDRESS" \
        --node "https://rpc.atlantic-2.seinetwork.io:443" \
        --output json | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")
    
    DEPLOYER_SEI=$(echo "scale=6; $DEPLOYER_BALANCE/1000000" | bc)
    echo "💼 New Deployer Balance: $DEPLOYER_SEI SEI"
    
    if [ "$DEPLOYER_BALANCE" -lt 1000000 ]; then
        echo "❌ Still insufficient balance. Please check the transfer."
        exit 1
    fi
fi

# Check WASM file
WASM_FILE="artifacts/seimoney_payments.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    exit 1
fi

echo "📦 WASM file ready: $(ls -lh $WASM_FILE | awk '{print $5}')"

echo ""
echo "🚀 Starting Contract Deployment..."
echo "=================================="

SEID="./scripts/seid"

echo ""
echo "📤 Step 1: Storing contract code..."

STORE_TX=$($SEID tx wasm store "$WASM_FILE" \
    --from "deployer" \
    --chain-id "atlantic-2" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Store TX: $STORE_TX"
sleep 3

# Get code_id
CODE_ID=$($SEID q tx "$STORE_TX" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
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

INSTANTIATE_TX=$($SEID tx wasm instantiate "$CODE_ID" "$INIT_MSG" \
    --label "SeiMoney Payments v1.0" \
    --from "deployer" \
    --chain-id "atlantic-2" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
    --gas auto \
    --gas-adjustment 1.5 \
    --fees "100000usei" \
    --broadcast-mode block \
    --output json \
    -y | jq -r '.txhash')

echo "📋 Instantiate TX: $INSTANTIATE_TX"
sleep 3

# Get contract address
CONTRACT_ADDRESS=$($SEID q tx "$INSTANTIATE_TX" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
    --output json | jq -r '.logs[0].events[] | select(.type=="instantiate").attributes[] | select(.key=="_contract_address").value')

echo "🏠 Contract Address: $CONTRACT_ADDRESS"

# Save deployment info
DEPLOYMENT_INFO='{
    "chain_id": "atlantic-2",
    "code_id": "'$CODE_ID'",
    "contract_address": "'$CONTRACT_ADDRESS'",
    "deployer_address": "'$DEPLOYER_ADDRESS'",
    "metamask_address": "'$WALLET_ADDRESS'",
    "metamask_sei_address": "'$SEI_METAMASK'",
    "deployment_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "store_tx": "'$STORE_TX'",
    "instantiate_tx": "'$INSTANTIATE_TX'",
    "wasm_file": "'$WASM_FILE'"
}'

echo "$DEPLOYMENT_INFO" | jq '.' > artifacts/deployment.json

# Update .env file
sed -i.bak "s/PAYMENTS_CONTRACT_ADDRESS=.*/PAYMENTS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env

echo ""
echo "🎉 DEPLOYMENT SUCCESSFUL! 🎉"
echo "=============================="
echo ""
echo "📄 Deployment info saved to: artifacts/deployment.json"
echo "📝 Contract address updated in .env"
echo ""
echo "🔗 Contract Details:"
echo "   Chain ID: atlantic-2"
echo "   Code ID: $CODE_ID"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Deployer: $DEPLOYER_ADDRESS"
echo "   MetaMask: $WALLET_ADDRESS"
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