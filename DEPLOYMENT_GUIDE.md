# SeiMoney Deployment Guide

## Overview

This guide covers deploying SeiMoney to production with real blockchain data integration. The platform consists of multiple components that need to be deployed and configured correctly.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Sei Blockchain│
│   (React/Next)  │◄──►│   (Node.js)     │◄──►│   (Contracts)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Database      │              │
         │              │   (PostgreSQL)  │              │
         │              └─────────────────┘              │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Telegram Bot  │    │   MCP Agents    │    │   Monitoring    │
│   (Optional)    │    │   (Risk/Rebal.) │    │   (Metrics)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 50GB+ SSD
- **Network**: Stable internet connection with low latency to Sei RPC

### Software Dependencies
- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **PostgreSQL**: 14+ (if using database features)
- **Redis**: 6+ (for caching and sessions)
- **Nginx**: For reverse proxy and SSL termination
- **PM2**: For process management
- **Docker**: Optional, for containerized deployment

### External Services
- **Sei RPC Endpoints**: Multiple endpoints for redundancy
- **Block Explorer API**: For transaction verification
- **Monitoring Service**: Datadog, New Relic, or similar
- **Error Tracking**: Sentry or similar
- **CDN**: CloudFlare or similar for frontend assets

## Environment Configuration

### Backend Environment Variables

Create `.env` file in the backend directory:

```bash
# Application Configuration
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Blockchain Configuration
SEI_CHAIN_ID=pacific-1
SEI_DENOM=usei
SEI_RPC_URLS=https://rpc.sei-apis.com,https://sei-rpc.polkachu.com,https://rpc.sei.silentvalidator.com
SEI_REST_URLS=https://rest.sei-apis.com,https://sei-api.polkachu.com,https://rest.sei.silentvalidator.com

# Smart Contract Addresses (Update with mainnet addresses)
PAYMENTS_CONTRACT=sei1...
GROUPS_CONTRACT=sei1...
VAULTS_CONTRACT=sei1...
POTS_CONTRACT=sei1...
ALIAS_CONTRACT=sei1...
RISK_ESCROW_CONTRACT=sei1...

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/seimoney
REDIS_URL=redis://localhost:6379

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-here
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# External Services
SENTRY_DSN=https://your-sentry-dsn
DATADOG_API_KEY=your-datadog-api-key

# Feature Flags
ENABLE_TELEGRAM_BOT=true
ENABLE_MCP_AGENTS=true
ENABLE_REAL_TIME_UPDATES=true
ENABLE_CACHING=true

# Performance Configuration
CONNECTION_POOL_SIZE=10
CACHE_TTL_SECONDS=30
MAX_RETRY_ATTEMPTS=3
REQUEST_TIMEOUT_MS=10000
```

### Frontend Environment Variables

Create `.env.production` file in the frontend directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=wss://api.your-domain.com

# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=pacific-1
NEXT_PUBLIC_CHAIN_NAME=Sei Network
NEXT_PUBLIC_RPC_URL=https://rpc.sei-apis.com
NEXT_PUBLIC_REST_URL=https://rest.sei-apis.com

# Wallet Configuration
NEXT_PUBLIC_SUPPORTED_WALLETS=keplr,leap,metamask

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_TRACKING=true

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
NEXT_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-sentry-dsn
```

## Database Setup

### PostgreSQL Installation and Configuration

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE seimoney;
CREATE USER seimoney_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE seimoney TO seimoney_user;
\q

# Configure PostgreSQL for production
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: shared_preload_libraries = 'pg_stat_statements'
# Set: max_connections = 100
# Set: shared_buffers = 256MB

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add: host seimoney seimoney_user 127.0.0.1/32 md5

sudo systemctl restart postgresql
```

### Database Schema Migration

```bash
cd backend
npm run db:migrate
npm run db:seed  # Optional: seed with initial data
```

### Redis Installation

```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: maxmemory 256mb
# Set: maxmemory-policy allkeys-lru
# Set: save 900 1

sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## Application Deployment

### Backend Deployment

```bash
# Clone repository
git clone https://github.com/your-org/seimoney.git
cd seimoney/backend

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'seimoney-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Frontend Deployment

#### Option 1: Static Deployment (Recommended)

```bash
cd frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Deploy to static hosting (Vercel, Netlify, etc.)
# Or copy build files to web server
sudo cp -r .next/static /var/www/seimoney/
sudo cp -r public /var/www/seimoney/
```

#### Option 2: Server-Side Rendering

