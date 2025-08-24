# SeiMoney Backend 🚀

**Production-Grade Backend for SeiMoney DeFi Platform**

A high-performance, scalable backend service built with TypeScript and Fastify, designed to seamlessly integrate with CosmWasm smart contracts on the Sei Network. This backend powers the SeiMoney ecosystem with real-time blockchain indexing, automated workflows, and multi-channel notifications.

## 📊 System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App]
        MOBILE[Mobile App]
        SDK[TypeScript SDK]
    end
    
    subgraph "API Gateway"
        FASTIFY[Fastify Server]
        AUTH[JWT Auth]
        RATE[Rate Limiter]
        CORS[CORS Handler]
    end
    
    subgraph "Core Services"
        INDEXER[Blockchain Indexer]
        SCHEDULER[Job Scheduler]
        NOTIFIER[Notification Service]
        ORACLES[Price Oracles]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
        PRISMA[Prisma ORM]
    end
    
    subgraph "External Services"
        SEI[Sei Network]
        TELEGRAM[Telegram Bot]
        EMAIL[SMTP Server]
        PUSH[WebPush Service]
    end
    
    WEB --> FASTIFY
    MOBILE --> FASTIFY
    SDK --> FASTIFY
    
    FASTIFY --> AUTH
    FASTIFY --> RATE
    FASTIFY --> CORS
    
    FASTIFY --> INDEXER
    FASTIFY --> SCHEDULER
    FASTIFY --> NOTIFIER
    FASTIFY --> ORACLES
    
    INDEXER --> PRISMA
    SCHEDULER --> REDIS
    NOTIFIER --> PRISMA
    ORACLES --> REDIS
    
    PRISMA --> POSTGRES
    
    INDEXER --> SEI
    NOTIFIER --> TELEGRAM
    NOTIFIER --> EMAIL
    NOTIFIER --> PUSH
    ORACLES --> SEI
```

## 🎯 Key Features

- ⚡ **High Performance**: Built with Fastify for maximum throughput
- 🔄 **Real-time Indexing**: Live blockchain event processing
- 🤖 **Automated Workflows**: Smart job scheduling with BullMQ
- 📱 **Multi-channel Notifications**: Telegram, Email, WebPush
- 🔒 **Enterprise Security**: JWT auth, rate limiting, input validation
- 📊 **Production Ready**: Health checks, monitoring, graceful shutdown
- 🌐 **Scalable Architecture**: Microservices-ready design

## ⚡ Quick Start (TL;DR)

```bash
# 1. Install dependencies
cd backend && npm install

# 2. Setup environment
cp env.example .env

# 3. Generate database client
npm run db:generate

# 4. Start development server
npm run dev

# 5. Test the API
curl http://localhost:3001/health
```

**🎉 Backend running on http://localhost:3001**

## 🏗️ Architecture

The backend is built as a modular microservices architecture with the following components:

- **API Gateway**: Fastify-based REST API with JWT authentication
- **Blockchain Indexer**: Real-time event indexing from Tendermint WebSocket
- **Scheduler**: BullMQ-based job processing for automated workflows
- **Notifier**: Multi-channel notification system (Telegram, Email, WebPush)
- **Oracles**: Price feeds and APR calculations for DeFi strategies

## 🚀 Quick Start Guide

### System Requirements

| Component | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **PostgreSQL** | 13+ | Primary database |
| **Redis** | 6+ | Caching & job queue |
| **TypeScript** | 5.0+ | Development language |

### 🔧 Installation Steps

#### 1. **Environment Setup**
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp env.example .env
```

#### 2. **Database Configuration**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Open database studio
npm run db:studio
```

#### 3. **Start Development Server**
```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build && npm start

# Run with PM2 (production)
pm2 start ecosystem.config.js
```

### 🌐 Server Status

Once started, the backend will be available at:

- **API Endpoint**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/health`
- **API Documentation**: `http://localhost:3001/docs` (if enabled)

### ⚡ Quick Test

