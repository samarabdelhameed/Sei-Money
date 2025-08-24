# SeiMoney Bots Layer 🤖

Multi-platform bot integration for SeiMoney DeFi services, enabling users to interact with the platform directly from Telegram and Discord.

## 🚀 Features

### Telegram Bot
- **Complete DeFi Integration**: Access all SeiMoney services via chat commands
- **Wallet Management**: Bind/unbind Sei wallets securely
- **Real-time Notifications**: Get updates on transactions and activities
- **Session Management**: Persistent user sessions with Redis
- **Comprehensive Logging**: Detailed activity and error logging

### Discord Bot
- **Slash Commands**: Modern Discord slash command interface
- **Same Functionality**: All Telegram features available on Discord
- **Server Integration**: Can be deployed to specific Discord servers
- **Rich Embeds**: Beautiful message formatting with Discord embeds

## 📂 Structure

```
bots/
├── telegram/                 # Telegram Bot
│   ├── src/
│   │   ├── index.ts         # Bot entry point
│   │   ├── commands/        # Command handlers
│   │   │   ├── transfer.ts  # /transfer command
│   │   │   ├── claim.ts     # /claim command
│   │   │   ├── refund.ts    # /refund command
│   │   │   ├── pool.ts      # /pool commands
│   │   │   ├── pot.ts       # /pot commands
│   │   │   ├── escrow.ts    # /escrow commands
│   │   │   └── vault.ts     # /vault commands
│   │   ├── lib/
│   │   │   ├── sdk.ts       # SeiMoney SDK integration
│   │   │   ├── session.ts   # User session management
│   │   │   └── logger.ts    # Logging system
│   │   └── types/
│   │       └── index.ts     # TypeScript definitions
│   ├── package.json
│   └── tsconfig.json
└── discord/                 # Discord Bot
    ├── src/
    │   ├── index.ts         # Bot entry point
    │   ├── commands/        # Slash command handlers
    │   ├── lib/             # Shared libraries
    │   └── types/           # TypeScript definitions
    ├── package.json
    └── tsconfig.json
```

## 🛠️ Available Commands

### 💰 Transfer Commands
- `/transfer <recipient> <amount> [remark]` - Send protected transfers
- `/claim <transfer_id>` - Claim received transfers
- `/refund <transfer_id>` - Refund expired transfers

### 👥 Pool Commands
- `/pool create <target> [memo] [expiry_hours]` - Create funding pools
- `/pool contribute <pool_id> <amount>` - Contribute to pools
- `/pool distribute <pool_id>` - Distribute pool funds
- `/pool status <pool_id>` - Check pool status
- `/pool list` - List all pools

### 🏺 Pot Commands
- `/pot open <goal> [label]` - Open savings pots
- `/pot deposit <pot_id> <amount>` - Add to savings
- `/pot break <pot_id>` - Emergency withdrawal
- `/pot close <pot_id>` - Close completed pot
- `/pot status <pot_id>` - Check pot progress
- `/pot list` - List all pots

### 🛡️ Escrow Commands
- `/escrow open <amount> <model> <parties> [expiry] [remark]` - Open escrow cases
- `/escrow approve <case_id>` - Approve escrow resolution
- `/escrow dispute <case_id> [reason]` - Dispute escrow case
- `/escrow status <case_id>` - Check case status
- `/escrow list` - List all cases

### 🏦 Vault Commands
- `/vault create <label> [strategy] [fee]` - Create yield vaults
- `/vault deposit <vault_id> <amount>` - Deposit to vault
- `/vault withdraw <vault_id> <shares>` - Withdraw from vault
- `/vault harvest <vault_id>` - Harvest yields
- `/vault rebalance <vault_id>` - Rebalance strategy
- `/vault status <vault_id>` - Check vault performance
- `/vault list` - List all vaults

### 🔧 Utility Commands
- `/bind <sei_address>` - Connect Sei wallet
- `/unbind` - Disconnect wallet
- `/status` - Check account status
- `/balance` - Check wallet balance
- `/help` - Show all commands

## 🚀 Quick Start

### Telegram Bot

1. **Install Dependencies**
```bash
cd bots/telegram
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Required Environment Variables**
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
SEI_RPC_URL=https://sei-testnet-rpc.polkachu.com
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://user:password@localhost:5432/seimoney

# Contract Addresses
CONTRACT_PAYMENTS=sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg
CONTRACT_GROUPS=sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt
CONTRACT_POTS=sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj
CONTRACT_ALIAS=sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4
CONTRACT_RISK_ESCROW=sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj
CONTRACT_VAULTS=sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h
```

