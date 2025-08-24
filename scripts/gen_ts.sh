#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.."; pwd)
GEN="$ROOT/SDK/src/gen"

echo "🌀 Generating TypeScript SDK from CosmWasm schemas..."

# Check if cosmwasm-ts-codegen is installed
if ! command -v cosmwasm-ts-codegen &> /dev/null; then
    echo "📦 Installing cosmwasm-ts-codegen..."
    npm install -g @cosmwasm/ts-codegen
fi

# Clean and recreate gen directory
rm -rf $GEN
mkdir -p $GEN

# Generate for each contract
for dir in payments groups pots alias risk_escrow vaults; do
    SCHEMA_DIR="$ROOT/contracts/$dir/schema"
    if [ -d "$SCHEMA_DIR" ]; then
        SCHEMA_FILES=$(find "$SCHEMA_DIR" -name "*.json" | wc -l)
        if [ "$SCHEMA_FILES" -gt 0 ]; then
            echo "➡️ Generating for $dir ($SCHEMA_FILES schema files)..."
            cosmwasm-ts-codegen generate \
                --schema $SCHEMA_DIR \
                --out $GEN/$dir \
                --name $(echo $dir | sed 's/_//g')
            echo "✅ $dir generated successfully"
        else
            echo "⚠️ No schema files found for $dir, skipping..."
        fi
    else
        echo "⚠️ Schema directory not found for $dir, skipping..."
    fi
done

# Update SDK index file
echo "📝 Updating SDK index..."
cat > $GEN/index.ts << 'EOF'
// Auto-generated TypeScript SDK
export * from './payments';
export * from './groups';
export * from './pots';
export * from './alias';
export * from './riskescrow';
export * from './vaults';
EOF

echo "🎉 TypeScript SDK generated successfully!"
echo "📍 Output directory: $GEN"
