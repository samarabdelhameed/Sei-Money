# SeiMoney E2E Testing Framework

A comprehensive end-to-end testing framework for the SeiMoney DeFi platform that validates integration between frontend, backend, SDK, and smart contracts.

## Features

- **Comprehensive Testing**: Tests all major platform features (payments, groups, pots, vaults)
- **Cross-Component Validation**: Ensures data consistency between frontend, backend, and blockchain
- **Flexible Configuration**: Environment-based configuration with validation
- **Robust Error Handling**: Automatic retry mechanisms and detailed error reporting
- **Real-time Monitoring**: Live test execution status and progress tracking
- **Detailed Reporting**: Comprehensive test reports with screenshots and logs

## Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## Configuration

The framework uses environment variables for configuration. Copy `.env.example` to `.env` and update the values:

```bash
# Frontend Configuration
FRONTEND_URL=http://localhost:3000
FRONTEND_TIMEOUT=30000

# Backend Configuration
BACKEND_URL=http://localhost:8000
BACKEND_TIMEOUT=10000

# Blockchain Configuration
BLOCKCHAIN_NETWORK=sei-testnet
BLOCKCHAIN_RPC_URL=https://rpc.sei-apis.com
CONTRACT_ADDRESS=your_contract_address

# Test Wallet Configuration
TEST_WALLET_ADDRESS=your_test_wallet_address
TEST_WALLET_PRIVATE_KEY=your_test_private_key
TEST_WALLET_MNEMONIC=your test mnemonic phrase

# Testing Configuration
HEADLESS_BROWSER=true
SCREENSHOT_ON_FAILURE=true
RETRY_ATTEMPTS=3
DEFAULT_TIMEOUT=15000

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=./logs/e2e-tests.log
```

## Usage

### Basic Usage

```typescript
import { TestRunner, getConfig, initializeLogger } from './src';

// Initialize logger
const logger = initializeLogger('info');

// Load configuration
const config = getConfig();

// Create and initialize test runner
const testRunner = new TestRunner(config);
await testRunner.initialize();

// Register and execute scenarios
testRunner.registerScenario(myScenario);
const result = await testRunner.executeScenario('my-scenario-id');

// Cleanup
await testRunner.shutdown();
```

### Running Tests

```bash
# Build the project
npm run build

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run the basic example
npm run dev
```

### Running Example

```bash
# Run the basic usage example
npm run dev

# Or run directly with ts-node
npx ts-node src/examples/basic-usage.ts
```

## Project Structure

```
e2e-testing/
├── src/
│   ├── core/
│   │   └── TestRunner.ts          # Main test runner class
│   ├── config/
│   │   └── index.ts               # Configuration management
│   ├── utils/
│   │   ├── logger.ts              # Logging utilities
│   │   └── environment.ts         # Environment management
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── examples/
│   │   └── basic-usage.ts         # Basic usage example
│   ├── __tests__/
│   │   ├── setup.ts               # Test setup
│   │   ├── config.test.ts         # Configuration tests
│   │   └── TestRunner.test.ts     # TestRunner tests
│   └── index.ts                   # Main entry point
├── logs/                          # Log files
├── screenshots/                   # Test screenshots
├── reports/                       # Test reports
├── test-data/                     # Test data files
├── temp/                          # Temporary files
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
└── README.md
```

## Core Components

### TestRunner

The main orchestrator that manages test execution:

- **Scenario Management**: Register and execute test scenarios
- **Step Execution**: Execute individual test steps with proper error handling
- **Status Tracking**: Real-time execution status and progress monitoring
- **Environment Management**: Initialize and cleanup test environment

### Configuration System

Environment-based configuration with validation:

- **Environment Variables**: Load configuration from environment
- **Validation**: Joi-based configuration validation
- **Overrides**: Support for test-specific configuration overrides

### Logging System

Winston-based logging with multiple outputs:

- **Console Logging**: Colorized console output
- **File Logging**: Structured JSON logs to files
- **Log Levels**: Configurable log levels (error, warn, info, debug)

### Environment Management

Health checking and environment setup:

- **Health Checks**: Validate frontend, backend, and blockchain connectivity
- **Environment Setup**: Initialize test directories and data
- **Cleanup**: Proper cleanup of test artifacts

## Test Scenarios

Test scenarios are composed of steps that can be:

- **Setup Steps**: Initialize test data and environment
- **UI Interaction Steps**: Simulate user interactions (implemented in later tasks)
- **API Call Steps**: Direct backend API testing (implemented in later tasks)
- **Validation Steps**: Verify data consistency and correctness
- **Wait Steps**: Add delays for timing-sensitive operations
- **Cleanup Steps**: Clean up test data and reset environment

## Error Handling

The framework provides comprehensive error handling:

- **Error Classification**: Categorize errors by type (timeout, network, validation, etc.)
- **Retry Logic**: Automatic retry for transient failures
- **Error Recovery**: Environment reset and recovery strategies
- **Detailed Logging**: Capture error context, stack traces, and screenshots

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- config.test.ts
```

### Linting and Formatting

```bash
# The project uses TypeScript strict mode for type checking
npm run build
```

## Requirements Mapping

This implementation addresses the following requirements:

- **Requirement 1.1**: Payment transfer testing infrastructure
- **Requirement 6.1**: Comprehensive error handling and debugging
- **Requirement 6.4**: System restart procedures and environment management

## Next Steps

This core infrastructure provides the foundation for implementing:

1. UI automation with Playwright/Puppeteer (Task 2)
2. API testing infrastructure (Task 3)
3. Data validation system (Task 4)
4. Specific scenario implementations (Tasks 5-8)
5. Dashboard integration testing (Task 9)
6. Advanced features and reporting (Tasks 10+)

## Contributing

1. Follow TypeScript strict mode guidelines
2. Add tests for new functionality
3. Update documentation for new features
4. Use the existing logging and error handling patterns

## License

MIT License - see LICENSE file for details.