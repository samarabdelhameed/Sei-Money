# Quick Test Commands for SeiMoney Frontend

## Console Commands Available

Open browser console (F12) and run these commands to test different aspects:

### 🚀 Quick Health Check
```javascript
// Run quick health check
SeiMoneyQuickTest.runAllQuickTests()

// Test current screen only
SeiMoneyQuickTest.testCurrentScreen()
```

### 🔍 Screen Testing
```javascript
// Test specific screens
SeiMoneyTesting.testScreen("home")
SeiMoneyTesting.testScreen("dashboard") 
SeiMoneyTesting.testScreen("payments")
SeiMoneyTesting.testScreen("ai-agent")
```

### 🌐 Integration Testing
```javascript
// Test API connectivity
SeiMoneyQuickTest.testAPIConnectivity()

// Test wallet detection
SeiMoneyQuickTest.testWalletDetection()

// Test specific integrations
SeiMoneyTesting.testIntegration("api")
SeiMoneyTesting.testIntegration("wallet")
```

### 📸 Screenshot Testing
```javascript
// Capture current screen
SeiMoneyTesting.screenshotCapture().then(sc => sc.captureFullPage())

// Capture specific element
SeiMoneyTesting.screenshotCapture().then(sc => sc.captureElement("main"))
```

### 🧪 Full Test Suite
```javascript
// Run comprehensive test suite
SeiMoneyTesting.runFullTestSuite()

// Validate infrastructure
SeiMoneyTesting.validateInfrastructure()
```

### 📊 Data Management
```javascript
// View test data
SeiMoneyTesting.testDataManager().then(dm => dm.getDataStatistics())

// Clear test data
SeiMoneyTesting.testDataManager().then(dm => dm.executeAllCleanupTasks())
```

### 🔧 Infrastructure Testing
```javascript
// Initialize infrastructure
SeiMoneyTesting.testInfrastructure().then(ti => ti.initialize())

// Check infrastructure status
SeiMoneyTesting.testInfrastructure().then(ti => ti.getStatus())

// Perform health check
SeiMoneyTesting.testInfrastructure().then(ti => ti.performHealthCheck())
```

### 🌐 Network Diagnostics
```javascript
// Run network diagnostics
NetworkTester.runNetworkDiagnostics()

// Quick network check
NetworkTester.quickConnectivityCheck()

// Test specific endpoints
NetworkTester.testEndpoint("/health")
NetworkTester.testEndpoint("/api/v1/market/stats")
```

### 🔌 Connection Diagnostics
```javascript
// Full connection diagnostics
ConnectionDiagnostics.runFullDiagnostics()

// Quick health check
ConnectionDiagnostics.quickHealthCheck()

// Test wallet connections
ConnectionDiagnostics.testWalletConnections()
```

## Test Scenarios to Try

### 1. Home Screen Testing
```javascript
// Navigate to home and test
window.location.hash = '#/'
await new Promise(r => setTimeout(r, 1000))
SeiMoneyTesting.testScreen("home")
```

### 2. Wallet Connection Testing
```javascript
// Test MetaMask connection
if (window.ethereum) {
    console.log("MetaMask detected, testing connection...")
    // Try connecting through UI or:
    SeiMoneyQuickTest.testWalletDetection()
}
```

### 3. Form Validation Testing
```javascript
// Navigate to payments and test form
window.location.hash = '#/payments'
await new Promise(r => setTimeout(r, 1000))
SeiMoneyQuickTest.testUserInteractions()
```

### 4. Data Validation Testing
```javascript
// Test data formats and API responses
SeiMoneyQuickTest.testDataValidation()
```

### 5. Performance Testing
```javascript
// Measure page load performance
console.time('pageLoad')
window.location.reload()
// After reload:
console.timeEnd('pageLoad')
```

## Expected Results

### ✅ Working Features
- Home screen loads with demo data
- Navigation between screens works
- Form validation works
- Screenshot capture works (with fallbacks)
- Test infrastructure initializes
- Wallet detection works

### ⚠️ Limited Features (Backend Required)
- Real market data (shows demo data)
- Transaction creation (form works, needs backend)
- Balance queries (needs backend)
- AI agent responses (needs backend)

### ❌ Not Working (Expected)
- Backend API calls (server not running)
- Smart contract interactions (contracts not deployed)
- Real transaction processing (needs blockchain)

## Troubleshooting

### If Tests Don't Work
1. **Refresh the page** - Test suite loads on page load
2. **Check console for errors** - Look for loading issues
3. **Verify you're on the app page** - Not the test runner page
4. **Try individual commands** - Start with simple tests

### Common Issues
```javascript
// If SeiMoneyTesting is undefined:
console.log("Available testing objects:", Object.keys(window).filter(k => k.includes('Test')))

// If screenshots fail:
SeiMoneyTesting.screenshotCapture().then(sc => sc.createFallbackScreenshot())

// If infrastructure fails:
SeiMoneyTesting.testInfrastructure().then(ti => ti.cleanup().then(() => ti.initialize()))
```

## Test Results Interpretation

### Pass Rates
- **80-100%**: Excellent ✅
- **60-79%**: Good ⚠️
- **40-59%**: Needs Attention ⚠️
- **0-39%**: Critical Issues ❌

### Status Meanings
- **PASSED**: Feature working correctly ✅
- **WARNING**: Feature working but with limitations ⚠️
- **FAILED**: Feature not working ❌
- **SKIPPED**: Test not applicable 🔄

## Advanced Testing

### Custom Test Creation
```javascript
// Create custom test
const customTest = {
    name: "My Custom Test",
    test: async () => {
        // Your test logic here
        return { passed: true, message: "Test passed!" }
    }
}

// Run custom test
customTest.test().then(result => console.log(result))
```

### Batch Testing
```javascript
// Test multiple screens
const screens = ["home", "dashboard", "payments"]
for (const screen of screens) {
    console.log(`Testing ${screen}...`)
    await SeiMoneyTesting.testScreen(screen)
}
```

### Performance Monitoring
```javascript
// Monitor performance continuously
setInterval(() => {
    const memory = performance.memory
    console.log(`Memory: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`)
}, 5000)
```

---

**Note**: These commands work when you're on the SeiMoney application page (not the test runner page). The test suite automatically loads when the app starts.