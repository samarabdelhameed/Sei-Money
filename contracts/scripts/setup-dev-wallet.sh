#!/bin/bash

# 🔑 Setup new development wallet for Sei

echo "🚀 Setting up new development wallet..."

# Check for existence of seid
if ! command -v seid &> /dev/null; then
    echo "❌ seid is not installed. Please install it first:"
    echo "   curl -L https://github.com/sei-protocol/sei-chain/releases/download/v3.0.8/sei-chain_3.0.8_linux_amd64.tar.gz | tar -xz"
    echo "   sudo mv seid /usr/local/bin/"
    exit 1
fi

# Network setup
echo "⚙️  Setting up network configuration..."
seid config chain-id atlantic-2
seid config node https://rpc.atlantic-2.seinetwork.io:443

# Create new wallet
WALLET_NAME="dev-wallet"
echo "🔐 Creating new wallet: $WALLET_NAME"

# Check for existence of wallet
if seid keys show $WALLET_NAME 2>/dev/null; then
    echo "⚠️  Wallet already exists. Do you want to delete it and create a new one? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        seid keys delete $WALLET_NAME --yes
    else
        echo "✅ Using existing wallet"
        ADDRESS=$(seid keys show $WALLET_NAME -a)
        echo "📍 Address: $ADDRESS"
        exit 0
    fi
fi

# Create wallet
echo "🔑 Creating wallet..."
seid keys add $WALLET_NAME

# Get address
ADDRESS=$(seid keys show $WALLET_NAME -a)

echo ""
echo "✅ Wallet created successfully!"
echo "📍 Address: $ADDRESS"
echo ""
echo "🚨 Very Important:"
echo "   1. Save the mnemonic phrase in a secure location"
echo "   2. Don't share it with anyone"
echo "   3. You'll need it to restore the wallet"
echo ""
echo "💰 Next Step:"
echo "   Go to https://faucet.seinetwork.io/"
echo "   and enter Address: $ADDRESS"
echo "   to get testnet tokens"
echo ""
echo "🔍 To check balance:"
echo "   seid query bank balances $ADDRESS"
echo ""

# Save address in .env file
if [ -f "contracts/.env" ]; then
    # Remove old line if exists
    sed -i.bak '/^WALLET_ADDRESS=/d' contracts/.env
    echo "WALLET_ADDRESS=$ADDRESS" >> contracts/.env
    echo "📝 Address saved in contracts/.env"
fi

echo "🎉 Setup complete! You can now deploy the contract using:"
echo "   cd contracts && ./scripts/deploy.sh"