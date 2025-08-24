#!/bin/bash

# SeiMoney Bots Startup Script
# This script starts both Telegram and Discord bots

set -e

echo "🚀 Starting SeiMoney Bots..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if Redis is running
if ! command -v redis-cli &> /dev/null; then
    print_warning "Redis CLI not found. Make sure Redis is installed and running."
else
    if ! redis-cli ping &> /dev/null; then
        print_warning "Redis server is not responding. Please start Redis server."
    else
        print_success "Redis server is running"
    fi
fi

# Function to setup and start a bot
start_bot() {
    local bot_name=$1
    local bot_dir=$2
    local skip_build=$3
    
    print_status "Setting up $bot_name..."
    
    cd "$bot_dir"
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_warning ".env file not found for $bot_name. Copying from .env.example"
            cp .env.example .env
            print_warning "Please edit .env file with your configuration before running the bot"
        else
            print_error ".env.example file not found for $bot_name"
            return 1
        fi
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $bot_name..."
        npm install
    fi
    
    # Build the project (skip if in development mode)
    if [ "$skip_build" != "true" ]; then
        print_status "Building $bot_name..."
        npm run build
    else
        print_status "Skipping build for development mode..."
    fi
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    print_success "$bot_name setup completed"
    
    cd ..
}

# Function to start bot with PM2
start_with_pm2() {
    local bot_name=$1
    local bot_dir=$2
    local pm2_name=$3
    
    cd "$bot_dir"
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        print_warning "PM2 not found. Installing PM2 globally..."
        npm install -g pm2
    fi
    
    # Stop existing process if running
    pm2 delete "$pm2_name" 2>/dev/null || true
    
    # Start the bot with PM2
    print_status "Starting $bot_name with PM2..."
    pm2 start dist/index.js --name "$pm2_name"
    
    cd ..
}

# Function to start bot in development mode
start_dev() {
    local bot_name=$1
    local bot_dir=$2
    
    cd "$bot_dir"
    print_status "Starting $bot_name in development mode..."
    npm run dev &
    cd ..
}

# Parse command line arguments
MODE="production"
BOTS="both"

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev|--development)
            MODE="development"
            shift
            ;;
        --telegram)
            BOTS="telegram"
            shift
            ;;
        --discord)
            BOTS="discord"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dev, --development    Start bots in development mode"
            echo "  --telegram             Start only Telegram bot"
            echo "  --discord              Start only Discord bot"
            echo "  --help, -h             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     Start both bots in production mode"
            echo "  $0 --dev               Start both bots in development mode"
            echo "  $0 --telegram --dev    Start only Telegram bot in development mode"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

print_status "Starting bots in $MODE mode..."

# Setup and start Telegram bot
if [[ "$BOTS" == "both" || "$BOTS" == "telegram" ]]; then
    if [ -d "telegram" ]; then
        if [ "$MODE" == "production" ]; then
            start_bot "Telegram Bot" "telegram" "false"
            start_with_pm2 "Telegram Bot" "telegram" "seimoney-telegram-bot"
        else
            start_bot "Telegram Bot" "telegram" "true"
            start_dev "Telegram Bot" "telegram"
        fi
    else
        print_error "Telegram bot directory not found"
    fi
fi

# Setup and start Discord bot
if [[ "$BOTS" == "both" || "$BOTS" == "discord" ]]; then
    if [ -d "discord" ]; then
        if [ "$MODE" == "production" ]; then
            start_bot "Discord Bot" "discord" "false"
            start_with_pm2 "Discord Bot" "discord" "seimoney-discord-bot"
        else
            start_bot "Discord Bot" "discord" "true"
            start_dev "Discord Bot" "discord"
        fi
    else
        print_error "Discord bot directory not found"
    fi
fi

if [ "$MODE" == "production" ]; then
    print_success "All bots started with PM2!"
    print_status "Use 'pm2 status' to check bot status"
    print_status "Use 'pm2 logs' to view logs"
    print_status "Use 'pm2 stop all' to stop all bots"
    
    # Save PM2 configuration
    pm2 save
    
    # Show PM2 status
    pm2 status
else
    print_success "All bots started in development mode!"
    print_status "Press Ctrl+C to stop all bots"
    
    # Wait for all background processes
    wait
fi

print_success "🎉 SeiMoney Bots are now running!"