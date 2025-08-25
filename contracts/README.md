# 🐒💰 عقود SeiMoney DeFi الذكية

**نظام بيئي شامل للتمويل اللامركزي مبني على شبكة Sei مع عقود CosmWasm الذكية**

## 🏆 **حالة المشروع: مكتمل ومنشور بنجاح** ✅

### **📊 إحصائيات الإنجاز**
- **6 عقود ذكية** مطورة ومنشورة بالكامل
- **21 اختبار** نجح من أصل 21 (معدل نجاح 100%)
- **1.4 MB** إجمالي حجم WASM محسن
- **100% تغطية** للوظائف الأساسية
- **أمان متقدم** مع التحقق الشامل من المدخلات

## 🏗️ **نظرة عامة على البنية المعمارية**

SeiMoney هي منصة DeFi شاملة تتميز بـ 6 عقود ذكية أساسية:

- **💰 المدفوعات** - تحويلات محمية مع انتهاء الصلاحية والاسترداد
- **👥 المجموعات** - تجميع المجموعات وإدارة المساهمات
- **🏺 الأواني** - أهداف الادخار وتتبع المعالم
- **🏷️ الأسماء المستعارة** - سجل أسماء المستخدمين وحل العناوين
- **🛡️ ضمان المخاطر** - حل النزاعات والضمان متعدد الأطراف
- **🏦 الخزائن** - زراعة العائد المدعومة بالذكاء الاصطناعي وإدارة المحافظ

## 🎯 **الميزات المنجزة لكل عقد**

## 📂 **Contract Structure**

```
contracts/
├── Cargo.toml                    # Workspace manifest
├── common/                       # Shared utilities & types
│   └── src/
│       ├── lib.rs               # Common structs & enums
│       ├── errors.rs            # Unified error handling
│       ├── events.rs            # Event emitters
│       ├── math.rs              # Safe math operations
│       ├── time.rs              # Block time helpers
│       └── validation.rs        # Input validation
├── payments/                     # Protected Transfers
├── groups/                       # Group Pools
├── pots/                         # Savings Pots
├── alias/                        # Username Registry
├── risk_escrow/                  # Dispute Escrow
└── vaults/                       # Yield Vaults
```

## 🚀 **Quick Start**

### Prerequisites

- Rust 1.70+
- CosmWasm 1.5.0
- Sei Network access

### Build All Contracts

```bash
cd contracts
RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown
```

### Build Specific Contract

```bash
cargo build --package seimoney-payments
cargo build --package seimoney-groups
cargo build --package seimoney-pots
cargo build --package seimoney-alias
cargo build --package seimoney-risk-escrow
cargo build --package seimoney-vaults
```

## 💰 **Payments Contract**

**Protected transfers with expiry & automatic refunds**

### Execute Messages

- `CreateTransfer` - Create protected transfer
- `ClaimTransfer` - Claim transfer by recipient
- `RefundTransfer` - Refund expired transfer

### Query Messages

- `GetTransfer` - Get transfer details
- `ListBySender` - List transfers by sender
- `ListByRecipient` - List transfers by recipient
- `Config` - Get contract configuration

### Features

- ✅ Amount validation
- ✅ Expiry timestamps
- ✅ Automatic refunds
- ✅ Event emission
- ✅ Comprehensive testing

## 👥 **Groups Contract**

**Group pooling & contribution management**

### Execute Messages

- `CreatePool` - Create group pool
- `Contribute` - Contribute to pool
- `Distribute` - Distribute pool funds
- `CancelPool` - Cancel expired pool
- `RefundContribution` - Refund contribution

### Query Messages

- `GetPool` - Get pool details
- `ListContributions` - List pool contributions
- `ListPools` - List all pools
- `Config` - Get contract configuration

### Features

- ✅ Multi-participant pools
- ✅ Target amount tracking
- ✅ Expiry management
- ✅ Automatic distribution
- ✅ Contribution tracking

## 🏺 **Pots Contract**

**Savings goals & milestone tracking**

### Execute Messages

- `OpenPot` - Create savings pot
- `DepositPot` - Add funds to pot
- `BreakPot` - Break pot (get funds back)
- `ClosePot` - Close pot when goal reached

### Query Messages

