# Contributing to Sei Money SDK

Thank you for your interest in contributing to the Sei Money SDK! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Basic knowledge of TypeScript and blockchain development

### Development Setup
1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sei-money-sdk.git
   cd sei-money-sdk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up development environment**
   ```bash
   npm run dev  # Watch mode for development
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## 📋 Contribution Guidelines

### What We're Looking For
- **Bug fixes**: Fix issues and improve stability
- **New features**: Add functionality to existing contracts
- **Documentation**: Improve docs, examples, and guides
- **Testing**: Add tests and improve coverage
- **Performance**: Optimize existing code
- **New contracts**: Implement support for additional contracts

### What We're NOT Looking For
- Breaking changes without discussion
- Features that don't align with the project's scope
- Code that doesn't follow our style guidelines
- Untested code

## 🏗️ Development Workflow

### 1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

### 2. **Make Your Changes**
   - Write your code following our style guidelines
   - Add tests for new functionality
   - Update documentation as needed

### 3. **Test Your Changes**
   ```bash
   npm test              # Run all tests
   npm run lint          # Check code style
   npm run build         # Ensure build works
   ```

### 4. **Commit Your Changes**
   Use conventional commit messages:
   ```bash
   git commit -m "feat: add new helper function for batch transfers"
   git commit -m "fix: resolve issue with gas estimation"
   git commit -m "docs: update README with new examples"
   ```

### 5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Then create a Pull Request on GitHub
   ```

## 📝 Code Style Guidelines

### TypeScript
- Use strict TypeScript settings
- Prefer interfaces over types for object shapes
- Use explicit return types for public functions
- Avoid `any` type - use proper typing

### Naming Conventions
- **Files**: Use kebab-case (`payments-client.ts`)
- **Classes**: Use PascalCase (`PaymentsClient`)
- **Functions**: Use camelCase (`createTransfer`)
- **Constants**: Use UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Interfaces**: Use PascalCase with descriptive names (`TransferRequest`)

### Code Organization
- Keep functions small and focused
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Group related functionality together

### Example
```typescript
/**
 * Creates a new transfer with optional expiry
 * @param recipient - The recipient's address
 * @param amount - The amount to transfer
 * @param remark - Optional remark for the transfer
 * @param expiry - Optional expiry timestamp
 * @returns Promise resolving to transaction result
 */
export async function createTransfer(
  recipient: Address,
  amount: Coin,
  remark?: string,
  expiry?: number
): Promise<TxResult> {
  // Implementation...
}
```

## 🧪 Testing Guidelines

### Test Structure
- **Unit tests**: Test individual functions
- **Integration tests**: Test client interactions
- **Error tests**: Test error conditions
- **Edge case tests**: Test boundary conditions

### Test Naming
```typescript
describe('PaymentsClient', () => {
  describe('createTransfer', () => {
    it('should create transfer successfully', async () => {
      // Test implementation
    });

    it('should throw error for invalid recipient', async () => {
      // Test error case
    });
  });
});
```

### Test Coverage
- Aim for >90% test coverage
- Test both success and failure paths
- Mock external dependencies
- Use realistic test data

## 📚 Documentation Guidelines

### Code Comments
- Use JSDoc for all public APIs
- Explain complex logic with inline comments
- Keep comments up-to-date with code changes

### README Updates
- Update README when adding new features
- Include usage examples
- Update API documentation
- Add new configuration options

### Architecture Documentation
- Update `ARCHITECTURE.md` for significant changes
- Document new design decisions
- Keep diagrams and examples current

## 🔌 Adding New Contracts

### 1. **Create Contract Schema**
   ```bash
   mkdir src/gen/contract_name
   # Add messages.ts, queries.ts, index.ts
   ```

### 2. **Create Client Wrapper**
   ```bash
   # Create src/clients/contract_name.ts
   # Implement high-level API
   ```

### 3. **Add Configuration**
   ```typescript
   // Update src/config.ts
   export const DEFAULT_CONTRACTS = {
     // ... existing contracts
     contractName: 'sei1contractaddress...',
   };
   ```

### 4. **Add Tests**
   ```bash
   # Create comprehensive tests
   # Test all operations
   # Test error conditions
   ```

### 5. **Update Documentation**
   - Add to README
   - Update examples
   - Document new types

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Try the latest version
3. Reproduce the issue
4. Check your configuration

### Bug Report Template
```markdown
**Description**
Brief description of the issue

**Steps to Reproduce**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**
What you expected to happen

**Actual Behavior**
What actually happened

**Environment**
- SDK Version: [e.g., 1.0.0]
- Node Version: [e.g., 18.0.0]
- OS: [e.g., macOS 12.0]
- Network: [e.g., testnet]

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

### Before Requesting
1. Check if it's already planned
2. Consider if it fits the project scope
3. Think about implementation complexity

### Feature Request Template
```markdown
**Description**
Clear description of the feature

**Use Case**
Why this feature is needed

**Proposed Solution**
How you think it should work

**Alternatives Considered**
Other approaches you considered

**Additional Context**
Any other relevant information
```

## 🔄 Pull Request Process

### PR Requirements
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or discussed)
- [ ] Commit messages follow conventions

### PR Review Process
1. **Automated Checks**: CI/CD pipeline runs tests
2. **Code Review**: Maintainers review the code
3. **Discussion**: Address any feedback
4. **Approval**: PR approved by maintainers
5. **Merge**: PR merged to main branch

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass

## Documentation
- [ ] README updated
- [ ] API docs updated
- [ ] Examples updated

## Breaking Changes
- [ ] No breaking changes
- [ ] Breaking changes documented
```

## 🏆 Recognition

### Contributors
- All contributors are listed in the README
- Significant contributions get special recognition
- Contributors can become maintainers

### Becoming a Maintainer
- Show consistent quality contributions
- Help review other PRs
- Participate in project discussions
- Demonstrate project knowledge

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and discussions
- **Pull Requests**: For code reviews and feedback

### Code of Conduct
- Be respectful and inclusive
- Focus on the code, not the person
- Help others learn and grow
- Follow the project's values

## 🎯 Development Priorities

### High Priority
- Bug fixes and stability improvements
- Security enhancements
- Performance optimizations
- Core contract support

### Medium Priority
- New helper functions
- Additional utility functions
- Documentation improvements
- Testing enhancements

### Low Priority
- Nice-to-have features
- Experimental functionality
- Cosmetic improvements
- Non-critical optimizations

## 🚀 Release Process

### Versioning
- Follows [Semantic Versioning](https://semver.org/)
- Major versions for breaking changes
- Minor versions for new features
- Patch versions for bug fixes

### Release Steps
1. **Development**: Features developed in feature branches
2. **Testing**: Comprehensive testing on all changes
3. **Review**: Code review and approval process
4. **Release**: Version bump and npm publish
5. **Documentation**: Update changelog and docs

---

Thank you for contributing to the Sei Money SDK! Your contributions help make this project better for everyone in the DeFi ecosystem.
