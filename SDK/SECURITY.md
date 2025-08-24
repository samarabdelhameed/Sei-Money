# Security Policy

## 🛡️ Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## 🚨 Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 1. **DO NOT** Create a Public Issue
- Security vulnerabilities should not be disclosed publicly
- Public disclosure can put users at risk
- Follow responsible disclosure practices

### 2. **DO** Report Privately
Send an email to: **security@sei.money**

### 3. **Include in Your Report**
- **Description**: Clear description of the vulnerability
- **Impact**: How the vulnerability could be exploited
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Proof of Concept**: If possible, include a PoC
- **Affected Versions**: Which SDK versions are affected
- **Suggested Fix**: If you have ideas for fixing the issue

### 4. **Response Timeline**
- **Initial Response**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix Development**: Depends on complexity
- **Public Disclosure**: After fix is available

## 🔒 Security Features

### Input Validation
- All user inputs are validated before processing
- Address format validation for Sei addresses
- Amount validation to prevent overflow attacks
- Parameter sanitization to prevent injection attacks

### Error Handling
- Custom error types with specific error codes
- No sensitive information in error messages
- Safe error recovery mechanisms
- Comprehensive error logging

### Transaction Safety
- Retry logic with exponential backoff
- Gas estimation with safety margins
- Transaction confirmation and verification
- Safe transaction signing

### Network Security
- HTTPS-only connections to RPC endpoints
- Certificate validation for secure connections
- Network timeout configurations
- Rate limiting considerations

## 🧪 Security Testing

### Automated Testing
- Security-focused unit tests
- Input validation tests
- Error handling tests
- Edge case testing

### Manual Testing
- Security code reviews
- Penetration testing
- Vulnerability assessments
- Dependency audits

### Third-Party Audits
- Regular dependency updates
- Security vulnerability scanning
- Code quality analysis
- External security reviews

## 🔐 Best Practices for Users

### 1. **Keep Dependencies Updated**
```bash
npm audit
npm update
```

### 2. **Use Environment Variables**
```bash
# Don't hardcode sensitive information
export SEI_PRIVATE_KEY="your-private-key"
export SEI_RPC_URL="https://rpc.sei.io"
```

### 3. **Validate Inputs**
```typescript
import { isValidAddress, isValidDenom } from 'sei-money-sdk';

// Always validate user inputs
if (!isValidAddress(recipient)) {
  throw new Error('Invalid recipient address');
}
```

### 4. **Handle Errors Safely**
```typescript
try {
  const result = await sdk.payments.createTransfer(recipient, amount);
  // Handle success
} catch (error) {
  // Log error safely (no sensitive data)
  console.error('Transfer failed:', error.message);
  // Don't expose internal details to users
}
```

### 5. **Use Secure Networks**
```typescript
import { NETWORKS } from 'sei-money-sdk';

// Use official network configurations
const sdk = new SeiMoneySDK({
  network: NETWORKS.MAINNET, // or TESTNET
  // Don't use untrusted RPC endpoints
});
```

## 🚫 Security Anti-Patterns

### ❌ Don't Do This
```typescript
// Don't hardcode private keys
const privateKey = "abc123...";

// Don't use untrusted RPC endpoints
const rpcUrl = "http://malicious-rpc.com";

// Don't expose internal errors
catch (error) {
  console.error('Internal error:', error.stack);
}

// Don't skip input validation
const recipient = userInput; // Could be malicious
```

### ✅ Do This Instead
```typescript
// Use environment variables
const privateKey = process.env.SEI_PRIVATE_KEY;

// Use trusted network configurations
const rpcUrl = NETWORKS.MAINNET.rpcUrl;

// Handle errors safely
catch (error) {
  console.error('Operation failed:', error.message);
}

// Always validate inputs
if (!isValidAddress(userInput)) {
  throw new Error('Invalid address');
}
```

## 🔍 Security Checklist

### Before Deploying
- [ ] All dependencies are up to date
- [ ] Security audit passed (`npm audit`)
- [ ] Input validation implemented
- [ ] Error handling configured
- [ ] Network security configured
- [ ] Private keys secured
- [ ] Logging configured safely

### Regular Maintenance
- [ ] Weekly dependency updates
- [ ] Monthly security reviews
- [ ] Quarterly vulnerability assessments
- [ ] Annual security audits

## 🆘 Emergency Response

### Critical Vulnerabilities
For critical vulnerabilities (remote code execution, private key exposure):

1. **Immediate Response** (Within 24 hours)
   - Assess impact and scope
   - Develop emergency fix
   - Notify affected users

2. **Public Disclosure** (Within 72 hours)
   - Release security advisory
   - Provide mitigation steps
   - Update affected versions

3. **Fix Deployment** (Within 1 week)
   - Release patched version
   - Update documentation
   - Monitor for issues

### Non-Critical Vulnerabilities
For non-critical vulnerabilities:

1. **Assessment** (Within 1 week)
   - Evaluate risk level
   - Plan fix timeline
   - Communicate to users

2. **Fix Development** (Within 1 month)
   - Develop and test fix
   - Update affected versions
   - Deploy to production

## 📞 Security Contacts

### Primary Security Contact
- **Email**: security@sei.money
- **Response Time**: 48 hours
- **Escalation**: 24 hours for critical issues

### Security Team
- **Lead**: Security Lead
- **Members**: Core development team
- **External**: Security consultants (as needed)

### Disclosure Policy
- **Coordinated Disclosure**: We prefer coordinated disclosure
- **Timeline**: 90 days for non-critical issues
- **Credit**: Security researchers credited in advisories
- **Bounty**: No bug bounty program currently

## 📚 Security Resources

### Documentation
- [Security Best Practices](README.md#security)
- [Configuration Guide](README.md#configuration)
- [Error Handling](README.md#error-handling)

### Tools
- `npm audit` - Dependency vulnerability scanning
- `npm outdated` - Check for outdated packages
- `npm ls` - List installed packages

### External Resources
- [OWASP Security Guidelines](https://owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [TypeScript Security](https://www.typescriptlang.org/docs/)

---

## 🤝 Responsible Disclosure

We believe in responsible disclosure and appreciate security researchers who:

- Report vulnerabilities privately
- Give us reasonable time to fix issues
- Work with us to coordinate disclosure
- Follow ethical hacking practices

Thank you for helping keep the Sei Money SDK secure!
