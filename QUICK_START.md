# SeiMoney Quick Start Guide ⚡

## 🚀 Get Running in 5 Minutes

### Prerequisites Check ✅

```bash
# Check Node.js version (need 18+)
node --version

# Check npm version
npm --version

# Check if PostgreSQL is running (optional for dev)
psql --version

# Check if Redis is running (optional for dev)
redis-cli ping
```

### 1. Clone & Setup 📥

```bash
# Clone the repository
git clone https://github.com/yourusername/SeiMoney.git
cd SeiMoney

# Install root dependencies
npm install
```

### 2. Backend Setup 🔧

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Setup environment variables
cp env.example .env

# Generate Prisma client
npm run db:generate

# Start development server
npm run dev
```

**✅ Backend should now be running on http://localhost:3001**

### 3. Test Backend 🧪

```bash
# Test health endpoint
curl http://localhost:3001/health

# Expected response:
# {"ok":true,"status":"healthy","timestamp":"2025-08-24T...","service":"seimoney-backend","version":"1.0.0"}

# Test main endpoint
curl http://localhost:3001/

# Expected response:
# {"message":"SeiMoney Backend API","version":"1.0.0","status":"running","timestamp":"..."}
```

### 4. Frontend Setup 🌐

```bash
# Open new terminal, navigate to app
cd app

# Open in browser
open index.html

# Or serve with a simple HTTP server
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

### 5. Verify Everything Works 🎉

```bash
# Check backend logs
cd backend
npm run dev
# Should show: "Backend running on 0.0.0.0:3001"

# Check frontend
# Open browser to app/index.html
# Should see SeiMoney interface
```

## 🛠️ Development Commands

### Backend Commands

```bash
cd backend

# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio

# Code quality
npm run lint          # ESLint
npm run format        # Prettier
npm test             # Run tests
```

### Smart Contracts Commands

```bash
cd contracts

# Build all contracts
RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown

# Run tests
cargo test --workspace

# Test specific contract
cargo test -p seimoney-payments

# Check contract sizes
ls -lh target/wasm32-unknown-unknown/release/*.wasm
```

## 🔧 Environment Configuration

### Backend Environment (.env)

```bash
# Copy and edit the environment file
cd backend
cp env.example .env

# Key variables to configure:
# PORT=3001                    # Backend port
# DATABASE_URL=file:./dev.db   # SQLite for development
# NODE_ENV=development         # Environment mode
# LOG_LEVEL=info              # Logging level
```

### Frontend Configuration

The frontend is a static HTML/JS application that connects to:
- Backend API: `http://localhost:3001`
- Sei Network: Testnet (atlantic-2)

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check if port 3001 is in use
lsof -ti:3001

# Kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Try different port
PORT=3002 npm run dev
```

#### Database connection issues
```bash
# Reset database
rm -f backend/dev.db
cd backend
npm run db:generate
npm run db:push
```

#### Node.js version issues
```bash
# Check Node.js version
node --version

# Install Node.js 18+ if needed
# macOS: brew install node@18
# Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

### Performance Issues

#### Backend is slow
```bash
# Check if Redis is running (optional but improves performance)
redis-cli ping

# Start Redis if not running
# macOS: brew services start redis
# Ubuntu: sudo systemctl start redis
```

#### Frontend is slow
```bash
# Use a proper HTTP server instead of file://
cd app
python3 -m http.server 8000
# Or: npx serve .
```

## 📊 Development Workflow

### 1. Make Changes
```bash
# Backend changes - auto-reload with tsx watch
cd backend
npm run dev

# Frontend changes - refresh browser
# Edit files in app/ directory

# Smart contract changes
cd contracts
cargo build --release --target wasm32-unknown-unknown
cargo test
```

### 2. Test Changes
```bash
# Test backend API
curl http://localhost:3001/health

# Test smart contracts
cd contracts
cargo test --workspace

# Test frontend
# Open browser and test functionality
```

### 3. Commit Changes
```bash
# Add and commit changes
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin main
```

## 🚀 Next Steps

Once you have everything running:

1. **Explore the API**: Check `backend/src/services/api-gateway/routes/`
2. **Modify the Frontend**: Edit files in `app/`
3. **Deploy Smart Contracts**: Follow `contracts/DEPLOYMENT.md`
4. **Read Documentation**: Check `docs/` directory
5. **Join Community**: Discord, Telegram, GitHub Discussions

## 📞 Need Help?

- **GitHub Issues**: [Create an issue](https://github.com/seimoney/issues)
- **Discord**: [Join our Discord](https://discord.gg/seimoney)
- **Documentation**: [Full docs](https://docs.seimoney.io)

---

**🎉 You're now ready to develop with SeiMoney!**

*Happy coding! 🚀*