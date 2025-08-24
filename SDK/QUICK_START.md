# Quick Start Guide

Get up and running with the Sei Money SDK in minutes! 🚀

## ⚡ 5-Minute Setup

### 1. Install the SDK
```bash
npm install sei-money-sdk
```

### 2. Basic Usage
```typescript
import { SeiMoneySDK, NETWORKS } from 'sei-money-sdk';

// Initialize SDK
const sdk = new SeiMoneySDK({
  network: NETWORKS.TESTNET,
  contracts: {
    payments: 'sei1paymentscontract...',
  }
});

// Use the SDK
const result = await sdk.payments.createTransfer(
  'sei1recipient...',
  { denom: 'usei', amount: '1000000' },
  'Quick payment'
);
```

## 🎯 Common Use Cases

### Send Money
```typescript
import { sendSecure } from 'sei-money-sdk';

// Send with automatic retry
await sendSecure(payments, recipient, amount, 'Secure transfer');
```

### Batch Transfers
```typescript
import { sendBatch } from 'sei-money-sdk';

const transfers = [
  { recipient: 'addr1', amount: { denom: 'usei', amount: '500000' } },
  { recipient: 'addr2', amount: { denom: 'usei', amount: '500000' } }
];

await sendBatch(payments, transfers);
```

### Scheduled Payments
```typescript
import { scheduleTransfer } from 'sei-money-sdk';

// Send in 1 hour
await scheduleTransfer(payments, recipient, amount, 3600, 'Delayed payment');
```

## 🔧 Configuration

### Environment Variables
```bash
export SEI_CHAIN_ID=sei-testnet-1
export SEI_RPC_URL=https://rpc.testnet.sei.io
export SEI_PAYMENTS_CONTRACT=sei1paymentscontract...
```

### Network Presets
```typescript
import { NETWORKS, getConfig } from 'sei-money-sdk';

// Use predefined networks
const testnet = getConfig('testnet');
const mainnet = getConfig('mainnet');
const local = getConfig('local');
```

## 📚 Next Steps

1. **Read the [README](README.md)** - Complete documentation
2. **Check [Examples](src/example.ts)** - More usage examples
3. **Explore [Architecture](ARCHITECTURE.md)** - Understand the design
4. **Join the Community** - Get help and contribute

## 🆘 Need Help?

- **Documentation**: [README.md](README.md)
- **Examples**: [src/example.ts](src/example.ts)
- **Issues**: [GitHub Issues](https://github.com/sei-money/sei-money-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sei-money/sei-money-sdk/discussions)

---

**Ready to build amazing DeFi apps? Let's go! 🚀**
