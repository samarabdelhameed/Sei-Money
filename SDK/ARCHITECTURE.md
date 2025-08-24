# Sei Money SDK Architecture

This document describes the architecture and design decisions behind the Sei Money SDK.

## 🏗️ Overall Architecture

The SDK follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    SDK Users (Frontend/Backend)            │
├─────────────────────────────────────────────────────────────┤
│                    Main SDK Entry Point                    │
│                    (src/index.ts)                         │
├─────────────────────────────────────────────────────────────┤
│                    High-Level Clients                      │
│                    (src/clients/)                         │
├─────────────────────────────────────────────────────────────┤
│                    Helper Functions                        │
│                    (src/helpers.ts)                       │
├─────────────────────────────────────────────────────────────┤
│                    Auto-Generated Code                     │
│                    (src/gen/)                             │
├─────────────────────────────────────────────────────────────┤
│                    Core Utilities                          │
│                    (src/utils.ts)                         │
├─────────────────────────────────────────────────────────────┤
│                    Configuration                           │
│                    (src/config.ts)                        │
├─────────────────────────────────────────────────────────────┤
│                    Type Definitions                        │
│                    (src/types.ts)                         │
├─────────────────────────────────────────────────────────────┤
│                    CosmWasm/Cosmos SDK                     │
│                    (@cosmjs/* packages)                   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Directory Structure

### `src/` - Source Code

#### `gen/` - Auto-Generated Code
Contains TypeScript interfaces and query clients automatically generated from CosmWasm contract schemas.

```
gen/
├── payments/          # Payments contract
│   ├── messages.ts    # ExecuteMsg, QueryMsg interfaces
│   ├── queries.ts     # QueryClient implementation
│   └── index.ts       # Re-exports
├── groups/            # Groups contract (placeholder)
├── pots/              # Pots contract (placeholder)
├── alias/             # Alias contract (placeholder)
├── risk_escrow/       # Risk Escrow contract (placeholder)
├── vaults/            # Vaults contract (placeholder)
└── index.ts           # Main re-exports
```

**Purpose**: Provides type-safe interfaces for all contract operations without manual maintenance.

#### `clients/` - High-Level Client Wrappers
OOP-style wrappers around the auto-generated code, providing a more intuitive API.

```
clients/
├── payments.ts        # PaymentsClient - high-level payments operations
├── groups.ts          # GroupsClient (future)
├── pots.ts            # PotsClient (future)
├── alias.ts           # AliasClient (future)
├── riskEscrow.ts      # RiskEscrowClient (future)
└── vaults.ts          # VaultsClient (future)
```

**Purpose**: Simplifies contract interactions and provides business logic abstractions.

#### `helpers.ts` - Ready-to-Use Functions
High-level utility functions that combine multiple operations for common use cases.

**Examples**:
- `sendSecure()` - Send with automatic retry
- `sendBatch()` - Send multiple transfers
- `sendWithFee()` - Calculate and apply fees
- `splitTransfer()` - Split amount among recipients

**Purpose**: Reduces boilerplate code for developers using the SDK.

#### `types.ts` - Common Type Definitions
Shared TypeScript interfaces and types used throughout the SDK.

**Key Types**:
- `Coin`, `Address`, `Denom` - Basic blockchain types
- `TxResult`, `Transfer` - Transaction and transfer types
- `NetworkConfig`, `ContractAddresses` - Configuration types
- `SeiMoneyError` - Custom error class

**Purpose**: Ensures type consistency across the entire SDK.

#### `utils.ts` - Utility Functions
Low-level utility functions for common operations.

**Categories**:
- **Coin Operations**: `addCoins()`, `subtractCoins()`, `multiplyCoin()`
- **Validation**: `isValidAddress()`, `isValidDenom()`
- **Async Utilities**: `retry()`, `sleep()`, `debounce()`
- **Data Utilities**: `deepClone()`, `safeJsonParse()`

**Purpose**: Provides reusable utilities for internal and external use.

#### `config.ts` - Configuration Management
Handles SDK configuration including networks, contract addresses, and environment variables.

**Features**:
- Predefined network configurations (testnet, mainnet, local)
- Environment variable support
- Contract address management
- Default configuration presets

**Purpose**: Centralizes configuration and makes it easy to switch between environments.

#### `index.ts` - Main Entry Point
Main SDK class and re-exports of all public APIs.

**Features**:
- `SeiMoneySDK` class for easy initialization
- Re-exports of all public types and functions
- Main SDK interface

**Purpose**: Provides a single entry point for all SDK functionality.

## 🔄 Data Flow

### 1. SDK Initialization
```
User → SeiMoneySDK.initialize() → Create Clients → Ready for Use
```

### 2. Contract Interaction
```
User → Client Method → Helper Function → Auto-Generated Code → CosmWasm → Blockchain
```

### 3. Query Operations
```
User → QueryClient → CosmWasm Client → Blockchain → Response → Typed Result
```

## 🎯 Design Principles

### 1. **Type Safety First**
- All public APIs are fully typed
- Auto-generated code ensures contract interface accuracy
- Custom error types for better error handling

### 2. **Layered Abstraction**
- Low-level: Auto-generated contract interfaces
- Mid-level: High-level client wrappers
- High-level: Helper functions and utilities

### 3. **Production Ready**
- Comprehensive error handling
- Retry logic with exponential backoff
- Gas estimation and optimization
- Comprehensive testing suite

### 4. **Developer Experience**
- Intuitive API design
- Comprehensive documentation
- Example usage files
- Clear error messages

### 5. **Extensibility**
- Easy to add new contracts
- Modular architecture
- Plugin-friendly design

## 🔌 Contract Integration

### Current Implementation
- **Payments Contract**: Fully implemented with all operations
- **Query Client**: Complete read operations support
- **Execute Client**: All write operations with proper error handling

### Future Contracts
The architecture is designed to easily accommodate additional contracts:

1. **Groups**: Multi-signature and group management
2. **Pots**: Shared savings and investment pools
3. **Alias**: Human-readable address aliases
4. **Risk Escrow**: Dispute resolution and escrow services
5. **Vaults**: Yield farming and liquidity management

### Adding New Contracts
To add a new contract:

1. Add contract schema to `gen/[contract_name]/`
2. Create client wrapper in `clients/[contract_name].ts`
3. Add contract address to configuration
4. Update main SDK class
5. Add tests and documentation

## 🧪 Testing Strategy

### Test Structure
```
__tests__/
├── setup.ts           # Test configuration and mocks
├── types.test.ts      # Type definitions tests
├── utils.test.ts      # Utility functions tests
├── helpers.test.ts    # Helper functions tests
└── clients/           # Client tests (future)
```

### Testing Approach
- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test client interactions
- **Mock Testing**: Use mocks for external dependencies
- **Error Testing**: Ensure proper error handling

## 📦 Build and Distribution

### Build Process
1. **TypeScript Compilation**: `tsc` compiles TypeScript to JavaScript
2. **Type Definitions**: Generate `.d.ts` files for TypeScript support
3. **Source Maps**: Include source maps for debugging
4. **Tree Shaking**: Optimize bundle size

### Output Structure
```
dist/
├── index.js           # Main entry point
├── index.d.ts         # Type definitions
├── clients/           # Compiled client code
├── gen/               # Compiled generated code
├── helpers.js         # Compiled helper functions
├── utils.js           # Compiled utility functions
├── types.js           # Compiled type definitions
└── config.js          # Compiled configuration
```

## 🚀 Performance Considerations

### 1. **Lazy Loading**
- Clients are created only when needed
- Heavy operations are deferred until required

### 2. **Caching**
- Query results can be cached (future enhancement)
- Contract addresses are cached in memory

### 3. **Batch Operations**
- Helper functions support batch operations
- Reduce network round trips

### 4. **Gas Optimization**
- Automatic gas estimation
- Configurable gas adjustment
- Retry logic for failed transactions

## 🔒 Security Features

### 1. **Input Validation**
- Address format validation
- Amount validation
- Parameter sanitization

### 2. **Error Handling**
- Custom error types with codes
- Detailed error messages
- Safe error recovery

### 3. **Transaction Safety**
- Retry logic with backoff
- Gas estimation with safety margins
- Transaction confirmation

## 🔮 Future Enhancements

### 1. **Plugin System**
- Allow third-party extensions
- Modular contract support
- Custom helper functions

### 2. **Advanced Caching**
- Redis integration
- Query result caching
- Smart cache invalidation

### 3. **Monitoring and Metrics**
- Performance metrics
- Error tracking
- Usage analytics

### 4. **Multi-Chain Support**
- Support for other Cosmos chains
- Chain-specific optimizations
- Cross-chain operations

## 📚 Development Guidelines

### 1. **Code Style**
- Follow TypeScript best practices
- Use ESLint and Prettier
- Consistent naming conventions

### 2. **Documentation**
- JSDoc comments for all public APIs
- README with usage examples
- Architecture documentation

### 3. **Testing**
- Maintain high test coverage
- Test error conditions
- Mock external dependencies

### 4. **Performance**
- Profile critical paths
- Optimize for common use cases
- Monitor bundle size

---

This architecture provides a solid foundation for a production-grade DeFi SDK that is both powerful and easy to use.
