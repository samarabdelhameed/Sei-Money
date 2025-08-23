#!/bin/bash

# 🦊 Sei Testnet Deployment Script with MetaMask
# This script uses MetaMask private key to deploy on Sei testnet

set -e

echo "🦊 Starting contract deployment to Sei Testnet using MetaMask..."

# Check for existence of .env file
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it first"
    exit 1
fi

# Load environment variables
source .env

# Check for existence of PRIVATE_KEY
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
    echo "❌ Please add PRIVATE_KEY in .env file"
    echo "💡 To get private key from MetaMask:"
    echo "   1. Open MetaMask"
    echo "   2. Click three dots → Account Details"
    echo "   3. Click Export Private Key"
    echo "   4. Enter password"
    echo "   5. Copy private key and put it in .env file"
    exit 1
fi

echo "🔧 Building contracts..."
# Manual build instead of Docker
cd contracts
cargo build --release --target wasm32-unknown-unknown --lib
cp target/wasm32-unknown-unknown/release/seimoney_payments.wasm ../artifacts/
cd ..

echo "🚀 Deploy contract to Sei Testnet..."

# Create temporary key for deployment
echo "🔑 Creating temporary key..."
./scripts/seid keys add deployer --keyring-backend test --output json > /tmp/deployer_key.json 2>/dev/null || echo "Key already exists"

# Use seid to deploy contract
echo "📤 Uploading contract..."
STORE_RESULT=$(./scripts/seid tx wasm store artifacts/seimoney_payments.wasm \
    --from deployer \
    --keyring-backend test \
    --chain-id $SEI_CHAIN_ID \
    --node $SEI_RPC_URL \
    --gas auto \
    --gas-adjustment 1.3 \
    --fees 1000usei \
    --broadcast-mode block \
    --yes \
    --output json)

# Extract code_id
CODE_ID=$(echo $STORE_RESULT | jq -r '.logs[0].events[] | select(.type=="store_code") | .attributes[] | select(.key=="code_id") | .value')

echo "✅ Contract uploaded successfully! Code ID: $CODE_ID"

# Create contract instance
echo "🏗️ Creating contract instance..."
echo "📍 Using Address: $WALLET_ADDRESS"

INIT_MSG='{"admin":"'$WALLET_ADDRESS'","fee_percentage":250}'

INSTANTIATE_RESULT=$(./scripts/seid tx wasm instantiate $CODE_ID "$INIT_MSG" \
    --from deployer \
    --keyring-backend test \
    --chain-id $SEI_CHAIN_ID \
    --node $SEI_RPC_URL \
    --label "SeiMoney Payments v1.0" \
    --gas auto \
    --gas-adjustment 1.3 \
    --fees 1000usei \
    --broadcast-mode block \
    --yes \
    --output json)

# Extract contract address
CONTRACT_ADDRESS=$(echo $INSTANTIATE_RESULT | jq -r '.logs[0].events[] | select(.type=="instantiate") | .attributes[] | select(.key=="_contract_address") | .value')

echo "�� Contract deployed successfully!"
echo "📍 Contract address: $CONTRACT_ADDRESS"
echo "🔍 You can view the contract at: https://seitrace.com/address/$CONTRACT_ADDRESS"

# Update .env file
echo "📝 Updating .env file..."
cd ..
sed -i.bak "s/PAYMENTS_CONTRACT_ADDRESS=.*/PAYMENTS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" .env

echo "✅ Deployment completed!"
echo ""
echo "📋 Important information:"
echo "   Code ID: $CODE_ID"
echo "   Contract Address: $CONTRACT_ADDRESS"
echo "   Network: Sei Testnet (Atlantic-2)"
echo "   Explorer: https://seitrace.com/address/$CONTRACT_ADDRESS"
echo ""
echo "🔗 Next steps:"
echo "   1. Check contract on explorer"
echo "   2. Test contract using scripts/interact.sh"
echo "   3. Integrate contract with application"