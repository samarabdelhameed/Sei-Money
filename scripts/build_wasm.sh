#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.."; pwd)

echo "🛠️ Building CosmWasm contracts..."
cd $ROOT/contracts

# Check if wasm32 target is installed
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "📦 Installing wasm32 target..."
    rustup target add wasm32-unknown-unknown
fi

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "📦 Installing wasm-pack..."
    cargo install wasm-pack
fi

for dir in payments groups pots alias risk_escrow vaults; do
    if [ -d "$dir" ]; then
        echo "➡️ Building $dir..."
        (cd $dir && cargo wasm)
        echo "✅ $dir built successfully"
    else
        echo "⚠️ Directory $dir not found, skipping..."
    fi
done

echo "🎉 All contracts built successfully!"
