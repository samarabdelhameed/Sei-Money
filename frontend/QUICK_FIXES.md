# 🚀 Quick Fixes for Common Issues

## 🔧 Backend Connection Issues

### ❌ "Failed to load resource: net::ERR_CONNECTION_REFUSED"

**Problem**: Backend server is not running on localhost:3001

**Quick Fix**:
```bash
# In a new terminal, navigate to backend folder and start server
cd backend
npm run dev
```

**Alternative**: The app will automatically use demo data when backend is offline.

### ❌ "Network error: Failed to fetch"

**Diagnosis**:
```javascript
// Check backend status
await ConnectionDiagnostics.quickHealthCheck()
```

**Solutions**:
1. Start backend server (see above)
2. Check if port 3001 is available
3. Verify backend is running: `curl http://localhost:3001/health`

## 🌐 Sei Network Issues

### ❌ "Failed to switch to Sei Network"

**Quick Fix**:
```javascript
// Auto-add Sei Network to MetaMask
await NetworkTester.autoFixMetaMaskSei()
```

**Manual Fix**:
1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Use these details:
   - **Network Name**: Sei Network
   - **RPC URL**: https://evm-rpc.sei-apis.com
   - **Chain ID**: 1329
   - **Symbol**: SEI
   - **Explorer**: https://seitrace.com

### ❌ "Cannot read properties of undefined (reading 'encode')"

**Problem**: CosmJS encoding issue (already fixed)

**Solution**: Refresh the page - the fix is applied automatically.

## 👛 Wallet Issues

### ❌ "Wallet not detected"

**Check Available Wallets**:
```javascript
await SeiMoneyQuickTest.testWalletDetection()
```

**Solutions**:
1. **Install Wallets**:
   - [Keplr](https://keplr.app) - Recommended for Cosmos
   - [Leap](https://leapwallet.io) - Alternative Cosmos wallet
   - [MetaMask](https://metamask.io) - For EVM compatibility

2. **After Installation**:
   - Refresh the page
   - Unlock your wallet
   - Try connecting again

### ❌ "Failed to get Cosmos balance"

**Problem**: Cosmos client connection issue

**Solution**: The app now uses REST API fallback automatically. No action needed.

## 🧪 Testing Issues

### ❌ "Testing suite not loaded"

**Check Status**:
```javascript
// Verify testing suite is available
console.log('Testing available:', !!window.SeiMoneyQuickTest)
```

**Solution**: Refresh the page. Testing suite loads automatically in development mode.

### ❌ "Elements not found" in tests

**Quick Fix**:
```javascript
// Add test IDs to current page elements
addTestIds()
```

**Automatic Fix**: Test IDs are added automatically, but you can trigger manually if needed.

## 📱 Browser Issues

### ❌ Browser compatibility warnings

**Check Compatibility**:
```javascript
await ConnectionDiagnostics.runFullDiagnostics()
```

**Solutions**:
1. Use modern browsers: Chrome, Firefox, Safari, Edge
2. Enable JavaScript
3. Clear browser cache: Ctrl+Shift+R (hard refresh)

## 🎯 Quick Diagnostic Commands

### Essential Commands
```javascript
// Quick health check (30 seconds)
await ConnectionDiagnostics.quickHealthCheck()

// Full diagnostics (2 minutes)
await ConnectionDiagnostics.runFullDiagnostics()

// Test current screen
await SeiMoneyQuickTest.testCurrentScreen()

// Test all functionality
await SeiMoneyQuickTest.runAllQuickTests()

// Fix MetaMask network
await NetworkTester.autoFixMetaMaskSei()
```

### Specific Tests
```javascript
// Test API connectivity
await SeiMoneyQuickTest.testAPIConnectivity()

// Test wallet detection
await SeiMoneyQuickTest.testWalletDetection()

// Test data validation
await SeiMoneyQuickTest.testDataValidation()

// Test user interactions
await SeiMoneyQuickTest.testUserInteractions()
```

## 🔄 Reset Everything

If nothing works, try this complete reset:

```javascript
// 1. Clear all data
localStorage.clear()
sessionStorage.clear()

// 2. Hard refresh
// Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)

// 3. Run diagnostics
await ConnectionDiagnostics.runFullDiagnostics()

// 4. Test functionality
await SeiMoneyQuickTest.runAllQuickTests()
```

## 📊 Expected Results

After fixes, you should see:
- ✅ Backend: Online (or demo data message)
- ✅ Sei Network: Connected
- ✅ Wallets: At least one detected
- ✅ Tests: 85%+ pass rate

## 🆘 Still Having Issues?

1. **Check Browser Console**: Look for specific error messages
2. **Run Full Diagnostics**: `ConnectionDiagnostics.runFullDiagnostics()`
3. **Test Step by Step**: Use individual test commands
4. **Verify Environment**: Ensure you're in development mode

## 📞 Debug Information

When reporting issues, include:
```javascript
// Get debug information
console.log('Environment:', {
  url: window.location.href,
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString()
})

// Run diagnostics and share results
await ConnectionDiagnostics.runFullDiagnostics()
```

---

## 🎉 Success Indicators

Everything is working when you see:
- 🏠 Home screen loads with market data
- 👛 Wallet connection options available
- 📊 Charts and statistics display
- 🔗 Navigation between screens works
- ✅ Tests pass with high success rate

Happy coding! 🚀