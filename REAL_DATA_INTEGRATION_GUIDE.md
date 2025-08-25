# SeiMoney Real Data Integration Guide

## Overview

This guide provides comprehensive documentation for the SeiMoney platform's real blockchain data integration. The platform has been successfully converted from mock data to live Sei blockchain interactions, providing users with actual DeFi functionality.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Access to Sei testnet
- Keplr or Leap wallet extension
- Basic understanding of DeFi concepts

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd sei-money

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install

# Install bot dependencies (optional)
cd ../bots/telegram
npm install
```

### Configuration
1. Copy environment variables:
```bash
cp .env.example .env
```

2. Configure contract addresses in `backend/src/config/index.ts`
3. Set up RPC endpoints for Sei testnet
4. Configure wallet connection settings

### Running the Application
```bash
# Start backend API
cd backend
npm run dev

# Start frontend (in new terminal)
cd frontend  
npm run dev

# Start Telegram bot (optional)
cd bots/telegram
npm start
```

## 📋 API Documentation

### Authentication
Most endpoints require wallet authentication. Include the wallet address in request headers:
```
Authorization: Bearer <wallet-address>
```

### Core Endpoints

#### Transfers API
- `GET /api/transfers` - List user transfers
- `POST /api/transfers` - Create new transfer
- `POST /api/transfers/:id/claim` - Claim transfer
- `POST /api/transfers/:id/refund` - Refund transfer

**Example Response:**
```json
{
  "transfers": [
    {
      "id": 1,
      "sender": "sei1...",
      "recipient": "sei1...",
      "amount": "1000000",
      "denom": "usei",
      "status": "pending",
      "created_at": "2024-01-01T00:00:00Z",
      "expiry_ts": 1704067200
    }
  ]
}
```

#### Groups API
- `GET /api/groups` - List group pools
- `POST /api/groups` - Create new group
- `POST /api/groups/:id/contribute` - Contribute to group
- `POST /api/groups/:id/distribute` - Distribute group funds

#### Vaults API
- `GET /api/vaults` - List available vaults
- `POST /api/vaults/:id/deposit` - Deposit to vault
- `POST /api/vaults/:id/withdraw` - Withdraw from vault
- `GET /api/vaults/:id/position` - Get user position

#### Pots API
- `GET /api/pots` - List savings pots
- `POST /api/pots` - Create new pot
- `POST /api/pots/:id/deposit` - Deposit to pot
- `POST /api/pots/:id/break` - Break pot early

#### Market Data API
- `GET /api/market/stats` - Get market statistics
- `GET /api/market/tvl-history` - Get TVL history
- `GET /api/market/analytics` - Get detailed analytics

### Error Handling
All endpoints return standardized error responses:
```json
{
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance for transaction",
    "details": {
      "required": "1000000",
      "available": "500000"
    }
  }
}
```

## 🔗 Wallet Integration Guide

### Supported Wallets
- **Keplr**: Primary wallet with full feature support
- **Leap**: Alternative wallet with transaction capabilities
- **MetaMask**: Limited support for viewing (Sei EVM compatibility)

### Connection Process
1. **Detection**: Check if wallet extension is installed
2. **Connection**: Request wallet connection and permissions
3. **Chain Setup**: Configure Sei testnet if not present
4. **Address Retrieval**: Get user's Sei address
5. **Signing Client**: Create signing client for transactions

### Example Integration
```typescript
import { connectKeplr } from './lib/wallets/keplr';

