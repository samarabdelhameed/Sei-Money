# 🚀 Sei Money Scripts

This directory contains all the automation scripts for building, deploying, and managing the Sei Money project.

## 📋 Quick Start

```bash
# Setup everything
make setup

# Setup wallet
make setup-wallet

# Build contracts
make build

# Deploy a contract
make deploy CONTRACT=payments

# Check status
make status
```

## 🔧 Available Scripts

### Core Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `build_wasm.sh` | Build all CosmWasm contracts | `./scripts/build_wasm.sh` |
| `deploy_sei.sh` | Deploy contract to Sei network | `./scripts/deploy_sei.sh payments` |
| `gen_ts.sh` | Generate TypeScript SDK | `./scripts/gen_ts.sh` |
| `verify_sei.sh` | Verify deployed contract | `./scripts/verify_sei.sh sei1...` |

### Setup Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `setup_dev.sh` | Setup development environment | `./scripts/setup_dev.sh` |
| `setup_wallet.sh` | Setup Sei wallet | `./scripts/setup_wallet.sh` |
| `fund_wallet.sh` | Fund wallet from faucet | `./scripts/fund_wallet.sh` |
| `env.sh` | Load environment variables | `source scripts/env.sh` |

### Utility Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `seed_demo_data.sh` | Seed demo data for testing | `./scripts/seed_demo_data.sh` |

## 🎯 Makefile Commands

The project includes a comprehensive Makefile for easy access to common operations:

```bash
# Show all available commands
make help

# Setup development environment
make setup

# Build all contracts
make build

# Deploy specific contract
make deploy CONTRACT=payments

# Generate TypeScript SDK
make sdk

# Run all tests
make test

# Check project status
make status

# Clean build artifacts
make clean
```

## 🌐 Environment Variables

Set up your environment by sourcing the env script:

```bash
source scripts/env.sh
```

This sets:
- `CHAIN_ID=sei-testnet-1`
- `DENOM=usei`
- `RPC_URL=https://rpc.testnet.sei.io`
- `REST_URL=https://rest.testnet.sei.io`
- `WALLET=test`

## 🚀 Deployment Workflow

### 1. Setup Environment
```bash
make setup
make setup-wallet
make fund-wallet
```

### 2. Build Contracts
```bash
make build
```

### 3. Deploy Contracts
```bash
make deploy CONTRACT=payments
make deploy CONTRACT=groups
make deploy CONTRACT=pots
make deploy CONTRACT=alias
make deploy CONTRACT=risk_escrow
make deploy CONTRACT=vaults
```

### 4. Verify Deployment
```bash
make verify ADDR=<contract_address>
```

## 🔑 Prerequisites

Before running the scripts, ensure you have:

- **Rust** (latest stable)
- **Node.js** (v20+)
- **pnpm** package manager
- **Sei CLI** (`seid`)
- **jq** for JSON parsing
- **wasm-pack** for WASM compilation
- **cosmwasm-ts-codegen** for SDK generation

## 📦 Dependencies

The scripts automatically install required dependencies:

- `wasm32-unknown-unknown` Rust target
- `wasm-pack` for WASM compilation
- `cosmwasm-ts-codegen` for TypeScript generation
- `@cosmwasm/ts-codegen` npm package

## 🧪 Testing

Run the complete test suite:

```bash
make test
```

This includes:
- Rust contract tests
- Backend tests
- Frontend tests

## 🔒 Security

The scripts include security checks:
- Input validation
- Error handling
- Safe defaults
- Environment isolation

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied**: Make scripts executable
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Sei CLI Not Found**: Install Sei CLI
   ```bash
   curl -s https://get.sei.io/install.sh | bash
   ```

3. **WASM Build Failed**: Check Rust toolchain
   ```bash
   rustup target add wasm32-unknown-unknown
   cargo install wasm-pack
   ```

4. **Insufficient Balance**: Fund your wallet
   ```bash
   make fund-wallet
   ```

### Debug Mode

Enable verbose output:
```bash
bash -x scripts/build_wasm.sh
```

## 📚 Related Documentation

- [Project Overview](../PROJECT_OVERVIEW.md)
- [Quick Start](../QUICK_START.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Architecture](../docs/ARCHITECTURE.md)

## 🤝 Contributing

When adding new scripts:

1. Follow the existing naming convention
2. Include proper error handling
3. Add usage examples
4. Update this README
5. Test on multiple platforms

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
