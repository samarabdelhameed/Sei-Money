# 🚀 SeiMoney Frontend

A modern, feature-rich DeFi application built with React, TypeScript, and Tailwind CSS, featuring complete integration with Sei Network blockchain, AI agents, and social bot services.

## ✨ **Features**

- **🔐 Wallet Integration** - Support for Keplr and Leap wallets
- **💸 Payment System** - Create and manage transfers with smart contracts
- **👥 Group Management** - Collaborative savings and investment groups
- **🏦 Savings Pots** - Goal-oriented savings with auto-save features
- **🏛️ Investment Vaults** - AI-powered investment strategies
- **🛡️ Escrow Service** - Secure payment escrow with milestone support
- **🤖 AI Agent** - Intelligent portfolio analysis and recommendations
- **📱 Social Bots** - Discord and Telegram bot integration
- **📊 Real-time Analytics** - Live portfolio tracking and performance metrics
- **🎨 Modern UI/UX** - Glassmorphism design with neon accents

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Sei Network) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Agent      │    │   Discord Bot   │    │   Telegram Bot  │
│   Service       │    │   Service       │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 **Quick Start**

### Prerequisites

- Node.js 18+
- npm or yarn
- Keplr or Leap wallet extension
- Modern web browser

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd SeiMoney/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file with your configuration:

   ```bash
   # API Configuration
   VITE_API_URL=http://localhost:3001

   # Blockchain Configuration
   VITE_SEI_NETWORK=testnet
   VITE_SEI_RPC_URL=https://rpc-testnet.sei.io
   VITE_SEI_CHAIN_ID=atlantic-2

   # AI Agent Configuration
   VITE_AI_AGENT_URL=http://localhost:3002

   # Bot Services
   VITE_DISCORD_BOT_URL=http://localhost:3004
   VITE_TELEGRAM_BOT_URL=http://localhost:3005
   ```

4. **Start development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🔧 **Development**

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Project Structure

```
src/
├── components/          # React components
│   ├── charts/         # Chart components (LineChart, CircularProgress)
│   ├── layout/         # Layout components (Navbar)
│   ├── pages/          # Page components (Dashboard, Payments, etc.)
│   └── ui/             # UI components (GlassCard, NeonButton, etc.)
├── contexts/            # React contexts (AppContext)
├── lib/                 # Utility libraries
│   ├── api.ts          # API service
│   ├── blockchain.ts   # Blockchain integration
│   ├── aiAgent.ts      # AI agent service
│   ├── bots.ts         # Bot services
│   └── colors.ts       # Color definitions
├── types/               # TypeScript type definitions
└── main.tsx            # Application entry point
```

### Key Components

- **AppContext** - Global state management
- **IntegrationStatus** - Real-time service monitoring
- **TestScenarios** - Integration testing dashboard
- **WalletModal** - Wallet connection interface
- **Notifications** - Toast notification system

## 🔌 **Integration Features**

### 1. **Wallet Integration**

- Keplr wallet support
- Leap wallet support
- Secure connection handling
- Balance and transaction monitoring

### 2. **Blockchain Integration**

- Sei Network smart contracts
- Real-time transaction processing
- Gas estimation and optimization
- Contract query and execution

### 3. **AI Agent Integration**

- Portfolio analysis
- Trading recommendations
- Risk assessment
- Natural language chat interface

### 4. **Bot Services**

- Discord bot commands
- Telegram bot integration
- Automated notifications
- Social platform interactions

## 🧪 **Testing**

### Integration Testing

The application includes a comprehensive test scenarios dashboard that tests:

- Wallet connections
- Payment transfers
- Group management
- Savings pots
- Investment vaults
- Escrow services
- AI agent functionality
- Bot service connectivity
- Blockchain integration

### Running Tests

```bash
# Run all test scenarios
npm run test:integration

# Run specific test categories
npm run test:wallet
npm run test:payment
npm run test:ai
npm run test:bots
```

## 📱 **User Experience**

### Wallet Connection Flow

1. User clicks "Connect Wallet"
2. Choose between Keplr or Leap
3. Approve connection in wallet
4. Verify wallet address
5. Load user data and portfolio
6. Enable all DeFi features

### Payment Transfer Flow

1. Fill transfer form (recipient, amount, expiry, remark)
2. AI agent assesses risk
3. User confirms transaction
4. Smart contract execution
5. Transaction confirmation
6. Update backend and UI

### AI Agent Interaction

1. Connect to AI service
2. Ask questions about portfolio
3. Receive intelligent recommendations
4. Get risk assessments
5. View trading signals
6. Optimize investment strategy

## 🔒 **Security Features**

- **Wallet Security** - No private key storage
- **API Security** - HTTPS and authentication
- **Blockchain Security** - Contract verification
- **Input Validation** - Sanitized user inputs
- **Error Handling** - Graceful failure management

## 📊 **Monitoring & Analytics**

### Integration Status Dashboard

- Real-time service health monitoring
- Response time tracking
- Error rate monitoring
- Service uptime statistics

### Performance Metrics

- API response times
- Blockchain transaction success rates
- AI agent response quality
- Bot service uptime

## 🚀 **Deployment**

### Production Build

```bash
npm run build
```

### Environment Configuration

Ensure all production environment variables are set:

```bash
VITE_API_URL=https://api.seimoney.com
VITE_SEI_NETWORK=mainnet
VITE_SEI_RPC_URL=https://rpc.sei.io
VITE_AI_AGENT_URL=https://ai.seimoney.com
```

### Deployment Platforms

- **Vercel** - `vercel --prod`
- **Netlify** - `netlify deploy --prod`
- **AWS S3** - `aws s3 sync dist/ s3://your-bucket`
- **Docker** - `docker build -t seimoney-frontend .`

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📚 **Documentation**

- [Integration Guide](./INTEGRATION_GUIDE.md) - Complete integration documentation
- [API Reference](./docs/API.md) - API endpoints and usage
- [Component Library](./docs/COMPONENTS.md) - UI component documentation
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions

## 🆘 **Support**

- **Issues** - [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation** - [Docs](https://docs.seimoney.com)
- **Discord** - [Community Server](https://discord.gg/seimoney)
- **Email** - support@seimoney.com

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ by the SeiMoney Team**

**Last Updated:** December 2024  
**Version:** 1.0.0
