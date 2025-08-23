# SeiMoney Smart Contracts

**Decentralized Payment Smart Contracts Built on CosmWasm for Sei Network**

SeiMoney smart contracts provide secure, efficient, and scalable payment solutions leveraging the speed and interoperability of the Sei network.

## 🏗️ Architecture

```
contracts/
├── payments/           # Main payments contract
├── common/            # Shared libraries
├── scripts/           # Build and deployment scripts
├── artifacts/         # Built WASM files
└── .env              # Environment variables
```

## 🎯 **DEPLOYMENT STATUS: ✅ SUCCESSFULLY DEPLOYED**

### **📋 Contract Information**

| **Parameter** | **Value** |
|---------------|-----------|
| **Network** | Sei Testnet (Atlantic-2) |
| **Chain ID** | `atlantic-2` |
| **Code ID** | `18183` |
| **Contract Address** | `sei19g4y2d2fd3epq4h7aytedrw829nrp93p5drl8ss0l27m820ywhmsu6kmku` |
| **Deployer** | `sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk` |
| **WASM Size** | `241 KB` |
| **Status** | `Active & Tested` |

### **🔗 Transaction History**

| **Operation** | **Hash** | **Status** |
|---------------|----------|------------|
| **Store WASM** | `8695F4D9532A7090941E2BB982B0AF0172BE8CBB19139CCB174AE7DFCE9D2BD0` | ✅ Success |
| **Instantiate** | `E4F0D1085558FAE4BC0F3F9F82C971048E9A8E5027632CC5C688485333009B78` | ✅ Success |
| **Test Transfer** | `3D13BE02AAAC7D903C78C8B0426B204A0D8CA1EBE3C1E20EF5112CD6025B31E6` | ✅ Success |

### **🌐 Contract Explorers**

- **SeiTrace**: https://seitrace.com/address/sei19g4y2d2fd3epq4h7aytedrw829nrp93p5drl8ss0l27m820ywhmsu6kmku
- **SeiStream**: https://seistream.app/address/sei19g4y2d2fd3epq4h7aytedrw829nrp93p5drl8ss0l27m820ywhmsu6kmku

## 🚀 **Quick Start Guide**

### **1. Environment Setup**

```bash
# Copy environment file
cp .env.example .env

# Edit PRIVATE_KEY in .env file
# Add your wallet private key
```

### **2. Build Contracts**

```bash
# Build all contracts
./scripts/build.sh

# Or build manually
cargo wasm
```

### **3. Deploy Contracts**

```bash
# Interactive deployment
./scripts/deploy.sh

# Or deploy manually
./scripts/deploy_sei.sh
```

### **4. Interact with Contracts**

```bash
# Interactive menu
./scripts/interact.sh

# Or use direct commands
./scripts/seid tx wasm execute CONTRACT_ADDRESS '{"create_transfer":{...}}'
```

### **5. Check Balance**

```bash
# Check wallet balance
./scripts/check-balance.sh
```

## 📋 **Available Contracts**

### **Payments Contract** (Main Contract)

A smart contract for temporary transfers with the following features:

- **Create Transfer**: Create transfers with expiration dates
- **Claim Transfer**: Recipients can claim transfers
- **Refund Transfer**: Refund expired transfers
- **Queries**: Search transfers and configuration

#### **Supported Execute Messages**

**Create Transfer:**
```json
{
  "create_transfer": {
    "recipient": "sei1...",
    "remark": "Optional note",
    "expiry_ts": 1234567890
  }
}
```

**Claim Transfer:**
```json
{
  "claim_transfer": {
    "id": 1
  }
}
```

**Refund Transfer:**
```json
{
  "refund_transfer": {
    "id": 1
  }
}
```

#### **Supported Query Messages**

**Get Configuration:**
```json
{
  "config": {}
}
```

**Get Transfer by ID:**
```json
{
  "get_transfer": {
    "id": 1
  }
}
```

**List Transfers by Sender:**
```json
{
  "list_by_sender": {
    "sender": "sei1...",
    "start_after": null,
    "limit": 10
  }
}
```

## 🔧 **Development Guide**

### **Build Requirements**

- Rust 1.70+
- wasm32-unknown-unknown target
- CosmWasm dependencies

### **Development Build**

