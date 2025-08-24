#!/usr/bin/env bash
set -euo pipefail

# Requires: seid + jq
# Usage: ./scripts/deploy_sei.sh payments

if [ $# -eq 0 ]; then
    echo "❌ Usage: $0 <contract_name>"
    echo "Available contracts: payments, groups, pots, alias, risk_escrow, vaults"
    exit 1
fi

CONTRACT=$1
CHAIN_ID=${CHAIN_ID:-sei-testnet-1}
DENOM=${DENOM:-usei}
WALLET=${WALLET:-test}
RPC=${RPC_URL:-https://rpc.testnet.sei.io}

# Validate contract name
VALID_CONTRACTS=("payments" "groups" "pots" "alias" "risk_escrow" "vaults")
if [[ ! " ${VALID_CONTRACTS[@]} " =~ " ${CONTRACT} " ]]; then
    echo "❌ Invalid contract: $CONTRACT"
    echo "Valid contracts: ${VALID_CONTRACTS[*]}"
    exit 1
fi

cd "$(dirname "$0")/../contracts/$CONTRACT"

# Check if wasm file exists
WASM_FILE="target/wasm32-unknown-unknown/release/seimoney_${CONTRACT}.wasm"
if [ ! -f "$WASM_FILE" ]; then
    echo "❌ WASM file not found: $WASM_FILE"
    echo "Run ./scripts/build_wasm.sh first"
    exit 1
fi

echo "📦 Storing $CONTRACT.wasm on $CHAIN_ID..."
CODE_ID=$(seid tx wasm store "$WASM_FILE" \
  --from $WALLET --gas auto --gas-adjustment 1.3 --gas-prices 0.1$DENOM \
  --chain-id $CHAIN_ID --node $RPC -y -o json | jq -r '.code_id')

if [ "$CODE_ID" = "null" ] || [ -z "$CODE_ID" ]; then
    echo "❌ Failed to store contract"
    exit 1
fi

echo "✅ Contract stored with CODE_ID: $CODE_ID"

echo "🏗️ Instantiating $CONTRACT..."
ADDR=$(seid tx wasm instantiate $CODE_ID '{}' \
  --from $WALLET --label "$CONTRACT-$(date +%s)" \
  --admin $(seid keys show -a $WALLET) \
  --gas auto --gas-adjustment 1.3 --gas-prices 0.1$DENOM \
  --chain-id $CHAIN_ID --node $RPC -y -o json | jq -r '.contract_address')

if [ "$ADDR" = "null" ] || [ -z "$ADDR" ]; then
    echo "❌ Failed to instantiate contract"
    exit 1
fi

echo "🎉 $CONTRACT deployed successfully!"
echo "📍 Contract Address: $ADDR"
echo "🆔 Code ID: $CODE_ID"
echo "🔗 Explorer: https://sei.explorers.guru/contract/$ADDR"
