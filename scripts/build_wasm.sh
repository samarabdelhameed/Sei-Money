#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "Building WASM contracts..."

# Build using workspace optimizer
docker run --rm -v "$(pwd)":/code \
  --platform linux/amd64 \
  cosmwasm/workspace-optimizer:0.14.0

echo "WASM build completed! Check artifacts/ directory."