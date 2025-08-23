#!/bin/bash

# 🚀 SeiMoney Quick Start Script

echo "🦊 Welcome to SeiMoney!"
echo ""

# Check if .env file exists
if [ ! -f "contracts/.env" ]; then
    echo "❌ .env file not found"
    echo "💡 Please create contracts/.env file and add your private key"
    exit 1
fi

# Options menu
echo "Choose what you want to do:"
echo "1. Check balance"
echo "2. Build contract"
echo "3. Deploy contract"
echo "4. Interact with contract"
echo "5. Run application"
echo "6. Exit"
echo ""

read -p "Choose option (1-6): " choice

case $choice in
    1)
        cd contracts && ./scripts/check-balance.sh
        ;;
    2)
        cd contracts && cargo wasm
        ;;
    3)
        cd contracts && ./scripts/deploy-metamask.sh
        ;;
    4)
        cd contracts && ./scripts/interact-metamask.sh
        ;;
    5)
        echo "🌐 Starting application..."
        cd app && python3 -m http.server 3000
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        ;;
esac