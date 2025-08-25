#!/bin/bash

# SeiMoney - Stop All Services Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Fixed ports configuration
BACKEND_PORT=3001
FRONTEND_PORT=5175
MCP_AGENT_PORT=3002
BOTS_PORT=3003

print_header "Stopping SeiMoney Services"

# Function to kill process on port
kill_port() {
    local port=$1
    local service=$2
    
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        print_status "Stopping $service on port $port..."
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 1
        
        # Verify it's stopped
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_status "Force killing $service..."
            echo $pids | xargs kill -KILL 2>/dev/null || true
        fi
        
        print_status "$service stopped"
    else
        print_status "$service was not running on port $port"
    fi
}

# Stop all services
kill_port $BACKEND_PORT "Backend"
kill_port $FRONTEND_PORT "Frontend"
kill_port $MCP_AGENT_PORT "MCP Agent"
kill_port $BOTS_PORT "Bots Service"

# Kill any remaining node processes related to our project
print_status "Cleaning up remaining processes..."

# Kill vite processes
pkill -f "vite" 2>/dev/null || true

# Kill tsx processes (backend)
pkill -f "tsx.*src/index.ts" 2>/dev/null || true

# Kill any node processes in our directories
pkill -f "node.*SeiMoney" 2>/dev/null || true

print_status "All services stopped successfully!"
echo ""
echo "To start all services again, run: ./start-all.sh"