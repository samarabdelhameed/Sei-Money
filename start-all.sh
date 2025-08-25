#!/bin/bash

# SeiMoney - Complete Development Environment Startup Script
# This script starts all services with fixed ports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
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

print_header "SeiMoney Development Environment"
echo "Starting all services with fixed ports:"
echo "- Backend API: http://localhost:$BACKEND_PORT"
echo "- Frontend: http://localhost:$FRONTEND_PORT"
echo "- MCP Agent: http://localhost:$MCP_AGENT_PORT"
echo "- Bots Service: http://localhost:$BOTS_PORT"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "$service port $port is already in use"
        read -p "Kill existing process? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Killing process on port $port"
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
            sleep 2
        else
            print_error "Cannot start $service - port $port is in use"
            return 1
        fi
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service to start on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port >/dev/null 2>&1; then
            print_status "$service is ready!"
            return 0
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            print_status "Still waiting for $service... (attempt $attempt/$max_attempts)"
        fi
        
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "$service failed to start within $max_attempts seconds"
    return 1
}

# Cleanup function
cleanup() {
    print_header "Shutting down services..."
    
    # Kill all background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # Kill processes on our ports
    for port in $BACKEND_PORT $FRONTEND_PORT $MCP_AGENT_PORT $BOTS_PORT; do
        lsof -ti:$port | xargs -r kill -9 2>/dev/null || true
    done
    
    print_status "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if all required directories exist
if [ ! -d "backend" ]; then
    print_error "Backend directory not found!"
    exit 1
fi

if [ ! -d "frontend" ]; then
    print_error "Frontend directory not found!"
    exit 1
fi

# Check ports
print_status "Checking ports availability..."
check_port $BACKEND_PORT "Backend"
check_port $FRONTEND_PORT "Frontend"
check_port $MCP_AGENT_PORT "MCP Agent"
check_port $BOTS_PORT "Bots Service"

# Install dependencies if needed
print_header "Checking Dependencies"

if [ ! -d "backend/node_modules" ]; then
    print_status "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start Backend
print_header "Starting Backend Service"
cd backend
export PORT=$BACKEND_PORT
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
wait_for_service $BACKEND_PORT "Backend API"

# Start MCP Agent (if exists)
print_header "Starting MCP Agent"
if [ -d "mcp-agent" ]; then
    cd mcp-agent
    export PORT=$MCP_AGENT_PORT
    npm run dev > ../logs/mcp-agent.log 2>&1 &
    MCP_AGENT_PID=$!
    cd ..
    wait_for_service $MCP_AGENT_PORT "MCP Agent"
else
    print_warning "MCP Agent directory not found, skipping..."
fi

# Start Bots Service (if exists)
print_header "Starting Bots Service"
if [ -d "bots" ]; then
    cd bots
    export PORT=$BOTS_PORT
    npm run dev > ../logs/bots.log 2>&1 &
    BOTS_PID=$!
    cd ..
    wait_for_service $BOTS_PORT "Bots Service"
else
    print_warning "Bots directory not found, skipping..."
fi

# Start Frontend
print_header "Starting Frontend"
cd frontend
export VITE_PORT=$FRONTEND_PORT
export VITE_API_URL=http://localhost:$BACKEND_PORT
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
wait_for_service $FRONTEND_PORT "Frontend"

# Success message
print_header "🚀 All Services Started Successfully!"
echo ""
echo "📊 Service URLs:"
echo "   • Frontend:    http://localhost:$FRONTEND_PORT"
echo "   • Backend API: http://localhost:$BACKEND_PORT"
echo "   • API Docs:    http://localhost:$BACKEND_PORT/docs"
echo "   • Health:      http://localhost:$BACKEND_PORT/health/health"

if [ -n "$MCP_AGENT_PID" ]; then
    echo "   • MCP Agent:   http://localhost:$MCP_AGENT_PORT"
fi

if [ -n "$BOTS_PID" ]; then
    echo "   • Bots:        http://localhost:$BOTS_PORT"
fi

echo ""
echo "📝 Logs:"
echo "   • Backend:     tail -f logs/backend.log"
echo "   • Frontend:    tail -f logs/frontend.log"

if [ -n "$MCP_AGENT_PID" ]; then
    echo "   • MCP Agent:   tail -f logs/mcp-agent.log"
fi

if [ -n "$BOTS_PID" ]; then
    echo "   • Bots:        tail -f logs/bots.log"
fi

echo ""
echo "🛑 To stop all services: Ctrl+C or run ./stop-all.sh"
echo ""

# Keep script running and monitor services
print_status "Monitoring services... Press Ctrl+C to stop all"

while true; do
    # Check if any service died
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend service died!"
        cleanup
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend service died!"
        cleanup
    fi
    
    if [ -n "$MCP_AGENT_PID" ] && ! kill -0 $MCP_AGENT_PID 2>/dev/null; then
        print_warning "MCP Agent service died"
    fi
    
    if [ -n "$BOTS_PID" ] && ! kill -0 $BOTS_PID 2>/dev/null; then
        print_warning "Bots service died"
    fi
    
    sleep 5
done