4. **Build and Run**
```bash
npm run build
npm start

# Or for development
npm run dev
```

### Discord Bot

1. **Install Dependencies**
```bash
cd bots/discord
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Required Environment Variables**
```env
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_guild_id  # Optional, for guild-specific commands
SEI_RPC_URL=https://sei-testnet-rpc.polkachu.com
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://user:password@localhost:5432/seimoney

# Same contract addresses as Telegram bot
```

4. **Build and Run**
```bash
npm run build
npm start

# Or for development
npm run dev
```

## 🔧 Configuration

### Redis Setup
Both bots require Redis for session management:

```bash
# Install Redis
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu

# Start Redis
redis-server
```

### Database Setup
Configure PostgreSQL connection for user data:

```sql
-- Create database
CREATE DATABASE seimoney;

-- Create user sessions table (if not exists)
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    sei_address VARCHAR(100),
    is_bound BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, user_id)
);
```

## 🔐 Security Features

### Wallet Binding
- Secure address validation
- Session-based authentication
- Redis-backed session storage
- Automatic session expiry

### Transaction Security
- Balance verification before transactions
- Address format validation
- Transaction confirmation flows
- Comprehensive error handling

### Privacy Protection
- Ephemeral messages for sensitive data
- No private key storage
- Secure session management
- Activity logging without sensitive data

## 📊 Monitoring & Logging

### Logging System
- Structured JSON logging with Winston
- Separate log files for different components
- Error tracking and debugging
- User activity monitoring

### Log Files
- `logs/combined.log` - All bot activities
- `logs/error.log` - Error-specific logs
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

### Metrics Tracking
- Command usage statistics
- Transaction success rates
- User engagement metrics
- Performance monitoring

## 🔄 Integration with SeiMoney Ecosystem

### SDK Integration
- Direct integration with SeiMoney SDK
- Unified contract interaction
- Consistent error handling
- Shared type definitions

### Backend Synchronization
- Real-time transaction updates
- Notification system integration
- User preference synchronization
- Cross-platform session management

### Contract Interaction
- All SeiMoney contracts supported
- Automatic gas estimation
- Transaction retry logic
- Event monitoring and notifications

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
```bash
# Production environment variables
NODE_ENV=production
LOG_LEVEL=info
REDIS_URL=redis://production-redis:6379
DATABASE_URL=postgresql://prod-user:password@prod-db:5432/seimoney
```

2. **Process Management**
```bash
# Using PM2
npm install -g pm2

# Start Telegram bot
pm2 start dist/index.js --name "seimoney-telegram-bot"

# Start Discord bot
pm2 start dist/index.js --name "seimoney-discord-bot"

# Save PM2 configuration
pm2 save
pm2 startup
```

3. **Docker Deployment**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY logs/ ./logs/

EXPOSE 3000
CMD ["npm", "start"]
```

### Health Monitoring
- Bot uptime monitoring
- Redis connection health checks
- Database connectivity verification
- Transaction processing metrics

## 🤝 Contributing

1. **Development Setup**
```bash
git clone <repository>
cd bots/telegram  # or bots/discord
npm install
npm run dev
```

2. **Code Standards**
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Comprehensive error handling

3. **Testing**
```bash
npm run test
npm run lint
npm run format
```

## 📚 API Reference

### Session Management
```typescript
// Get user session
const session = await sessionManager.getUserSession(userId);

// Bind wallet
await sessionManager.bindSeiAddress(userId, seiAddress);

// Update preferences
await sessionManager.updateUserPreferences(userId, preferences);
```

### SDK Integration
```typescript
// Initialize SDK
const sdk = new SeiMoneyBotSDK(config);
await sdk.initialize(mnemonic);

// Create transfer
const result = await sdk.createTransfer(recipient, amount, denom, remark);

// Query balance
const balance = await sdk.getBalance(address);
```

## 🐛 Troubleshooting

### Common Issues

1. **Bot Not Responding**
   - Check bot token validity
   - Verify network connectivity
   - Check Redis connection
   - Review error logs

2. **Transaction Failures**
   - Verify contract addresses
   - Check RPC endpoint status
   - Validate user wallet binding
   - Review gas settings

3. **Session Issues**
   - Check Redis server status
   - Verify session expiry settings
   - Review user binding status
   - Check database connectivity

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Check specific logs
tail -f logs/error.log
tail -f logs/combined.log
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the main project README
- **Issues**: Report bugs via GitHub issues
- **Community**: Join our Discord server
- **Email**: Contact the development team

---

**Built with ❤️ for the SeiMoney ecosystem** 🐒💰