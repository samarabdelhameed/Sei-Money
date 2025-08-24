#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.."; pwd)

echo "🌱 Seeding demo data for local dashboard testing..."

cd "$ROOT/backend"

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Check if Prisma is set up
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Prisma schema not found. Make sure you're in the backend directory."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Run database migrations
echo "🔄 Running database migrations..."
pnpm prisma migrate dev

# Seed the database
echo "🌱 Seeding database..."
pnpm prisma db seed

echo "✅ Demo data seeded successfully!"
echo "🚀 You can now start the backend server with: pnpm dev"