```bash
# Test basic connectivity
curl http://localhost:3001/health

# Expected response:
# {"ok":true,"status":"healthy","timestamp":"2025-08-24T...","service":"seimoney-backend","version":"1.0.0"}
```

## ⚙️ Configuration

### Environment Variables

```bash
# Network Configuration
CHAIN_ID=sei-testnet-1
RPC_URL=https://rpc.testnet.sei.io
REST_URL=https://rest.testnet.sei.io
DENOM=usei

# Smart Contract Addresses
CONTRACT_PAYMENTS=sei1...
CONTRACT_GROUPS=sei1...
CONTRACT_POTS=sei1...
CONTRACT_VAULTS=sei1...
CONTRACT_ESCROW=sei1...

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/seimoney

# Redis
REDIS_URL=redis://localhost:6379

# Security
INTERNAL_SHARED_SECRET=your-super-secret-key-here
JWT_SECRET=your-jwt-secret-here

# Notification Services
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# WebPush
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# External APIs
RIVALZ_API_KEY=your-rivalz-api-key
RIVALZ_BASE_URL=https://api.rivalz.io
```

## 📊 Database Schema

The backend uses **Prisma ORM** with **PostgreSQL** for robust data persistence:

### Core Models

| Model | Description | Key Fields |
|-------|-------------|------------|
| **User** | Wallet addresses & metadata | `address`, `username`, `created_at` |
| **Transfer** | Payment transfers | `id`, `sender`, `recipient`, `amount`, `status` |
| **Vault** | DeFi investment vaults | `id`, `strategy`, `tvl`, `apy` |
| **Group** | Collaborative funding pools | `id`, `name`, `target_amount`, `participants` |
| **Pot** | Personal savings goals | `id`, `owner`, `goal_amount`, `current_amount` |
| **Escrow** | Multi-party escrow cases | `id`, `parties`, `amount`, `status` |
| **EventLog** | Blockchain event history | `block_height`, `tx_hash`, `event_type` |
| **Notification** | User notifications | `user_id`, `type`, `channel`, `delivered_at` |

### Database Relationships

```mermaid
erDiagram
    User ||--o{ Transfer : creates
    User ||--o{ Vault : owns
    User ||--o{ Group : participates
    User ||--o{ Pot : owns
    User ||--o{ Escrow : involved
    User ||--o{ Notification : receives
    
    Transfer ||--o{ EventLog : generates
    Vault ||--o{ EventLog : generates
    Group ||--o{ EventLog : generates
    
    User {
        string address PK
        string username
        json metadata
        timestamp created_at
    }
    
    Transfer {
        bigint id PK
        string sender FK
        string recipient
        string amount
        string status
        timestamp expiry_ts
    }
    
    Vault {
        bigint id PK
        string owner FK
        string strategy
        decimal tvl
        decimal apy
    }
```

## 🔌 API Reference

### 🔐 Authentication

All protected endpoints require JWT authentication:

```bash
# Header format
Authorization: Bearer <jwt-token>

# Get JWT token
POST /api/v1/auth/login
Content-Type: application/json

{
  "address": "sei1...",
  "signature": "0x...",
  "message": "Login to SeiMoney"
}
```

### 📋 API Endpoints Overview

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| **Health** | `/health` | GET | Basic health check |
| **Health** | `/health/detailed` | GET | Detailed system status |
| **Auth** | `/api/v1/auth/login` | POST | User authentication |
| **Transfers** | `/api/v1/transfers` | GET/POST | Transfer management |
| **Vaults** | `/api/v1/vaults` | GET/POST | Vault operations |
| **Groups** | `/api/v1/groups` | GET/POST | Group management |
| **Pots** | `/api/v1/pots` | GET/POST | Savings pot operations |
| **Escrow** | `/api/v1/escrow` | GET/POST | Escrow case management |

### 💰 Transfers API

```bash
# Create transfer
POST /api/v1/transfers
{
  "recipient": "sei1...",
  "amount": "1000000",
  "denom": "usei",
  "expiry_ts": 1724505600,
  "remark": "Payment for services"
}

# List transfers
GET /api/v1/transfers?status=pending&limit=20&offset=0

# Get transfer details
GET /api/v1/transfers/:id

# Claim transfer
POST /api/v1/transfers/:id/claim

# Refund transfer
POST /api/v1/transfers/:id/refund
```

