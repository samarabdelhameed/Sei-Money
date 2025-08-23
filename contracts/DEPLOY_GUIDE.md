# 🚀 SeiMoney Contract Deployment Guide

## Current Issue
The private key from MetaMask doesn't work directly with `seid` CLI because:
- MetaMask provides private key in hex format
- seid requires mnemonic phrase or different keyring setup

## Available Solutions

### Solution 1: Create New Development Wallet (Easiest) ⭐
```bash
# Create new development wallet
seid keys add dev-wallet

# This will give you mnemonic phrase - save it!
# Example output:
# - name: dev-wallet
#   type: local
#   address: sei1...
#   pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"..."}'
#   mnemonic: "word1 word2 word3 ... word24"

# Get testnet tokens
# Go to https://faucet.seinetwork.io/
# and enter the new address
```

### Solution 2: Use Sei Wallet (For Users)
1. Go to https://wallet.sei.io/
2. Create new wallet or import mnemonic
3. Get testnet tokens from https://faucet.seinetwork.io/
4. Use the interface to deploy contract

### Solution 3: Convert Private Key Using Node.js
```javascript
// Create script to convert private key to mnemonic
const { Wallet } = require('ethers');
const bip39 = require('bip39');

// Convert private key to wallet then to mnemonic
function privateKeyToMnemonic(privateKey) {
    const wallet = new Wallet(privateKey);
    // This is an example - needs more development for Cosmos compatibility
    console.log('Address:', wallet.address);
}
```

### Solution 4: Use CosmJS (For Applications)
```javascript
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

// Use mnemonic phrase
const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
const client = await SigningCosmWasmClient.connectWithSigner(rpcUrl, wallet);

// Deploy contract
const result = await client.upload(address, wasmCode, fee);
```

## New Deployment Steps ✅

### 0. Install seid CLI (One time only)
```bash
# From root directory
./scripts/install-seid.sh
```

### 1. Setup Development Wallet (One time only)
```bash
# From root directory
./scripts/setup-dev-wallet.sh
```
This script will:
- Create new wallet named `dev-wallet`
- Give you mnemonic phrase (save it!)
- Give you wallet address
- Save address in `contracts/.env`

### 2. Get Testnet Tokens
```bash
# Go to https://faucet.seinetwork.io/
# and enter the address from previous step
```

### 3. Check Balance
```bash
seid query bank balances [YOUR_ADDRESS]
```

### 4. Build and Deploy Contract
```bash
cd contracts
./scripts/deploy.sh
```

### 5. Verify Deployment ✅
```bash
# Check contract information
cat artifacts/deployment.json
```

## Contract Information
- **Size**: ~247KB
- **Type**: CosmWasm Smart Contract
- **Network**: Sei Testnet (Atlantic-2)
- **Chain ID**: 1328

## Next Steps ✅
1. ✅ Solve private key/mnemonic issue (Done!)
2. 🚀 Deploy contract to network (Ready!)
3. 🧪 Test contract
4. 🔗 Integrate with application

## MetaMask Setup 🦊
To setup MetaMask with Sei network, see: [MetaMask Setup Guide](../docs/METAMASK_SETUP.md)

## Useful Commands

### Check Deployment Status
```bash
./scripts/check-deployment-status.sh
```

### Redeploy (If needed)
```bash
cd contracts
./scripts/deploy.sh
```

### Interact with Contract
```bash
cd contracts
./scripts/interact.sh
```

### Check Balance
```bash
seid query bank balances $(seid keys show dev-wallet -a)
```

## Important Tips
- Save mnemonic phrase in a secure place
- Don't use this wallet in production
- Use separate wallets for development and production
- Make sure you have sufficient balance before deployment