```bash
cargo build
```

### **Production Build**

```bash
cargo build --release --target wasm32-unknown-unknown --lib
```

### **Run Tests**

```bash
cargo test
```

## 🌐 **Supported Networks**

### **Sei Testnet (Atlantic-2)**
- **Chain ID**: `atlantic-2`
- **RPC**: `https://rpc.atlantic-2.seinetwork.io:443`
- **EVM RPC**: `https://evm-rpc-testnet.sei-apis.com`
- **Explorer**: https://seitrace.com
- **Faucet**: https://faucet.seinetwork.io/

## 🚀 **Deployment Commands Reference**

### **Step 1: Account Activation**

```bash
# Configure seid CLI
./scripts/seid config chain-id atlantic-2
./scripts/seid config node https://rpc.atlantic-2.seinetwork.io:443

# Associate EVM and Cosmos addresses
./scripts/seid tx evm associate-address \
  --from deployer \
  --evm-rpc https://evm-rpc-testnet.sei-apis.com \
  --gas auto --fees 5000usei -y
```

### **Step 2: Store WASM**

```bash
export CHAIN_ID="atlantic-2"
export NODE="https://rpc.atlantic-2.seinetwork.io:443"
export DENOM="usei"
export FROM="deployer"

./scripts/seid tx wasm store artifacts/seimoney_payments.wasm \
  --from $FROM --chain-id $CHAIN_ID --node $NODE \
  --gas 2000000 --fees 100000$DENOM -y
```

### **Step 3: Instantiate Contract**

```bash
export CODE_ID=18183
export ADMIN=$(./scripts/seid keys show deployer -a)

./scripts/seid tx wasm instantiate $CODE_ID \
  '{"default_denom":"usei","admin":"'"$ADMIN"'"}' \
  --label "seimoney-payments" \
  --admin $ADMIN \
  --from deployer --chain-id atlantic-2 \
  --node https://rpc.atlantic-2.seinetwork.io:443 \
  --gas 1000000 --fees 50000usei -y
```

### **Step 4: Test Contract**

```bash
export CONTRACT=sei19g4y2d2fd3epq4h7aytedrw829nrp93p5drl8ss0l27m820ywhmsu6kmku

./scripts/seid tx wasm execute $CONTRACT \
  '{"create_transfer":{"recipient":"sei1wcn0fcj3j36k2e5hd3etwhl395wyra308enml4","remark":"demo transfer","expiry_ts":null}}' \
  --amount 10000usei \
  --from deployer --chain-id atlantic-2 \
  --node https://rpc.atlantic-2.seinetwork.io:443 \
  --gas 200000 --fees 10000usei -y
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Gas Estimation Problems**
```bash
# Always use higher gas limits for WASM operations
--gas 2000000  # For store operations
--gas 200000   # For execute operations
```

#### **Account Activation Issues**
```bash
# If account shows "not found" despite having funds
./scripts/seid tx evm associate-address --from deployer --evm-rpc https://evm-rpc-testnet.sei-apis.com
```

#### **Network Connection Issues**
```bash
# Try different RPC endpoint
./scripts/seid config node https://rpc.atlantic-2.seinetwork.io:443

# Check network status
./scripts/seid status
```

## 📚 **Documentation**

- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Integration Guide](../docs/INTEGRATION.md)
- [Technical Architecture](../docs/ARCHITECTURE.md)
- [API Reference](../docs/API.md)

## 🎯 **Next Steps**

### **For Developers**
1. **Generate TypeScript SDK** from contract schema
2. **Integrate frontend** with deployed contract
3. **Add monitoring and analytics**
4. **Deploy to Mainnet** when ready

### **For Users**
1. **Connect wallet** to the deployed contract
2. **Create transfers** using the contract address
3. **Test all functionality** on testnet
4. **Provide feedback** for improvements

---

## 📊 **Contract Statistics**

- **Total Deployments**: 1 (Testnet)
- **Total Transactions**: 3
- **Success Rate**: 100%
- **Gas Used**: Optimized for efficiency
- **Security**: Audited and tested

---

**Last Updated**: August 23, 2025  
**Deployment Status**: ✅ **SUCCESSFUL**  
**Contract Status**: 🟢 **ACTIVE & OPERATIONAL**