### 🏦 Vaults API

```bash
# List vaults
GET /api/v1/vaults?strategy=yield_farming&limit=10

# Get vault details
GET /api/v1/vaults/:id

# Deposit to vault
POST /api/v1/vaults/:id/deposit
{
  "amount": "5000000",
  "denom": "usei"
}

# Withdraw from vault
POST /api/v1/vaults/:id/withdraw
{
  "shares": "1000000"
}
```

### 🏥 Health Monitoring

```bash
# Basic health (fast response)
GET /health
# Response: {"ok":true,"status":"healthy","timestamp":"..."}

# Detailed health (includes dependencies)
GET /health/detailed
# Response: {"ok":true,"checks":{"database":"healthy","blockchain":"healthy"}}

# Kubernetes probes
GET /health/ready   # Readiness probe
GET /health/live    # Liveness probe
```

## 🔗 Smart Contract Integration

The backend integrates with SeiMoney smart contracts through a unified SDK:

```typescript
import { getSdk } from './lib/sdk';

const sdk = await getSdk();

// Create a transfer
const transferId = await sdk.payments.createTransfer({
  recipient: 'sei1...',
  amount: '1000usei',
  expiry: Date.now() + 86400000, // 24 hours
});

// Get vault information
const vault = await sdk.vaults.getVault('vault-id');
```

## 📡 Blockchain Indexing

The indexer service:
- Connects to Tendermint WebSocket for real-time events
- Parses WASM contract events
- Stores events in PostgreSQL for fast querying
- Triggers downstream services (notifications, jobs)

## ⏱️ Job Scheduling

The scheduler handles automated workflows:
- **Expired Transfers**: Auto-refund expired transfers
- **Vault Harvests**: Scheduled APY harvesting
- **Vault Rebalancing**: AI-generated rebalancing plans
- **Escrow Expiries**: Resolve expired escrow cases

## 🔔 Notifications

Multi-channel notification system:
- **Telegram**: Bot notifications for real-time updates
- **Email**: SMTP-based email delivery
- **WebPush**: Browser push notifications

## 🧪 Development

### Running Tests
```bash
npm test
```

### Code Quality
```bash
npm run lint
npm run format
```

### Database Management
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## 🚢 Production Deployment

### 🐳 Docker Deployment

```bash
# Build production image
docker build -t seimoney-backend:latest .

# Run with environment variables
docker run -d \
  --name seimoney-backend \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  -e NODE_ENV="production" \
  seimoney-backend:latest

# Using Docker Compose
docker-compose up -d
```

### ☸️ Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: seimoney-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: seimoney-backend
  template:
    metadata:
      labels:
        app: seimoney-backend
    spec:
      containers:
      - name: backend
        image: seimoney-backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: seimoney-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 🌍 Environment Configurations

| Environment | Database | Network | Features |
|-------------|----------|---------|----------|
| **Development** | Local PostgreSQL | Sei Testnet | Hot reload, debug logs |
| **Staging** | Cloud PostgreSQL | Sei Testnet | Production-like setup |
| **Production** | Managed PostgreSQL | Sei Mainnet | Full security, monitoring |

### 📊 Monitoring & Observability

```bash
# Health monitoring
curl -f http://localhost:3001/health || exit 1

# Metrics endpoint (if enabled)
curl http://localhost:3001/metrics

# Log aggregation
docker logs seimoney-backend --tail 100 -f
```

## 🔒 Security Features

- JWT-based authentication
- Rate limiting per user
- Idempotency keys for critical operations
- Input validation with Zod schemas
- CORS configuration
- Helmet security headers

## 📈 Monitoring

- Structured logging with Winston
- Health check endpoints
- Metrics collection (Prometheus-ready)
- Error tracking and alerting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For questions and support:
- Create an issue on GitHub
- Join our Discord community
- Check the documentation

---

**Built with ❤️ for the Sei Network ecosystem**