// Connect to Keplr wallet
const connection = await connectKeplr();
if (connection.success) {
  const { address, signingClient } = connection;
  
  // Execute transaction
  const result = await signingClient.execute(
    address,
    contractAddress,
    message,
    'auto'
  );
}
```

### Transaction Signing
All transactions require user approval through wallet interface:
1. **Gas Estimation**: Automatic gas calculation
2. **Fee Display**: Show transaction fees to user
3. **Confirmation**: User approves transaction
4. **Broadcasting**: Submit to blockchain
5. **Tracking**: Monitor transaction status

## 🛠️ Error Handling Guide

### Common Error Types

#### Blockchain Errors
- **Insufficient Balance**: User doesn't have enough tokens
- **Transaction Timeout**: Network congestion or RPC issues
- **Contract Execution Failed**: Smart contract rejected transaction
- **Invalid Address**: Malformed wallet address

#### Network Errors
- **RPC Connection Failed**: Network connectivity issues
- **Chain Not Configured**: Wallet not set up for Sei
- **Rate Limited**: Too many requests to RPC endpoint

#### User Errors
- **Wallet Not Connected**: User needs to connect wallet
- **Transaction Rejected**: User declined transaction
- **Insufficient Gas**: Not enough gas for transaction

### Error Recovery Strategies

#### Automatic Recovery
- **Retry Logic**: Automatic retries with exponential backoff
- **Fallback RPCs**: Switch to backup RPC endpoints
- **Cache Fallback**: Use cached data when network fails

#### User-Guided Recovery
- **Clear Instructions**: Step-by-step recovery guidance
- **Alternative Actions**: Suggest different approaches
- **Support Links**: Direct users to help resources

### Example Error Handling
```typescript
try {
  const result = await sdk.createTransfer(transferData);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    showError('You need more SEI tokens for this transaction');
    suggestAction('Add funds to your wallet');
  } else if (error.code === 'TRANSACTION_TIMEOUT') {
    showError('Transaction is taking longer than expected');
    suggestAction('Please wait or try again later');
  }
}
```

## 🔧 Troubleshooting Guide

### Common Issues

#### Wallet Connection Problems
**Issue**: Wallet won't connect
**Solutions**:
1. Refresh the page and try again
2. Check if wallet extension is installed and unlocked
3. Clear browser cache and cookies
4. Try a different browser

**Issue**: Wrong network selected
**Solutions**:
1. Switch to Sei testnet in wallet
2. Add Sei testnet configuration if missing
3. Check RPC endpoint configuration

#### Transaction Failures
**Issue**: Transaction rejected by contract
**Solutions**:
1. Check wallet balance is sufficient
2. Verify transaction parameters are correct
3. Wait for network congestion to clear
4. Try with higher gas limit

**Issue**: Transaction stuck pending
**Solutions**:
1. Wait for network confirmation (up to 60 seconds)
2. Check transaction hash on block explorer
3. Retry transaction if needed

#### Data Loading Issues
**Issue**: Data not loading or outdated
**Solutions**:
1. Refresh the page to clear cache
2. Check network connection
3. Verify RPC endpoints are responding
4. Wait for blockchain synchronization

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=seimoney:* npm run dev
```

### Support Resources
- **Documentation**: This guide and API docs
- **Block Explorer**: Check transaction status
- **Community**: Discord/Telegram support channels
- **GitHub Issues**: Report bugs and feature requests

## 🚀 Deployment Configuration

### Environment Variables
```bash
# Blockchain Configuration
SEI_RPC_URL=https://rpc.atlantic-2.seinetwork.io
SEI_CHAIN_ID=atlantic-2
SEI_DENOM=usei

# Contract Addresses
PAYMENTS_CONTRACT=sei1...
GROUPS_CONTRACT=sei1...
VAULTS_CONTRACT=sei1...
POTS_CONTRACT=sei1...
ALIAS_CONTRACT=sei1...
RISK_ESCROW_CONTRACT=sei1...

# API Configuration
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com

# Database (if using)
DATABASE_URL=postgresql://...

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
```

### Production Deployment

#### Backend Deployment
```bash
# Build application
npm run build

# Start production server
npm run start

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

#### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to static hosting (Vercel, Netlify, etc.)
# Or serve with nginx/apache
```

#### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Monitoring Setup

#### Health Checks
- `GET /health` - Basic health check
- `GET /health/contracts` - Contract connectivity
- `GET /health/network` - Network status

#### Metrics Collection
- Response times for API endpoints
- Contract query success rates
- Wallet connection statistics
- Transaction success/failure rates

#### Alerting
Set up alerts for:
- API response time > 5 seconds
- Contract query failure rate > 10%
- RPC endpoint failures
- High error rates

## 📊 Performance Optimization

### Caching Strategy
- **Contract Data**: Cache for 30 seconds
- **Market Data**: Cache for 60 seconds
- **User Balances**: Cache for 15 seconds
- **Static Data**: Cache for 24 hours

### Connection Pooling
- Multiple RPC endpoints for redundancy
- Automatic failover between endpoints
- Connection health monitoring
- Load balancing across endpoints

### Query Optimization
- Batch multiple contract queries
- Use pagination for large datasets
- Implement efficient data structures
- Minimize redundant API calls

## 🔐 Security Considerations

### Wallet Security
- Never store private keys
- Use secure signing methods
- Validate all user inputs
- Implement rate limiting

### API Security
- Input validation and sanitization
- CORS configuration
- Rate limiting per IP/wallet
- Error message sanitization

### Contract Security
- Validate contract addresses
- Check transaction parameters
- Implement spending limits
- Monitor for suspicious activity

## 📈 Monitoring and Analytics

### Key Metrics
- **User Activity**: Daily/monthly active users
- **Transaction Volume**: Total value transferred
- **Success Rates**: Transaction success percentage
- **Performance**: API response times
- **Errors**: Error rates by type

### Monitoring Tools
- Application performance monitoring (APM)
- Blockchain analytics dashboards
- User behavior analytics
- Error tracking and reporting

This guide provides comprehensive documentation for operating and maintaining the SeiMoney platform with real blockchain data integration. For additional support, refer to the troubleshooting section or contact the development team.