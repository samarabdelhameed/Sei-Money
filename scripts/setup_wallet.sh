#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.."; pwd)

echo "💰 Setting up Sei wallet for development..."

# Check if seid is installed
if ! command -v seid &> /dev/null; then
    echo "❌ Sei CLI not found. Please run ./scripts/setup_dev.sh first"
    exit 1
fi

# Check if wallet already exists
if seid keys list | grep -q "test"; then
    echo "⚠️ Wallet 'test' already exists"
    read -p "Do you want to remove it and create a new one? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️ Removing existing wallet..."
        seid keys delete test -y
    else
        echo "✅ Using existing wallet"
        exit 0
    fi
fi

# Create new wallet
echo "🔑 Creating new wallet 'test'..."
seid keys add test

# Get wallet address
ADDRESS=$(seid keys show test -a)
echo "📍 Wallet address: $ADDRESS"

# Configure chain
echo "🌐 Configuring Sei testnet..."
seid config chain-id sei-testnet-1
seid config node https://rpc.testnet.sei.io

# Check balance
echo "💰 Checking wallet balance..."
seid query bank balances $ADDRESS --node https://rpc.testnet.sei.io

echo ""
echo "🎉 Wallet setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Get testnet tokens from faucet: https://sei-faucet.vercel.app/"
echo "2. Or run: ./scripts/fund_wallet.sh"
echo "3. Test your wallet: seid query bank balances $ADDRESS"
echo ""
echo "💡 To use in scripts: export WALLET=test"
