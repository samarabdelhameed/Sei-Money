# 🚀 SeiMoney DeFi Contracts - Deployed on Sei Testnet

**All contracts successfully deployed and verified on Sei Network testnet (atlantic-2)**

## 📋 **Deployment Summary**

| **Contract**       | **Code ID** | **Contract Address**                                           | **Status** |
| ------------------ | ----------- | -------------------------------------------------------------- | ---------- |
| **💰 Payments**    | 18204       | sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg | ✅ Active  |
| **👥 Groups**      | 18205       | sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt | ✅ Active  |
| **🏺 Pots**        | 18206       | sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj | ✅ Active  |
| **🏷️ Alias**       | 18207       | sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4 | ✅ Active  |
| **🛡️ Risk Escrow** | 18208       | sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj | ✅ Active  |
| **🏦 Vaults**      | 18209       | sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h | ✅ Active  |

## 🔗 **Network Information**

- **Network**: Sei Network Testnet
- **Chain ID**: atlantic-2
- **RPC Endpoint**: https://rpc.atlantic-2.seinetwork.io:443
- **EVM RPC**: https://evm-rpc-testnet.sei-apis.com
- **Block Explorer**: https://testnet.sei.io/
- **Base Denom**: usei (1 SEI = 1,000,000 usei)

## 📊 **Deployment Details**

### **💰 Payments Contract**

- **Code ID**: 18204
- **Address**: sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg
- **Admin**: sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk
- **Label**: seimoney-payments
- **Features**: Protected transfers with expiry & automatic refunds

### **👥 Groups Contract**

- **Code ID**: 18205
- **Address**: sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt
- **Admin**: sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk
- **Label**: seimoney-groups
- **Features**: Group pooling & contribution management

### **🏺 Pots Contract**

- **Code ID**: 18206
- **Address**: sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj
- **Admin**: sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk
- **Label**: seimoney-pots
- **Features**: Goal-based savings & milestone tracking

### **🏷️ Alias Contract**

- **Code ID**: 18207
- **Address**: sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4
- **Admin**: sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk
- **Label**: seimoney-alias
- **Features**: Username registry & address resolution

### **🛡️ Risk Escrow Contract**

- **Code ID**: 18208
- **Address**: sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj
- **Admin**: sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk
- **Label**: seimoney-risk-escrow
- **Features**: Multi-party escrow with dispute resolution

### **🏦 Vaults Contract**

- **Code ID**: 18209
- **Address**: sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h
- **Admin**: sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk
- **Label**: seimoney-vaults
- **Features**: AI-powered yield optimization vaults

## 🧪 **Testing the Contracts**

### **Query Contract Info**

```bash
# Example: Query Payments contract info
seid query wasm contract sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg

# Example: Query Groups contract info
seid query wasm contract sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt
```

### **Execute Contract Functions**

```bash
# Example: Create a transfer in Payments contract
seid tx wasm execute sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg \
  '{"create_transfer":{"recipient":"sei1...","amount":{"amount":"1000000","denom":"usei"},"expiry_ts":1234567890}}' \
  --from deployer --gas 1000000 --fees 50000usei

# Example: Create a group in Groups contract
seid tx wasm execute sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt \
  '{"create_group":{"name":"Test Group","description":"A test group","max_participants":10}}' \
  --from deployer --gas 1000000 --fees 50000usei
```

## 🔍 **Verification Commands**

### **Verify All Contracts**

```bash
# Check if all contracts are active
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

## 📱 **Frontend Integration**

### **Environment Variables**

```bash
# Add these to your frontend .env file
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

### **TypeScript Constants**

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

## 🎯 **Next Steps**

### **Immediate Actions**

1. **Test Contract Functions**: Execute basic functions on each contract
2. **Frontend Integration**: Update your frontend with these addresses
3. **Community Testing**: Open for community feedback and testing
4. **Documentation**: Create user guides and API documentation

### **Short-term Goals**

- **Mainnet Deployment**: After testnet validation
- **Advanced Testing**: Stress testing and security audits
- **Performance Optimization**: Monitor and optimize gas usage
- **User Experience**: Improve error handling and user feedback

### **Long-term Vision**

- **Ecosystem Expansion**: Additional DeFi protocols
- **Cross-chain Support**: Multi-chain deployment
- **Advanced Features**: Enhanced AI capabilities
- **Governance**: DAO governance system

## 🏆 **Deployment Success**

**All 6 SeiMoney DeFi contracts have been successfully deployed and verified on Sei Network testnet!**

- ✅ **Contracts Deployed**: 6/6
- ✅ **Verification**: All contracts verified and active
- ✅ **Admin Access**: Properly configured
- ✅ **Network**: Sei testnet (atlantic-2)
- ✅ **Status**: Ready for testing and integration

---

**Deployment Date**: August 24, 2025  
**Deployer**: sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk  
**Network**: Sei Network Testnet (atlantic-2)  
**Status**: 🚀 **ALL CONTRACTS ACTIVE & READY**

---

**🎉 Congratulations! SeiMoney DeFi platform is now live on Sei Network testnet!**
