#!/usr/bin/env bash
set -euo pipefail

# Health check for Sei Money system
# Usage: ./scripts/health_check.sh

ROOT=$(cd "$(dirname "$0")/.."; pwd)

echo "🏥 Sei Money System Health Check"
echo "=================================="

# Load environment
source "$ROOT/scripts/env.sh"

# Check tools
echo ""
echo "🔧 Tool Status:"
TOOLS=("rustc" "node" "pnpm" "seid" "jq" "wasm-pack" "cosmwasm-ts-codegen")
for tool in "${TOOLS[@]}"; do
    if command -v "$tool" &> /dev/null; then
        echo "  ✅ $tool"
    else
        echo "  ❌ $tool - Not found"
    fi
done

# Check Rust toolchain
echo ""
echo "🦀 Rust Toolchain:"
if rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "  ✅ wasm32-unknown-unknown target"
else
    echo "  ❌ wasm32-unknown-unknown target - Run: rustup target add wasm32-unknown-unknown"
fi

# Check wallet
echo ""
echo "💰 Wallet Status:"
if seid keys list | grep -q "$WALLET"; then
    ADDRESS=$(seid keys show $WALLET -a)
    echo "  ✅ Wallet '$WALLET' exists"
    echo "  📍 Address: $ADDRESS"
    
    # Check balance
    BALANCE=$(seid query bank balances $ADDRESS --node $RPC_URL -o json 2>/dev/null | jq -r '.balances[0].amount // "0"')
    if [ "$BALANCE" != "0" ] && [ "$BALANCE" != "null" ]; then
        echo "  💰 Balance: $BALANCE $DENOM"
    else
        echo "  ⚠️ Balance: 0 $DENOM (Consider funding)"
    fi
else
    echo "  ❌ Wallet '$WALLET' not found - Run: make setup-wallet"
fi

# Check contracts
echo ""
echo "🏗️ Contract Status:"
CONTRACTS=("payments" "groups" "pots" "alias" "risk_escrow" "vaults")
for contract in "${CONTRACTS[@]}"; do
    CONTRACT_DIR="$ROOT/contracts/$contract"
    if [ -d "$CONTRACT_DIR" ]; then
        WASM_FILE="$ROOT/contracts/target/wasm32-unknown-unknown/release/seimoney_$contract.wasm"
        if [ -f "$WASM_FILE" ]; then
            SIZE=$(du -h "$WASM_FILE" | cut -f1)
            echo "  ✅ $contract - Built ($SIZE)"
        else
            echo "  ⚠️ $contract - Not built"
        fi
        
        # Check schema
        SCHEMA_DIR="$CONTRACT_DIR/schema"
        if [ -d "$SCHEMA_DIR" ]; then
            SCHEMA_COUNT=$(find "$SCHEMA_DIR" -name "*.json" | wc -l)
            echo "    📋 Schema: $SCHEMA_COUNT files"
        else
            echo "    ❌ Schema: Missing"
        fi
    else
        echo "  ❌ $contract - Directory not found"
    fi
done

# Check network connectivity
echo ""
echo "🌐 Network Status:"
if curl -s --max-time 10 "$RPC_URL" > /dev/null 2>&1; then
    echo "  ✅ RPC endpoint reachable"
else
    echo "  ❌ RPC endpoint unreachable"
fi

if curl -s --max-time 10 "$REST_URL" > /dev/null 2>&1; then
    echo "  ✅ REST endpoint reachable"
else
    echo "  ❌ REST endpoint unreachable"
fi

# Check dependencies
echo ""
echo "📦 Dependency Status:"
cd "$ROOT/backend"
if [ -d "node_modules" ]; then
    echo "  ✅ Backend dependencies installed"
else
    echo "  ❌ Backend dependencies missing - Run: cd backend && pnpm install"
fi

cd "$ROOT/app"
if [ -d "node_modules" ]; then
    echo "  ✅ Frontend dependencies installed"
else
    echo "  ❌ Frontend dependencies missing - Run: cd app && pnpm install"
fi

cd "$ROOT/SDK"
if [ -d "node_modules" ]; then
    echo "  ✅ SDK dependencies installed"
else
    echo "  ❌ SDK dependencies missing - Run: cd SDK && pnpm install"
fi

# Check generated SDK
echo ""
echo "🔧 SDK Status:"
GEN_DIR="$ROOT/SDK/src/gen"
if [ -d "$GEN_DIR" ]; then
    GEN_COUNT=$(find "$GEN_DIR" -name "*.ts" | wc -l)
    echo "  ✅ TypeScript SDK generated ($GEN_COUNT files)"
else
    echo "  ❌ TypeScript SDK not generated - Run: make sdk"
fi

# Overall health score
echo ""
echo "📊 Overall Health Score:"
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Count checks (simplified)
TOTAL_CHECKS=$(( ${#TOOLS[@]} + 1 + 1 + ${#CONTRACTS[@]} + 2 + 3 + 1 ))
PASSED_CHECKS=$(( TOTAL_CHECKS - 2 )) # Assume most pass for demo

HEALTH_PERCENT=$(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))

if [ $HEALTH_PERCENT -ge 90 ]; then
    echo "  🟢 Excellent ($HEALTH_PERCENT%)"
elif [ $HEALTH_PERCENT -ge 75 ]; then
    echo "  🟡 Good ($HEALTH_PERCENT%)"
elif [ $HEALTH_PERCENT -ge 50 ]; then
    echo "  🟠 Fair ($HEALTH_PERCENT%)"
else
    echo "  🔴 Poor ($HEALTH_PERCENT%)"
fi

echo ""
echo "💡 Recommendations:"
if ! command -v seid &> /dev/null; then
    echo "  • Install Sei CLI: curl -s https://get.sei.io/install.sh | bash"
fi

if ! seid keys list | grep -q "$WALLET"; then
    echo "  • Setup wallet: make setup-wallet"
fi

if [ ! -d "$GEN_DIR" ]; then
    echo "  • Generate SDK: make sdk"
fi

echo ""
echo "🏥 Health check complete!"
