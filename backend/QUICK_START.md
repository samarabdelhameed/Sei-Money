# 🚀 SeiMoney Backend - Quick Start Guide

## 📋 Prerequisites

- **Node.js** 18+
- **Docker** & **Docker Compose**
- **PostgreSQL** 13+ (or use Docker)
- **Redis** 6+ (or use Docker)

## ⚡ Quick Start (5 minutes)

### 1. **Clone & Setup**

```bash
cd backend
npm install
```

### 2. **Environment Setup**

```bash
cp env.example .env
# Edit .env with your configuration
```

### 3. **Start Infrastructure**

```bash
# Start PostgreSQL + Redis
docker-compose up -d postgres redis

# Wait for services to be healthy
docker-compose ps
```

### 4. **Database Setup**

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed data
npm run db:seed
```

### 5. **Start Backend Services**

```bash
# Development mode (all services)
npm run dev

# Or start individual services:
npm run dev:api-gateway
npm run dev:indexer
npm run dev:scheduler
npm run dev:notifier
npm run dev:oracles
```

## 🌐 Service URLs

| Service          | URL                          | Status |
| ---------------- | ---------------------------- | ------ |
| **API Gateway**  | http://localhost:3001        | ✅     |
| **Health Check** | http://localhost:3001/health | ✅     |
| **API Docs**     | http://localhost:3001/docs   | 📚     |

## 🔧 Development Commands

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database
```

## 📊 Database Schema

The backend uses **Prisma ORM** with **PostgreSQL**:

```bash
# View database schema
npm run db:studio

# Reset database (⚠️ DESTRUCTIVE)
npm run db:reset
```

## 🔍 Monitoring & Logs

### Health Checks

```bash
# Basic health
curl http://localhost:3001/health

# Detailed health
curl http://localhost:3001/health/detailed
```

### Logs

```bash
# View logs
docker-compose logs -f backend

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# View running containers
docker-compose ps

# View logs
docker-compose logs -f
```

## 🚀 Production Deployment

### Using PM2

```bash
# Build for production
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs
```

### Using Docker

```bash
# Build production image
docker build -t seimoney-backend:latest .

# Run production container
docker run -d \
  --name seimoney-backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  seimoney-backend:latest
```

## 🔐 Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/seimoney

# Redis
REDIS_URL=redis://localhost:6379

# Network
CHAIN_ID=sei-testnet-1
RPC_URL=https://rpc.testnet.sei.io
REST_URL=https://rest.testnet.sei.io

# Contracts
CONTRACT_PAYMENTS=sei1...
CONTRACT_GROUPS=sei1...
CONTRACT_POTS=sei1...
CONTRACT_VAULTS=sei1...
CONTRACT_ESCROW=sei1...
```

### Optional

```bash
# Security
INTERNAL_SHARED_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret

# Notifications
TELEGRAM_BOT_TOKEN=your-bot-token
SMTP_URL=smtp://user:pass@smtp.gmail.com:587
VAPID_PUBLIC_KEY=your-vapid-public
VAPID_PRIVATE_KEY=your-vapid-private

# External APIs
RIVALZ_API_KEY=your-rivalz-key
RIVALZ_BASE_URL=https://api.rivalz.io
```

## 🧪 Testing

### API Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test transfers API
curl -X POST http://localhost:3001/api/v1/transfers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "recipient": "sei1...",
    "amount": "1000000",
    "denom": "usei"
  }'
```

### Database Testing

```bash
# Connect to database
psql postgresql://seimoney:seimoney123@localhost:5432/seimoney

# View tables
\dt

# Query data
SELECT * FROM "User" LIMIT 5;
```

## 🚨 Troubleshooting

### Common Issues

#### 1. **Database Connection Failed**

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart service
docker-compose restart postgres
```

#### 2. **Redis Connection Failed**

```bash
# Check if Redis is running
docker-compose ps redis

# Test connection
docker exec seimoney-redis redis-cli ping

# Restart service
docker-compose restart redis
```

#### 3. **Port Already in Use**

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

#### 4. **Prisma Errors**

```bash
# Regenerate client
npm run db:generate

# Reset database
npm run db:reset

# Check schema
npx prisma validate
```

### Performance Issues

#### 1. **High Memory Usage**

```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.yml
```

#### 2. **Slow Database Queries**

```bash
# Enable query logging
# Add to .env: DEBUG="prisma:query"

# Check slow queries
# Use Prisma Studio or database logs
```

## 📚 Next Steps

1. **Configure Smart Contracts** - Update contract addresses in `.env`
2. **Set up Notifications** - Configure Telegram, Email, WebPush
3. **Configure Oracles** - Set up price feeds and APR sources
4. **Set up Monitoring** - Configure Prometheus, Grafana
5. **Deploy to Production** - Use PM2 or Docker

## 🆘 Support

- **Documentation**: Check the main README.md
- **Issues**: Create GitHub issue
- **Discord**: Join our community
- **Email**: support@seimoney.xyz

---

**🎉 Your SeiMoney backend is now running!**

Visit http://localhost:3001/health to verify everything is working.
