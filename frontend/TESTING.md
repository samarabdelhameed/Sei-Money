# 🧪 SeiMoney Frontend Testing Guide

## Quick Start

### Method 1: Using Test Runner Interface
1. Open `frontend/test-runner.html` in your browser
2. Click "Open SeiMoney App" to launch the application
3. Use the testing buttons to run specific tests
4. View results in the interface

### Method 2: Browser Console Testing
1. Start the frontend: `npm run dev`
2. Open http://localhost:5173 in your browser
3. Open Developer Console (F12)
4. Run tests using these commands:

```javascript
// Quick tests (recommended for fast validation)
await SeiMoneyQuickTest.runAllQuickTests()
await SeiMoneyQuickTest.testCurrentScreen()
await SeiMoneyQuickTest.testAPIConnectivity()
await SeiMoneyQuickTest.testWalletDetection()

// Comprehensive tests (full validation)
await SeiMoneyTesting.runFullTestSuite()
await SeiMoneyTesting.testScreen('home')
await SeiMoneyTesting.testIntegration('api')
```

## 🎯 What Gets Tested

### ✅ Screen Validation
- **Home Screen**: Market statistics, navigation, TVL chart, feature cards
- **Dashboard**: Wallet connection, portfolio display, real-time updates
- **Payments**: Form validation, transfer creation, transaction history
- **AI Agent**: Service connectivity, query responses

### ✅ Integration Testing
- **Backend API**: All endpoints, response validation, error handling
- **Smart Contracts**: Payment, vault, and group contract interactions
- **Wallet Integration**: Keplr, Leap, MetaMask detection and connection

### ✅ Data Validation
- **Real Data**: Market statistics accuracy, portfolio calculations
- **Format Validation**: Currency formats, address formats, percentages
- **Cross-Screen Consistency**: Data synchronization between screens

### ✅ User Experience
- **Navigation**: Screen transitions, button functionality
- **Form Validation**: Input validation, error messages
- **Responsive Design**: Mobile, tablet, desktop layouts
- **Performance**: Load times, memory usage, API response times

## 🚀 Running Tests

### Current Screen Test
```javascript
// Test whatever screen you're currently viewing
const results = await SeiMoneyQuickTest.testCurrentScreen();
console.table(results);
```

### API Integration Test
```javascript
// Test all backend API endpoints
const apiResults = await SeiMoneyQuickTest.testAPIConnectivity();
apiResults.forEach(r => console.log(`${r.testName}: ${r.status}`));
```

### Wallet Detection Test
```javascript
// Check which wallets are available
const walletResults = await SeiMoneyQuickTest.testWalletDetection();
```

### Complete Test Suite
```javascript
// Run everything (takes 2-3 minutes)
const fullResults = await SeiMoneyTesting.runFullTestSuite();
console.log(`Pass rate: ${(fullResults.passRate * 100).toFixed(1)}%`);
```

## 🔧 Test Configuration

### Adding Test IDs
The system automatically adds test IDs to elements, but you can manually trigger:
```javascript
// Add test IDs to current page elements
addTestIds();

// Set up automatic test ID addition for new elements
setupAutoTestIds();
```

### Custom Test Selectors
Update `frontend/src/testing/test-config.ts`:
```typescript
export const TEST_SELECTORS = {
  HOME: {
    TVL_VALUE: '[data-testid="tvl-value"]',
    GET_STARTED_BTN: '[data-testid="get-started-btn"]'
  }
};
```

## 📊 Understanding Results

### Test Status Types
- ✅ **PASSED**: Test completed successfully
- ❌ **FAILED**: Test failed, needs attention
- ⚠️ **WARNING**: Test passed but with concerns

### Common Issues and Solutions

#### "Element not found" errors
```javascript
// Check if elements have proper test IDs
addTestIds();
// Or manually add to your components:
<button data-testid="my-button">Click me</button>
```

#### API connection failures
```javascript
// Check if backend is running
await fetch('http://localhost:3001/health')
  .then(r => console.log('Backend:', r.ok ? '✅ Online' : '❌ Offline'))
  .catch(() => console.log('Backend: ❌ Not running'));
```

#### Wallet not detected
- Install browser wallet extensions (Keplr, Leap, MetaMask)
- Refresh the page after installation
- Check browser console for wallet-related errors

## 🎨 Test Categories

### Performance Tests
```javascript
// Check page load performance
const loadTime = await testUtils.measurePageLoadTime();
console.log(`Page loaded in ${loadTime}ms`);

// Check memory usage
const memory = testUtils.getMemoryUsage();
console.log(`Memory usage: ${memory}MB`);
```

### Security Tests
```javascript
// Test form validation
await testUtils.inputText('[data-testid="recipient-input"]', 'invalid_address');
// Should show validation error
```

### Cross-Browser Testing
The test suite automatically detects browser type and adjusts tests accordingly.

## 🛠️ Development Workflow

### Before Committing Code
```bash
# 1. Start the application
npm run dev

# 2. Run quick tests in browser console
SeiMoneyQuickTest.runAllQuickTests()

# 3. Fix any failing tests
# 4. Commit your changes
```

### Adding New Features
1. Add appropriate `data-testid` attributes to new components
2. Update test selectors in `test-config.ts` if needed
3. Run tests to ensure new features work correctly
4. Add specific tests for complex new functionality

### Debugging Tests
```javascript
// Enable debug mode
localStorage.setItem('seiMoney_test_debug', 'true');

// Check element visibility
const element = document.querySelector('[data-testid="my-element"]');
console.log('Visible:', testUtils.isElementVisible(element));

// Test API endpoints manually
const result = await testUtils.testApiEndpoint('/api/v1/market/stats');
console.log('API Result:', result);
```

## 📈 Continuous Testing

### Automated Testing
The test suite runs automatically in development mode and provides:
- Real-time validation of UI changes
- Automatic test ID assignment
- Performance monitoring
- Integration health checks

### Manual Testing Checklist
- [ ] Home screen loads with real market data
- [ ] Navigation between all screens works
- [ ] Wallet connection flow functions properly
- [ ] Forms validate inputs correctly
- [ ] API calls return expected data
- [ ] Error handling works as expected
- [ ] Responsive design works on different screen sizes

## 🎯 Success Criteria

A successful test run should show:
- ✅ All screens load and display data correctly
- ✅ Navigation between screens works smoothly
- ✅ API integrations return valid data
- ✅ Wallet connections are detected properly
- ✅ Form validations work correctly
- ✅ Performance metrics are within acceptable ranges
- ✅ Error handling functions as expected

## 🆘 Troubleshooting

### Tests Not Loading
1. Check browser console for JavaScript errors
2. Ensure frontend is running on http://localhost:5173
3. Try refreshing the page
4. Clear browser cache if needed

### API Tests Failing
1. Verify backend is running on http://localhost:3001
2. Check network connectivity
3. Verify API endpoints are correct in configuration

### Wallet Tests Failing
1. Install required wallet extensions
2. Check if wallets are unlocked
3. Verify network configuration in wallets

### Performance Issues
1. Close unnecessary browser tabs
2. Check system resources
3. Run tests on a single screen at a time

---

Happy Testing! 🧪✨