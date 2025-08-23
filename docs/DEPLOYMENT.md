# Detailed Deployment Guide - SeiMoney

This guide explains the steps to deploy SeiMoney contracts on Sei testnet (atlantic-2) in detail.

## Prerequisites

### 1. Install Required Tools
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Add wasm32 target
rustup target add wasm32-unknown-unknown

# Install cargo-generate
cargo install cargo-generate --features vendored-openssl

# Install seid CLI
curl -L https://github.com/sei-protocol/sei-chain/releases/download/v3.0.8/sei-linux-amd64.tar.gz | tar -xz
sudo mv seid /usr/local/bin/
```

### 2. Setup Development Environment
```bash
# Clone the repository
git clone <repository-url>
cd Sei-Money

# Setup development wallet
./contracts/scripts/setup-dev-wallet.sh
```

## Build Process

### 1. Build Contracts
```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
```

### 2. Optimize WASM
```bash
# Using docker for optimization
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.12.13
```

## Deployment Steps

### 1. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
nano .env
```

### 2. Get Testnet Tokens
1. Go to https://faucet.seinetwork.io/
2. Enter your wallet address
3. Request testnet tokens

### 3. Deploy Contract
```bash
# Deploy using the deployment script
./scripts/deploy-metamask.sh
```

### 4. Verify Deployment
```bash
# Check deployment status
./scripts/check-deployment-status.sh

# View contract on explorer
# https://seitrace.com/address/[CONTRACT_ADDRESS]
```

## Post-Deployment

### 1. Test Contract Functions
```bash
# Run interaction script
./scripts/interact-metamask.sh
```

### 2. Update Frontend Configuration
```bash
# Update contract address in frontend
# Edit app/config.js with new contract address
```

## Troubleshooting

### Common Issues

1. **Insufficient Gas**: Increase gas limit in deployment script
2. **Invalid Address**: Ensure wallet address is correct format
3. **Network Issues**: Check RPC endpoint connectivity

### Useful Commands
```bash
# Check wallet balance
seid query bank balances $(seid keys show dev-wallet -a)

# Query contract info
seid query wasm contract [CONTRACT_ADDRESS]

# View transaction
seid query tx [TX_HASH]
```

## Network Information

- **Network**: Sei Testnet (Atlantic-2)
- **Chain ID**: atlantic-2
- **RPC**: https://rpc.atlantic-2.seinetwork.io/
- **Explorer**: https://seitrace.com/
- **Faucet**: https://faucet.seinetwork.io/

## Security Notes

- Never use development wallets in production
- Keep mnemonic phrases secure
- Verify contract addresses before interaction
- Test thoroughly on testnet before mainnet deployment