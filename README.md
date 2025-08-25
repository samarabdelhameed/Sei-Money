# SeiMoney - Complete DeFi Platform

A comprehensive DeFi platform built on the Sei Network, featuring smart payments, investment vaults, group savings, and AI-powered financial management.

## 🚀 Quick Start

### One-Command Setup

```bash
# Make scripts executable (first time only)
chmod +x start-all.sh stop-all.sh

# Start all services
./start-all.sh
```

This will start all services with **fixed ports**:
- **Frontend**: http://localhost:5175
- **Backend API**: http://localhost:3001
- **MCP Agent**: http://localhost:3002 (if available)
- **Bots Service**: http://localhost:3003 (if available)

### Stop All Services

```bash
./stop-all.sh
```

## 📊 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5175 | Main application interface |
| Backend API | http://localhost:3001 | REST API server |
| API Health | http://localhost:3001/health/health | Health check endpoint |
| API Docs | http://localhost:3001/docs | API documentation |
| MCP Agent | http://localhost:3002 | Model Context Protocol agent |
| Bots Service | http://localhost:3003 | Automated trading bots |

## 🛠 Development Commands

```bash
# Install all dependencies
npm run setup

# Start development environment
npm run dev

# Stop all services
npm run stop

# View logs
npm run logs              # All logs
npm run logs:backend      # Backend only
npm run logs:frontend     # Frontend only

# Build all projects
npm run build:all

# Run tests
npm run test

# Clean all dependencies and builds
npm run clean
```

## 📁 Project Structure

```
SeiMoney/
├── backend/              # Node.js/TypeScript API server
├── frontend/             # React/TypeScript web application
├── mcp-agent/           # Model Context Protocol agent (optional)
├── bots/                # Trading bots service (optional)
├── logs/                # Service logs
├── start-all.sh         # Start all services script
├── stop-all.sh          # Stop all services script
└── package.json         # Root package.json with scripts
```

## 🔧 Manual Setup (if needed)

### Prerequisites

- Node.js 18+ and npm 8+
- Git

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🌐 Features

### Core Features
- **Smart Payments**: Send payments with expiry and auto-refund
- **Investment Vaults**: Automated yield farming strategies
- **Group Savings**: Collaborative savings pools
- **Savings Pots**: Personal savings goals with automation
- **Escrow Services**: Secure transaction mediation

### Wallet Support
- **Keplr Wallet**: Native Cosmos wallet
- **Leap Wallet**: Alternative Cosmos wallet
- **MetaMask**: Ethereum wallet with Cosmos bridge

### Technical Features
- Real-time market data and analytics
- Comprehensive error handling and user feedback
- Responsive design for all devices
- Automated testing infrastructure
- Performance monitoring and optimization

## 🔍 Monitoring & Logs

### Real-time Logs
```bash
# Watch all service logs
tail -f logs/*.log

# Watch specific service
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Health Checks
- Backend: http://localhost:3001/health/health
- Frontend: Check console for errors
- All services are monitored automatically by the start script

## 🚨 Troubleshooting

### Port Conflicts
The start script automatically detects and handles port conflicts. If a port is in use, it will ask if you want to kill the existing process.

### Service Failures
If any service fails to start, check the logs:
```bash
cat logs/backend.log
cat logs/frontend.log
```

### Common Issues

1. **Backend won't start**: Check if port 3001 is available
2. **Frontend won't start**: Check if port 5175 is available
3. **Wallet connection issues**: Ensure wallet extension is installed and unlocked
4. **API errors**: Verify backend is running and accessible

### Reset Everything
```bash
./stop-all.sh
npm run clean
npm run setup
./start-all.sh
```

## 📝 Environment Variables

### Backend (.env)
```bash
PORT=3001
NODE_ENV=development
CHAIN_ID=atlantic-2
RPC_URL=https://rpc.atlantic-2.seinetwork.io:443
# ... other variables
```

### Frontend
Environment variables are automatically set by the start script:
- `VITE_PORT=5175`
- `VITE_API_URL=http://localhost:3001`

## 🧪 Testing

### Automated Testing
```bash
npm run test              # Run all tests
npm run test:backend      # Backend tests only
npm run test:frontend     # Frontend tests only
```

### Manual Testing
1. Open http://localhost:5175
2. Connect a wallet (Keplr, Leap, or MetaMask)
3. Test core features:
   - Create a payment
   - Join a group
   - Create a savings pot
   - Explore vaults

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using `./start-all.sh`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Need help?** Check the logs in the `logs/` directory or open an issue on GitHub.