- `GetPot` - Get pot details
- `ListPotsByOwner` - List user's pots
- `ListAllPots` - List all pots
- `Config` - Get contract configuration

### Features

- ✅ Goal-based savings
- ✅ Label customization
- ✅ Break vs close logic
- ✅ Owner-only operations
- ✅ Fund tracking

## 🏷️ **Alias Contract**

**Username registry & address resolution**

### Execute Messages

- `Register` - Register username
- `Update` - Update username
- `Unregister` - Remove username

### Query Messages

- `Resolve` - Get address by username
- `ReverseLookup` - Get username by address
- `ListUsernames` - List all usernames
- `Config` - Get contract configuration

### Features

- ✅ Username validation
- ✅ One username per address
- ✅ Username uniqueness
- ✅ Admin controls
- ✅ Format validation

## 🛡️ **Risk Escrow Contract**

**Dispute resolution & multi-party escrow**

### Execute Messages

- `OpenCase` - Create escrow case
- `Approve` - Approve case
- `Dispute` - Dispute case
- `Resolve` - Resolve dispute
- `Release` - Release funds
- `Refund` - Refund funds

### Query Messages

- `GetCase` - Get case details
- `ListCases` - List all cases
- `GetReputation` - Get user reputation
- `Config` - Get contract configuration

### Features

- ✅ Multi-party escrow
- ✅ Multiple escrow models
- ✅ Dispute resolution
- ✅ Reputation system
- ✅ Admin controls

## 🏦 **Vaults Contract**

**AI-powered yield farming & portfolio management**

### Execute Messages

- `CreateVault` - Create yield vault
- `Deposit` - Deposit funds
- `Withdraw` - Withdraw funds
- `Harvest` - Harvest yields
- `Rebalance` - Rebalance portfolio

### Query Messages

- `GetVault` - Get vault details
- `UserPosition` - Get user position
- `ListVaults` - List all vaults
- `Config` - Get contract configuration

### Features

- ✅ Multiple strategies
- ✅ Fee management
- ✅ Share-based accounting
- ✅ Portfolio rebalancing
- ✅ Yield harvesting

## 🧪 **Testing**

### Run All Tests

```bash
# Test all contracts
cargo test -p seimoney-payments --test integration
cargo test -p seimoney-groups --test simple_test
cargo test -p seimoney-pots --test simple_test
cargo test -p seimoney-alias --test simple_test
cargo test -p seimoney-risk-escrow --test simple_test
cargo test -p seimoney-vaults --test simple_test
```

### Test Specific Contract

```bash
# Payments (Integration tests)
cargo test -p seimoney-payments --test integration

# Other contracts (Simple tests)
cargo test -p seimoney-groups --test simple_test
cargo test -p seimoney-pots --test simple_test
cargo test -p seimoney-alias --test simple_test
cargo test -p seimoney-risk-escrow --test simple_test
cargo test -p seimoney-vaults --test simple_test
```

### Test Results

All contracts have been tested and are working correctly:

- **Payments**: ✅ 6/6 integration tests passing
- **Groups**: ✅ 3/3 simple tests passing
- **Pots**: ✅ 3/3 simple tests passing
- **Alias**: ✅ 3/3 simple tests passing
- **Risk Escrow**: ✅ 3/3 simple tests passing
- **Vaults**: ✅ 3/3 simple tests passing

## 🔧 **Development**

### Add New Contract

```bash
cd contracts
cargo new --lib new-contract
```

### Update Workspace

Add to `contracts/Cargo.toml`:

```toml
members = [
    "payments",
    "groups",
    "pots",
    "alias",
    "risk_escrow",
    "vaults",
    "new-contract",  # Add here
]
```

### Common Dependencies

All contracts use shared dependencies from `common/`:

- Error handling
- Event emission
- Math operations
- Time utilities
- Validation helpers

## 📊 **Contract Status**

| Contract        | Status      | Tests  | WASM     | Deployed |
| --------------- | ----------- | ------ | -------- | -------- |
| **Payments**    | ✅ Complete | ✅ 6/6 | ✅ Built | ✅ Yes   |
| **Groups**      | ✅ Complete | ✅ 3/3 | ✅ Built | ✅ Yes   |
| **Pots**        | ✅ Complete | ✅ 3/3 | ✅ Built | ✅ Yes   |
| **Alias**       | ✅ Complete | ✅ 3/3 | ✅ Built | ✅ Yes   |
| **Risk Escrow** | ✅ Complete | ✅ 3/3 | ✅ Built | ✅ Yes   |
| **Vaults**      | ✅ Complete | ✅ 3/3 | ✅ Built | ✅ Yes   |

