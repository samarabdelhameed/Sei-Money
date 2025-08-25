# 🌐 Sei Network Troubleshooting Guide

## Quick Fix for MetaMask Issues

### 🚀 Automatic Fix (Recommended)
Open browser console and run:
```javascript
await NetworkTester.autoFixMetaMaskSei()
```

### 🔍 Diagnose Issues
```javascript
await NetworkTester.runNetworkDiagnostics()
```

## Common Issues & Solutions

### ❌ "Failed to switch to Sei Network"

**Solution 1: Automatic Network Addition**
```javascript
// In browser console:
await NetworkTester.autoFixMetaMaskSei()
```

**Solution 2: Manual Network Addition**
1. Open MetaMask
2. Click network dropdown
3. Click "Add Network"
4. Fill in these details:
   - **Network Name**: Sei Network
   - **New RPC URL**: https://evm-rpc.sei-apis.com
   - **Chain ID**: 1329 (or 0x531)
   - **Currency Symbol**: SEI
   - **Block Explorer**: https://seitrace.com

### ❌ "Cannot read properties of undefined (reading 'encode')"

This is a CosmJS encoding issue. Fixed in the latest update.

**Solution**: Refresh the page - the fix is already applied.

### ❌ MetaMask Not Detected

**Solutions**:
1. Install MetaMask browser extension
2. Refresh the page after installation
3. Make sure MetaMask is unlocked

### ❌ Network Connection Issues

**Check Network Status**:
```javascript
// Test all Sei network endpoints
await NetworkTester.testSeiNetwork()
```

**Solutions**:
1. Check internet connection
2. Try different RPC endpoints
3. Wait a few minutes and retry

## Network Configuration Details

### Sei Mainnet
- **Chain ID**: 1329 (0x531)
- **RPC URL**: https://evm-rpc.sei-apis.com
- **Explorer**: https://seitrace.com
- **Symbol**: SEI

### Sei Testnet (Fallback)
- **Chain ID**: 1329 (0x531)
- **RPC URL**: https://evm-rpc-testnet.sei-apis.com
- **Explorer**: https://seitrace.com
- **Symbol**: SEI

## Testing Commands

### Complete Diagnostics
```javascript
// Run full network diagnostics
await NetworkTester.runNetworkDiagnostics()
```

### Test Specific Components
```javascript
// Test Sei network connectivity
await NetworkTester.testSeiNetwork()

// Test MetaMask configuration
await NetworkTester.testMetaMaskSeiConfig()

// Auto-fix MetaMask issues
await NetworkTester.autoFixMetaMaskSei()
```

### Test Frontend Integration
```javascript
// Test current screen
await SeiMoneyQuickTest.testCurrentScreen()

// Test wallet detection
await SeiMoneyQuickTest.testWalletDetection()

// Test API connectivity
await SeiMoneyQuickTest.testAPIConnectivity()
```

## Step-by-Step Troubleshooting

### 1. Check MetaMask Installation
```javascript
console.log('MetaMask installed:', !!(window.ethereum && window.ethereum.isMetaMask))
```

### 2. Check Current Network
```javascript
if (window.ethereum) {
  const chainId = await window.ethereum.request({ method: 'eth_chainId' })
  console.log('Current network:', chainId)
  console.log('Is Sei Network:', chainId === '0x531')
}
```

### 3. Add Sei Network
```javascript
await NetworkTester.autoFixMetaMaskSei()
```

### 4. Test Connection
```javascript
await SeiMoneyQuickTest.testWalletDetection()
```

## Manual MetaMask Setup

If automatic setup fails, add the network manually:

1. **Open MetaMask** → Click network dropdown
2. **Add Network** → Select "Add a network manually"
3. **Fill Details**:
   ```
   Network name: Sei Network
   New RPC URL: https://evm-rpc.sei-apis.com
   Chain ID: 1329
   Currency symbol: SEI
   Block explorer URL: https://seitrace.com
   ```
4. **Save** → Switch to Sei Network
5. **Test** → Try connecting wallet again

## Verification Steps

After setup, verify everything works:

```javascript
// 1. Check network status
await NetworkTester.runNetworkDiagnostics()

// 2. Test wallet connection
await SeiMoneyQuickTest.testWalletDetection()

// 3. Test full application
await SeiMoneyQuickTest.runAllQuickTests()
```

## Success Indicators

You should see:
- ✅ MetaMask installed and unlocked
- ✅ Sei Network added to MetaMask
- ✅ Currently connected to Sei Network (Chain ID: 0x531)
- ✅ Sei RPC endpoints responding
- ✅ Wallet detection working in application

## Still Having Issues?

1. **Clear Browser Cache** → Hard refresh (Ctrl+Shift+R)
2. **Restart MetaMask** → Lock and unlock wallet
3. **Try Different Browser** → Chrome, Firefox, Edge
4. **Check Console Errors** → Look for specific error messages
5. **Update MetaMask** → Ensure latest version

## Contact Support

If issues persist:
- Check browser console for detailed error messages
- Run `NetworkTester.runNetworkDiagnostics()` and share results
- Verify MetaMask version and browser compatibility

---

## Quick Reference Commands

```javascript
// Essential troubleshooting commands
await NetworkTester.runNetworkDiagnostics()     // Full diagnostics
await NetworkTester.autoFixMetaMaskSei()        // Auto-fix MetaMask
await SeiMoneyQuickTest.runAllQuickTests()      // Test application
```

Happy testing! 🚀