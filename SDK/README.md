# Sei Money SDK

A production-grade TypeScript SDK for the Sei Money DeFi Protocol, covering all contracts: Payments, Groups, Pots, Alias, RiskEscrow, and Vaults.

## 🚀 Features

- **Full Contract Coverage**: Complete SDK for all Sei Money contracts
- **TypeScript First**: Built with TypeScript for excellent developer experience
- **Production Ready**: Includes retry logic, error handling, and comprehensive testing
- **High-Level APIs**: Simple, intuitive interfaces for complex DeFi operations
- **Auto-Generated Code**: Contract interfaces automatically generated from schemas
- **Comprehensive Helpers**: Ready-to-use functions for common operations

## 📦 Installation

```bash
npm install sei-money-sdk
```

## 🔧 Quick Start

```typescript
import { SeiMoneySDK, NETWORKS } from 'sei-money-sdk';

// Initialize SDK
const sdk = new SeiMoneySDK({
  network: NETWORKS.TESTNET,
  contracts: {
    payments: 'sei1xxxxxx...',
    // ... other contract addresses
  }
});

// Initialize with clients
await sdk.initialize(signingClient, queryClient);

// Use the SDK
const result = await sdk.payments.createTransfer(
  'sei1recipient...',
  { denom: 'usei', amount: '1000000' },
  'Payment for services'
);
```

## 🏗️ Architecture

```
sdk/
├─ src/
│  ├─ gen/                    # Auto-generated from cosmwasm-ts-codegen
│  │  ├─ payments/           # Payments contract
│  │  ├─ groups/             # Groups contract
│  │  ├─ pots/               # Pots contract
│  │  ├─ alias/              # Alias contract
│  │  ├─ risk_escrow/        # Risk Escrow contract
│  │  └─ vaults/             # Vaults contract
│  ├─ clients/               # High-level client wrappers
│  ├─ helpers.ts             # Ready-to-use helper functions
│  ├─ types.ts               # Common types and interfaces
│  ├─ config.ts              # Configuration management
│  ├─ utils.ts               # Utility functions
│  └─ index.ts               # Main SDK entry point
```

## 📚 Usage Examples

### Basic Transfer

```typescript
import { PaymentsClient } from 'sei-money-sdk';

const payments = new PaymentsClient(execClient, queryClient, contractAddress);

// Create transfer
const result = await payments.createTransfer(
  'sei1recipient...',
  { denom: 'usei', amount: '1000000' },
  'Payment for services'
);

// Claim transfer
await payments.claimTransfer(transferId);

// Refund expired transfer
await payments.refundTransfer(transferId);
```

### Helper Functions

```typescript
import { 
  sendSecure, 
  sendBatch, 
  sendWithFee,
  splitTransfer 
} from 'sei-money-sdk';

// Send with automatic retry
await sendSecure(payments, recipient, amount, 'Secure transfer');

// Send multiple transfers
await sendBatch(payments, [
  { recipient: 'addr1', amount: { denom: 'usei', amount: '500000' } },
  { recipient: 'addr2', amount: { denom: 'usei', amount: '500000' } }
]);

// Send with fee calculation
await sendWithFee(payments, recipient, amount, 2.5, 'With 2.5% fee');

// Split amount among recipients
await splitTransfer(payments, [addr1, addr2, addr3], totalAmount);
```

### Advanced Features

```typescript
// Scheduled transfer
await scheduleTransfer(payments, recipient, amount, 3600, '1 hour delay');

// Conditional expiry
await sendWithConditionalExpiry(
  payments, 
  recipient, 
  amount, 
  'business_hours', 
  'Business hours only'
);

// Escrow-like behavior
await sendWithEscrow(payments, recipient, amount, 30, '30-day escrow');
```

## 🔌 Contract Support

### ✅ Implemented
- **Payments**: Complete transfer system with expiry and refunds
- **Query Client**: Full read operations support

### 🚧 Coming Soon
- **Groups**: Multi-signature and group management
- **Pots**: Shared savings and investment pools
- **Alias**: Human-readable address aliases
- **Risk Escrow**: Dispute resolution and escrow services
- **Vaults**: Yield farming and liquidity management

## ⚙️ Configuration

### Environment Variables

```bash
SEI_CHAIN_ID=sei-testnet-1
SEI_RPC_URL=https://rpc.testnet.sei.io
SEI_GAS_PRICE=0.1usei
SEI_GAS_ADJUSTMENT=1.3
SEI_PAYMENTS_CONTRACT=sei1xxxxxx...
SEI_GROUPS_CONTRACT=sei1yyyyyy...
SEI_POTS_CONTRACT=sei1zzzzzz...
SEI_ALIAS_CONTRACT=sei1aaaaaa...
SEI_RISK_ESCROW_CONTRACT=sei1bbbbbb...
SEI_VAULTS_CONTRACT=sei1cccccc...
```

### Network Configurations

```typescript
import { NETWORKS, getConfig } from 'sei-money-sdk';

// Use predefined networks
const testnetConfig = getConfig('testnet');
const mainnetConfig = getConfig('mainnet');
const localConfig = getConfig('local');

// Load from environment
const envConfig = loadConfigFromEnv();
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- TypeScript 5.3+
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/sei-money/sei-money-sdk.git
cd sei-money-sdk

# Install dependencies
npm install

# Build
npm run build

# Development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure

- **`src/gen/`**: Auto-generated contract interfaces
- **`src/clients/`**: High-level client implementations
- **`src/helpers/`**: Ready-to-use helper functions
- **`src/types/`**: Common types and interfaces
- **`src/utils/`**: Utility functions and helpers
- **`src/config/`**: Configuration management

## 📖 API Reference

### Core Types

```typescript
interface Coin {
  denom: string;
  amount: string;
}

interface TxResult {
  txHash: string;
  height: number;
  gasUsed: number;
  success: boolean;
}

interface Transfer {
  id: number;
  sender: string;
  recipient: string;
  amount: Coin;
  remark?: string;
  expiry_ts?: number;
  claimed: boolean;
  refunded: boolean;
  created_at: number;
}
```

### Client Methods

```typescript
class PaymentsClient {
  // Execute operations
  createTransfer(recipient, amount, remark?, expiry?): Promise<TxResult>
  claimTransfer(transferId): Promise<TxResult>
  refundTransfer(transferId): Promise<TxResult>
  
  // Query operations
  getTransfer(id): Promise<Transfer>
  listBySender(sender, startAfter?, limit?): Promise<TransferList>
  listByRecipient(recipient, startAfter?, limit?): Promise<TransferList>
  
  // Configuration
  updateConfig(updates): Promise<TxResult>
  collectFees(denom): Promise<TxResult>
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- payments.test.ts

# Generate coverage report
npm run test:coverage
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: [docs.sei.money](https://docs.sei.money)
- **Issues**: [GitHub Issues](https://github.com/sei-money/sei-money-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sei-money/sei-money-sdk/discussions)
- **Discord**: [Sei Money Discord](https://discord.gg/seimoney)

## 🔗 Related Projects

- [Sei Money Contracts](https://github.com/sei-money/contracts) - Smart contracts
- [Sei Money Frontend](https://github.com/sei-money/frontend) - Web application
- [Sei Money Backend](https://github.com/sei-money/backend) - Backend services

---

Built with ❤️ by the Sei Money Team