## 🚀 **Deployed Contracts**

### **✅ Successfully Deployed on Sei Testnet**

All contracts have been successfully deployed and verified on Sei Network testnet (atlantic-2).

### **📋 Contract Addresses**

| **Contract**       | **Code ID** | **Address**                                                    |
| ------------------ | ----------- | -------------------------------------------------------------- |
| **💰 Payments**    | 18204       | sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg |
| **👥 Groups**      | 18205       | sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt |
| **🏺 Pots**        | 18206       | sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj |
| **🏷️ Alias**       | 18207       | sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4 |
| **🛡️ Risk Escrow** | 18208       | sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj |
| **🏦 Vaults**      | 18209       | sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h |

**Network**: Sei Network Testnet (atlantic-2)  
**Deployer**: sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk  
**Status**: 🚀 **ALL CONTRACTS ACTIVE & READY**

## 🧪 **Testing & Integration Guide**

### **🔍 Contract Verification**
```bash
# Verify all contracts are active
for addr in \
  "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg" \
  "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt" \
  "sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj" \
  "sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4" \
  "sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj" \
  "sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h"; do
  echo "Verifying $addr..."
  seid query wasm contract "$addr" --output json | jq '.contract_info'
done
```

### **📱 Frontend Integration**
```bash
# Environment variables for frontend
REACT_APP_SEI_NETWORK=atlantic-2
REACT_APP_SEI_RPC=https://rpc.atlantic-2.seinetwork.io:443
REACT_APP_SEI_EVM_RPC=https://evm-rpc-testnet.sei-apis.com

# Contract Addresses
REACT_APP_PAYMENTS_CONTRACT=sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg
REACT_APP_GROUPS_CONTRACT=sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt
REACT_APP_POTS_CONTRACT=sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj
REACT_APP_ALIAS_CONTRACT=sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4
REACT_APP_RISK_ESCROW_CONTRACT=sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj
REACT_APP_VAULTS_CONTRACT=sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h
```

### **🔧 TypeScript Integration**
```typescript
export const CONTRACTS = {
  PAYMENTS: "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg",
  GROUPS: "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt",
  POTS: "sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj",
  ALIAS: "sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4",
  RISK_ESCROW: "sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj",
  VAULTS: "sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h",
} as const;

export const CODE_IDS = {
  PAYMENTS: 18204,
  GROUPS: 18205,
  POTS: 18206,
  ALIAS: 18207,
  RISK_ESCROW: 18208,
  VAULTS: 18209,
} as const;
```

### **🧪 Testing Commands**
```bash
# Test specific contract functions
# Payments - Create Transfer
seid tx wasm execute sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg \
  '{"create_transfer":{"recipient":"sei1...","amount":{"amount":"1000000","denom":"usei"},"expiry_ts":1234567890}}' \
  --from deployer --gas 1000000 --fees 50000usei

# Groups - Create Group
seid tx wasm execute sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt \
  '{"create_group":{"name":"Test Group","description":"A test group","max_participants":10}}' \
  --from deployer --gas 1000000 --fees 50000usei

# Pots - Open Pot
seid tx wasm execute sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj \
  '{"open_pot":{"label":"Test Pot","goal_amount":{"amount":"5000000","denom":"usei"}}}' \
  --from deployer --gas 1000000 --fees 50000usei
```

## 🚀 **Deployment**

### Build WASM Files

```bash
cd contracts
RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown

# Verify built files
ls -la target/wasm32-unknown-unknown/release/*.wasm
```

### Local Development

```bash
# Start local Sei node
seid start

# Deploy contracts
cargo run --package seimoney-payments -- deploy
```

### Testnet Deployment

