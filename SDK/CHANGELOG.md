# Changelog

All notable changes to the Sei Money SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial SDK release
- Complete Payments contract support
- High-level client wrappers
- Comprehensive helper functions
- Utility functions for common operations
- TypeScript type definitions
- Configuration management
- Error handling with custom error types
- Retry logic with exponential backoff
- Comprehensive testing suite
- ESLint and Prettier configuration
- Example usage files
- Documentation and README

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [1.0.0] - 2024-01-XX

### Added
- **Core SDK**: Main SDK class with configuration management
- **Payments Contract**: Complete implementation including:
  - Create transfers with expiry
  - Claim transfers
  - Refund expired transfers
  - Update configuration
  - Collect fees
  - Query operations
- **Type System**: Comprehensive TypeScript types for all contracts
- **Utility Functions**: 
  - Coin arithmetic (add, subtract, multiply, divide)
  - Address validation
  - Retry mechanisms
  - Gas estimation
  - JSON utilities
- **Helper Functions**:
  - Secure transfers with retry
  - Batch operations
  - Scheduled transfers
  - Fee calculations
  - Split transfers
  - Conditional expiry
  - Escrow-like behavior
- **Configuration**: 
  - Network presets (testnet, mainnet, local)
  - Environment variable support
  - Contract address management
- **Testing**: 
  - Jest configuration
  - Unit tests for all modules
  - Mock implementations
- **Development Tools**:
  - ESLint configuration
  - Prettier formatting
  - TypeScript configuration
  - Build scripts

### Architecture
- **`src/gen/`**: Auto-generated contract interfaces
- **`src/clients/`**: High-level client implementations
- **`src/helpers/`**: Ready-to-use helper functions
- **`src/types/`**: Common types and interfaces
- **`src/utils/`**: Utility functions and helpers
- **`src/config/`**: Configuration management

### Dependencies
- `@cosmjs/cosmwasm-stargate`: CosmWasm client
- `@cosmjs/stargate`: Stargate client
- `@cosmjs/proto-signing`: Protocol buffer signing
- `@cosmjs/amino`: Amino encoding
- `@cosmjs/crypto`: Cryptographic utilities
- `@cosmjs/encoding`: Encoding utilities
- `@cosmjs/math`: Mathematical utilities
- `@cosmjs/utils`: General utilities
- `cosmjs-types`: CosmJS type definitions
- `long`: Long integer support

## [0.1.0] - 2024-01-XX

### Added
- Project initialization
- Basic project structure
- Development environment setup

---

## Versioning

This project uses [Semantic Versioning](https://semver.org/). For the versions available, see the [tags on this repository](https://github.com/sei-money/sei-money-sdk/tags).

## Release Process

1. **Development**: Features and fixes are developed in feature branches
2. **Testing**: All changes are tested with the comprehensive test suite
3. **Review**: Code is reviewed and approved by maintainers
4. **Release**: New versions are tagged and released
5. **Documentation**: Changelog and documentation are updated

## Contributing

When contributing to this project, please:

1. Follow the existing code style
2. Add tests for new functionality
3. Update documentation as needed
4. Update this changelog with your changes
5. Use conventional commit messages

## Support

For questions and support:

- **Issues**: [GitHub Issues](https://github.com/sei-money/sei-money-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sei-money/sei-money-sdk/discussions)
- **Documentation**: [README.md](README.md)
- **Examples**: [src/example.ts](src/example.ts)
