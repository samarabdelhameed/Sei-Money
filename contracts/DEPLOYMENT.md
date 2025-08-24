# 🚀 SeiMoney Contracts Deployment Guide

**Complete guide to deploy all SeiMoney contracts to Sei Network**

## 📋 **Prerequisites**

### **Required Tools**

- **Rust** 1.70+ with wasm32 target
- **seid CLI** (Sei Network CLI tool)
- **jq** (JSON processor)
- **Deployer Key** with sufficient SEI tokens

### **Install seid CLI**

```bash
# Clone Sei repository
git clone https://github.com/sei-protocol/sei-chain.git /tmp/sei-chain
cd /tmp/sei-chain

# Build seid
export GO111MODULE=on
go build -o seid ./cmd/seid

# Copy to your PATH
sudo cp seid /usr/local/bin/
chmod +x /usr/local/bin/seid
```

### **Install jq**

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

## 🔧 **Build Contracts**

### **Build All Contracts**

```bash
cd contracts
RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown
```

### **Verify WASM Files**

```bash
ls -la target/wasm32-unknown-unknown/release/*.wasm
```

Expected output:

```
seimoney_alias.wasm          (200 KB)
seimoney_groups.wasm         (242 KB)
seimoney_payments.wasm       (215 KB)
seimoney_pots.wasm          (222 KB)
seimoney_risk_escrow.wasm   (275 KB)
seimoney_vaults.wasm        (252 KB)
```

## 🚀 **Deployment Options**

### **Option 1: Automated Deployment Script**

Use the provided deployment script for easy deployment:

```bash
# Full deployment
./deploy.sh

# Check prerequisites only
./deploy.sh --check

# Store WASM files only
./deploy.sh --store

# Instantiate contracts only
./deploy.sh --instantiate

# Verify deployment only
./deploy.sh --verify
```

### **Option 2: Manual Deployment**

Follow these steps manually:

#### **Step 1: Configure seid**

```bash
# Set chain ID and node
seid config chain-id atlantic-2
seid config node https://rpc.atlantic-2.seinetwork.io:443

# Verify configuration
seid config
```

#### **Step 2: Check Deployer Key**

```bash
# List available keys
seid keys list

# Get deployer address
seid keys show deployer -a
```

#### **Step 3: Store WASM Files**

```bash
# Store Payments contract
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_payments.wasm \
  --from deployer \
  --gas 2000000 \
  --fees 100000usei \
  -y

# Store Groups contract
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_groups.wasm \
  --from deployer \
  --gas 2000000 \
  --fees 100000usei \
  -y

# Store Pots contract
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_pots.wasm \
  --from deployer \
  --gas 2000000 \
  --fees 100000usei \
  -y

# Store Alias contract
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_alias.wasm \
  --from deployer \
  --gas 2000000 \
  --fees 100000usei \
  -y

# Store Risk Escrow contract
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_risk_escrow.wasm \
  --from deployer \
  --gas 2000000 \
  --fees 100000usei \
  -y

# Store Vaults contract
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_vaults.wasm \
  --from deployer \
  --gas 2000000 \
  --fees 100000usei \
  -y
```

#### **Step 4: Get Code IDs**

After each store operation, note the Code ID from the transaction output:

```bash
# Example output
# "code_id": "12345"
```

#### **Step 5: Instantiate Contracts**

