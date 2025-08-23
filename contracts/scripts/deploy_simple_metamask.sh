#!/usr/bin/env bash
set -euo pipefail

echo "🦊 Simple MetaMask to Sei Deployment"
echo "===================================="

# Load environment variables
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    exit 1
fi

source .env

echo "🔑 MetaMask Address: $WALLET_ADDRESS"
echo "💰 MetaMask Balance: 5 SEI (confirmed)"

# Use existing deployer wallet
SEID="./scripts/seid"
DEPLOYER_KEY="deployer"

# Get deployer address
DEPLOYER_ADDRESS=$($SEID keys show "$DEPLOYER_KEY" -a)
echo "🔄 Deployer Address: $DEPLOYER_ADDRESS"

# Check deployer balance
echo "💰 Checking deployer balance..."
BALANCE_RESULT=$($SEID query bank balances "$DEPLOYER_ADDRESS" \
    --node "https://rpc.atlantic-2.seinetwork.io:443" \
    --output json 2>/dev/null || echo '{"balances":[]}')

BALANCE=$(echo "$BALANCE_RESULT" | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")

if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ]; then
    echo "❌ Deployer wallet has no balance"
    echo ""
    echo "🔄 Solution: Transfer from MetaMask to deployer wallet"
    echo "   From: $WALLET_ADDRESS"
    echo "   To: $DEPLOYER_ADDRESS"
    echo "   Amount: 1-2 SEI"
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
    
    BALANCE_RESULT=$($SEID query bank balances "$DEPLOYER_ADDRESS" \
        --node "https://rpc.atlantic-2.seinetwork.io:443" \
        --output json)
    BALANCE=$(echo "$BALANCE_RESULT" | jq -r '.balances[] | select(.denom=="usei") | .amount' 2>/dev/null || echo "0")
    
    if [ "$BALANCE" = "0" ] || [ -z "$BALANCE" ]; then
        echo "❌ Still no balance. Please check the transfer."
        exit 1
    fi
fi

BALANCE_SEI=$(echo "scale=6; $BALANCE/1000000" | bc)
echo "✅ Deployer Balance: $BALANCE_SEI SEI"

# Check WASM file
WASM_FILE="artifacts/seimoney_payments.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    exit 1
fi

echo "📦 WASM file ready: $(ls -lh $WASM_FILE | awk '{print $5}')"

echo ""
echo "📤 Step 1: Storing contract code..."

STORE_TX=$($SEID tx wasm store "$WASM_FILE" \
    --from "$DEPLOYER_KEY" \
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
    --from "$DEPLOYER_KEY" \
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
    "deployment_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "store_tx": "'$STORE_TX'",
    "instantiate_tx": "'$INSTANTIATE_TX'",
    "wasm_file": "'$WASM_FILE'"
}'

echo "$DEPLOYMENT_INFO" | jq '.' > artifacts/deployment.json

# Update .env file
sed -i.bak "s/PAYMENTS_CONTRACT_ADDRESS=.*/PAYMENTS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env

echo ""
echo "✅ Deployment completed successfully!"
echo "📄 Deployment info saved to: artifacts/deployment.json"
echo "📝 Contract address updated in .env"
echo ""
echo "🔗 Contract Details:"
echo "   Chain ID: atlantic-2"
echo "   Code ID: $CODE_ID"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Store TX: $STORE_TX"
echo "   Instantiate TX: $INSTANTIATE_TX"
echo ""
echo "🌐 Explorers:"
echo "   SeiTrace: https://seitrace.com/address/$CONTRACT_ADDRESS"
echo "   SeiStream: https://seistream.app/address/$CONTRACT_ADDRESS"
echo ""
echo "🧪 Next steps:"
echo "   1. Check contract on explorer"
echo "   2. Test with: ./scripts/test_contract.sh"
echo "   3. Integrate with frontend"