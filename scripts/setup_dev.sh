#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.."; pwd)

echo "🚀 Setting up Sei Money development environment..."

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "📦 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
else
    echo "✅ Rust already installed"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js already installed"
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
else
    echo "✅ pnpm already installed"
fi

# Check if seid is installed
if ! command -v seid &> /dev/null; then
    echo "📦 Installing Sei CLI..."
    curl -s https://get.sei.io/install.sh | bash
    echo 'export PATH="$HOME/.sei/bin:$PATH"' >> $HOME/.bashrc
    export PATH="$HOME/.sei/bin:$PATH"
else
    echo "✅ Sei CLI already installed"
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "📦 Installing jq..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install jq
    else
        sudo apt-get install -y jq
    fi
else
    echo "✅ jq already installed"
fi

# Install Rust wasm target
echo "📦 Installing Rust wasm target..."
rustup target add wasm32-unknown-unknown

# Install wasm-pack
if ! command -v wasm-pack &> /dev/null; then
    echo "📦 Installing wasm-pack..."
    cargo install wasm-pack
else
    echo "✅ wasm-pack already installed"
fi

# Install cosmwasm-ts-codegen
if ! command -v cosmwasm-ts-codegen &> /dev/null; then
    echo "📦 Installing cosmwasm-ts-codegen..."
    npm install -g @cosmwasm/ts-codegen
else
    echo "✅ cosmwasm-ts-codegen already installed"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$ROOT/backend"
pnpm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd "$ROOT/app"
pnpm install

# Install SDK dependencies
echo "📦 Installing SDK dependencies..."
cd "$ROOT/SDK"
pnpm install

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up your wallet: ./scripts/setup_wallet.sh"
echo "2. Build contracts: ./scripts/build_wasm.sh"
echo "3. Start backend: cd backend && pnpm dev"
echo "4. Start frontend: cd app && pnpm dev"
echo ""
echo "💡 Don't forget to source environment: source scripts/env.sh"
