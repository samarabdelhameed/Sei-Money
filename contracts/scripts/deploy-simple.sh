#!/bin/bash

# 🚀 Simple deployment script using direct RPC calls

set -e

echo "🦊 Deploy SeiMoney contract to Sei Testnet..."

# Load environment variables
source .env

# Check for existence of WASM file
if [ ! -f "artifacts/seimoney_payments.wasm" ]; then
    echo "❌ WASM file not found. Please build the contract first"
    echo "🔧 Run: ./scripts/build_wasm.sh"
    exit 1
fi

echo "📍 Address: $WALLET_ADDRESS"
echo "🌐 Network: $SEI_RPC_URL"
echo ""

# Convert WASM file to base64
echo "📦 Preparing WASM file..."
WASM_BASE64=$(base64 -i artifacts/seimoney_payments.wasm | tr -d '\n')

echo "✅ Contract ready for deployment!"
echo "📋 Contract information:"
echo "   File size: $(wc -c < artifacts/seimoney_payments.wasm) bytes"
echo "   Address: $WALLET_ADDRESS"
echo ""

# Save deployment information
cat > deployment_info.json << EOF
{
  "contract_wasm": "artifacts/seimoney_payments.wasm",
  "deployer_address": "$WALLET_ADDRESS",
  "network": "sei-testnet",
  "rpc_url": "$SEI_RPC_URL",
  "chain_id": "$SEI_CHAIN_ID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "💾 Deployment information saved in deployment_info.json"
echo ""
echo "🔗 Next steps:"
echo "   1. Use Sei Wallet or another tool to deploy the contract"
echo "   2. Or use seid CLI with correct settings"
echo "   3. Add deployed contract address to .env file"
echo ""
echo "📚 For deployment help:"
echo "   - Sei Docs: https://docs.sei.io/"
echo "   - Explorer: https://seitrace.com/"