```bash
# Create PM2 config for Next.js
cat > ecosystem.frontend.config.js << EOF
module.exports = {
  apps: [{
    name: 'seimoney-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/frontend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

pm2 start ecosystem.frontend.config.js
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/seimoney
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # WebSocket Support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}

# Rate limiting configuration
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/seimoney /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate Setup

### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Set up automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### Application Monitoring

```bash
# Install monitoring agent (example: Datadog)
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=your-api-key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure custom metrics
cat > /etc/datadog-agent/conf.d/seimoney.yaml << EOF
init_config:

instances:
  - url: http://localhost:3001/health
    name: seimoney_api
    timeout: 5
EOF

sudo systemctl restart datadog-agent
```

### Log Management

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/seimoney
# Add log rotation rules for PM2 logs

# Set up centralized logging (optional)
# Configure rsyslog or use ELK stack
```

### Health Checks

Create health check endpoints:
- `GET /health` - Basic application health
- `GET /health/detailed` - Detailed system status
- `GET /health/contracts` - Smart contract connectivity
- `GET /health/database` - Database connectivity

## Security Configuration

### Firewall Setup

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Security Hardening

```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Configure automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Backup Strategy

### Database Backups

```bash
# Create backup script
cat > /usr/local/bin/backup-seimoney.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/seimoney"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U seimoney_user seimoney | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-backup-bucket/
EOF

chmod +x /usr/local/bin/backup-seimoney.sh

# Schedule daily backups
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-seimoney.sh
```

### Application Backups

```bash
# Backup application files and configuration
tar -czf /var/backups/seimoney/app_backup_$(date +%Y%m%d).tar.gz \
  /path/to/seimoney \
  /etc/nginx/sites-available/seimoney \
  /etc/systemd/system/seimoney.service
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_transfers_sender ON transfers(sender);
CREATE INDEX idx_transfers_recipient ON transfers(recipient);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_vaults_active ON vaults(active);

-- Analyze query performance
ANALYZE;
```

### Caching Strategy

```bash
# Redis configuration for caching
redis-cli CONFIG SET maxmemory-policy allkeys-lru
redis-cli CONFIG SET maxmemory 512mb
```

### CDN Configuration

Configure CloudFlare or similar CDN:
- Cache static assets for 1 year
- Cache API responses for 30 seconds
- Enable Brotli compression
- Set up geographic distribution

## Deployment Automation

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
          
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test
          
      - name: Build applications
        run: |
          cd backend && npm run build
          cd ../frontend && npm run build
          
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/seimoney
            git pull origin main
            cd backend && npm ci --only=production && npm run build
            cd ../frontend && npm ci && npm run build
            pm2 restart seimoney-api
            pm2 restart seimoney-frontend
```

## Troubleshooting

### Common Issues

**High Memory Usage:**
- Check for memory leaks in Node.js processes
- Optimize database queries
- Adjust PM2 memory limits

**Slow API Responses:**
- Check database query performance
- Verify RPC endpoint latency
- Review caching configuration

**Contract Connection Issues:**
- Verify RPC endpoints are accessible
- Check contract addresses are correct
- Monitor network connectivity

**SSL Certificate Issues:**
- Verify certificate validity
- Check certificate chain
- Ensure proper nginx configuration

### Monitoring Commands

```bash
# Check application status
pm2 status
pm2 logs seimoney-api --lines 100

# Check system resources
htop
df -h
free -h

# Check database performance
sudo -u postgres psql seimoney -c "SELECT * FROM pg_stat_activity;"

# Check nginx status
sudo nginx -t
sudo systemctl status nginx

# Check SSL certificate
openssl x509 -in /path/to/certificate.crt -text -noout
```

## Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor application logs
- Check system resources
- Verify backup completion

**Weekly:**
- Review performance metrics
- Update security patches
- Clean up old log files

**Monthly:**
- Review and optimize database
- Update dependencies
- Security audit

### Update Procedure

```bash
# 1. Backup current deployment
/usr/local/bin/backup-seimoney.sh

# 2. Pull latest changes
git pull origin main

# 3. Update dependencies
cd backend && npm ci --only=production
cd ../frontend && npm ci

# 4. Run database migrations
npm run db:migrate

# 5. Build applications
cd backend && npm run build
cd ../frontend && npm run build

# 6. Restart services
pm2 restart all

# 7. Verify deployment
curl -f http://localhost:3001/health
```

This deployment guide provides comprehensive instructions for deploying SeiMoney to production with proper security, monitoring, and maintenance procedures.