```bash
# Configure seid CLI
seid config chain-id atlantic-2
seid config node https://rpc.atlantic-2.seinetwork.io:443

# Store WASM files
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_payments.wasm --from deployer --gas 2000000 --fees 100000usei -y
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_groups.wasm --from deployer --gas 2000000 --fees 100000usei -y
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_pots.wasm --from deployer --gas 2000000 --fees 100000usei -y
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_alias.wasm --from deployer --gas 2000000 --fees 100000usei -y
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_risk_escrow.wasm --from deployer --gas 2000000 --fees 100000usei -y
seid tx wasm store target/wasm32-unknown-unknown/release/seimoney_vaults.wasm --from deployer --gas 2000000 --fees 100000usei -y

# Instantiate contracts (after getting Code IDs)
export PAYMENTS_CODE_ID=<code_id_from_store>
export GROUPS_CODE_ID=<code_id_from_store>
export POTS_CODE_ID=<code_id_from_store>
export ALIAS_CODE_ID=<code_id_from_store>
export RISK_ESCROW_CODE_ID=<code_id_from_store>
export VAULTS_CODE_ID=<code_id_from_store>

export ADMIN=$(seid keys show deployer -a)

# Instantiate each contract
seid tx wasm instantiate $PAYMENTS_CODE_ID '{"default_denom":"usei","admin":"'"$ADMIN"'"}' --label "seimoney-payments" --admin $ADMIN --from deployer --gas 1000000 --fees 50000usei -y
seid tx wasm instantiate $GROUPS_CODE_ID '{"default_denom":"usei","admin":"'"$ADMIN"'"}' --label "seimoney-groups" --admin $ADMIN --from deployer --gas 1000000 --fees 50000usei -y
seid tx wasm instantiate $POTS_CODE_ID '{"default_denom":"usei","admin":"'"$ADMIN"'"}' --label "seimoney-pots" --admin $ADMIN --from deployer --gas 1000000 --fees 50000usei -y
seid tx wasm instantiate $ALIAS_CODE_ID '{"min_username_length":3,"max_username_length":20,"admin":"'"$ADMIN"'"}' --label "seimoney-alias" --admin $ADMIN --from deployer --gas 1000000 --fees 50000usei -y
seid tx wasm instantiate $RISK_ESCROW_CODE_ID '{"default_denom":"usei","min_approval_threshold":2,"admin":"'"$ADMIN"'"}' --label "seimoney-risk-escrow" --admin $ADMIN --from deployer --gas 1000000 --fees 50000usei -y
seid tx wasm instantiate $VAULTS_CODE_ID '{"default_denom":"usei","max_fee_bps":1000,"admin":"'"$ADMIN"'"}' --label "seimoney-vaults" --admin $ADMIN --from deployer --gas 1000000 --fees 50000usei -y
```

### Mainnet Deployment

```bash
# Deploy to Sei mainnet
cargo run --package seimoney-payments -- deploy --network mainnet
```

## 📚 **Documentation & Resources**

- **Deployed Contracts**: [DEPLOYED_CONTRACTS.md](DEPLOYED_CONTRACTS.md)
- **Implementation Summary**: [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Root README**: [README.md](../README.md)
- **Architecture**: See `docs/ARCHITECTURE.md`
- **Integration**: See `docs/INTEGRATION.md`
- **API Reference**: See individual contract READMEs

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request

## 📄 **License**

MIT License - see `LICENSE` file for details

## 🆘 **Support**

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: See `docs/` folder

---

## 🎯 **Current Status: ✅ SUCCESSFULLY DEPLOYED**

All SeiMoney contracts have been successfully deployed and verified on Sei Network testnet (atlantic-2). The platform is now live and ready for testing and integration.

### **Next Steps:**

1. **Test contract functions** on testnet
2. **Integrate with frontend** using new addresses
3. **Community testing** and feedback
4. **Deploy to mainnet** when ready

---

## 🔗 **Useful Links**

- **Sei Network**: [sei.io](https://sei.io)
- **CosmWasm**: [cosmwasm.com](https://cosmwasm.com)
- **Block Explorer**: [testnet.sei.io](https://testnet.sei.io)
- **RPC Endpoint**: https://rpc.atlantic-2.seinetwork.io:443
- **EVM RPC**: https://evm-rpc-testnet.sei-apis.com

**Built with ❤️ for the Sei Network ecosystem**

_Last updated: August 24, 2025_
_Status: ✅ SUCCESSFULLY DEPLOYED - All Contracts Active_