```bash
# Set environment variables
export PAYMENTS_CODE_ID=<code_id_from_store>
export GROUPS_CODE_ID=<code_id_from_store>
export POTS_CODE_ID=<code_id_from_store>
export ALIAS_CODE_ID=<code_id_from_store>
export RISK_ESCROW_CODE_ID=<code_id_from_store>
export VAULTS_CODE_ID=<code_id_from_store>

export ADMIN=$(seid keys show deployer -a)

# Instantiate Payments
seid tx wasm instantiate $PAYMENTS_CODE_ID \
  '{"default_denom":"usei","admin":"'"$ADMIN"'"}' \
  --label "seimoney-payments" \
  --admin $ADMIN \
  --from deployer \
  --gas 1000000 \
  --fees 50000usei \
  -y

# Instantiate Groups
seid tx wasm instantiate $GROUPS_CODE_ID \
  '{"default_denom":"usei","admin":"'"$ADMIN"'"}' \
  --label "seimoney-groups" \
  --admin $ADMIN \
  --from deployer \
  --gas 1000000 \
  --fees 50000usei \
  -y

# Instantiate Pots
seid tx wasm instantiate $POTS_CODE_ID \
  '{"default_denom":"usei","admin":"'"$ADMIN"'"}' \
  --label "seimoney-pots" \
  --admin $ADMIN \
  --from deployer \
  --gas 1000000 \
  --fees 50000usei \
  -y

# Instantiate Alias
seid tx wasm instantiate $ALIAS_CODE_ID \
  '{"min_username_length":3,"max_username_length":20,"admin":"'"$ADMIN"'"}' \
  --label "seimoney-alias" \
  --admin $ADMIN \
  --from deployer \
  --gas 1000000 \
  --fees 50000usei \
  -y

# Instantiate Risk Escrow
seid tx wasm instantiate $RISK_ESCROW_CODE_ID \
  '{"default_denom":"usei","min_approval_threshold":2,"admin":"'"$ADMIN"'"}' \
  --label "seimoney-risk-escrow" \
  --admin $ADMIN \
  --from deployer \
  --gas 1000000 \
  --fees 50000usei \
  -y

# Instantiate Vaults
seid tx wasm instantiate $VAULTS_CODE_ID \
  '{"default_denom":"usei","max_fee_bps":1000,"admin":"'"$ADMIN"'"}' \
  --label "seimoney-vaults" \
  --admin $ADMIN \
  --from deployer \
  --gas 1000000 \
  --fees 50000usei \
  -y
```

## 🔍 **Verification**

### **Verify Contract Deployment**

```bash
# Query contract info for each contract
seid query wasm contract <CONTRACT_ADDRESS> --output json

# Example
seid query wasm contract sei1... --output json
```

### **Test Contract Functions**

After deployment, test basic functionality:

```bash
# Test Payments contract
seid tx wasm execute <PAYMENTS_CONTRACT_ADDRESS> \
  '{"create_transfer":{"recipient":"sei1...","amount":{"amount":"1000","denom":"usei"},"remark":"test","expiry_ts":null}}' \
  --amount 1000usei \
  --from deployer \
  --gas 200000 \
  --fees 10000usei \
  -y

# Test Groups contract
seid tx wasm execute <GROUPS_CONTRACT_ADDRESS> \
  '{"create_pool":{"target":{"amount":"5000","denom":"usei"},"memo":"test pool","expiry_ts":null}}' \
  --from deployer \
  --gas 200000 \
  --fees 10000usei \
  -y
```

## 📊 **Deployment Summary**

After successful deployment, you'll have:

| **Contract**    | **Code ID** | **Contract Address** |
| --------------- | ----------- | -------------------- |
| **Payments**    | `<ID>`      | `sei1...`            |
| **Groups**      | `<ID>`      | `sei1...`            |
| **Pots**        | `<ID>`      | `sei1...`            |
| **Alias**       | `<ID>`      | `sei1...`            |
| **Risk Escrow** | `<ID>`      | `sei1...`            |
| **Vaults**      | `<ID>`      | `sei1...`            |

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Insufficient Gas**

```bash
# Increase gas limit
--gas 3000000  # Instead of 2000000
```

#### **2. Insufficient Fees**

```bash
# Increase fees
--fees 200000usei  # Instead of 100000usei
```

#### **3. Network Connection Issues**

```bash
# Try different RPC endpoint
seid config node https://rpc.atlantic-2.seinetwork.io:443

# Check network status
seid status
```

#### **4. Key Not Found**

```bash
# List available keys
seid keys list

# Create new key if needed
seid keys add deployer
```

### **Error Messages**

- **"insufficient gas"**: Increase gas limit
- **"insufficient fees"**: Increase fee amount
- **"key not found"**: Check key name and existence
- **"connection refused"**: Check network configuration

## 📚 **Next Steps**

### **After Deployment**

1. **Update Frontend**: Integrate new contract addresses
2. **Test Functionality**: Verify all contract features work
3. **Generate SDK**: Create TypeScript SDK for developers
4. **Documentation**: Update documentation with new addresses

### **Mainnet Deployment**

When ready for mainnet:

1. **Update Configuration**: Change chain-id to mainnet
2. **Increase Gas/Fees**: Adjust for mainnet requirements
3. **Security Review**: Conduct final security audit
4. **Community Testing**: Open testing to community

## 🆘 **Support**

- **GitHub Issues**: Report deployment issues
- **Documentation**: See main README.md
- **Community**: Discord and community channels

---

**Happy Deploying! 🚀**

_Last updated: August 24, 2025_
