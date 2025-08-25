// Connection Diagnostics for SeiMoney Frontend

export class ConnectionDiagnostics {
  
  // Test all connections and provide detailed report
  static async runFullDiagnostics(): Promise<void> {
    console.log('🔍 Running SeiMoney Connection Diagnostics...');
    console.log('='.repeat(50));

    const results = {
      backend: await this.testBackendConnection(),
      seiNetwork: await this.testSeiNetwork(),
      wallets: await this.testWalletAvailability(),
      browser: this.testBrowserCompatibility()
    };

    // Summary
    console.log('\n📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(50));
    
    const backendStatus = results.backend.available ? '✅' : '❌';
    const seiStatus = results.seiNetwork.mainnet || results.seiNetwork.testnet ? '✅' : '❌';
    const walletStatus = Object.values(results.wallets).some(w => w) ? '✅' : '❌';
    const browserStatus = results.browser.compatible ? '✅' : '⚠️';

    console.log(`Backend API:     ${backendStatus} ${results.backend.available ? 'Online' : 'Offline'}`);
    console.log(`Sei Network:     ${seiStatus} ${results.seiNetwork.mainnet ? 'Mainnet OK' : results.seiNetwork.testnet ? 'Testnet OK' : 'Unreachable'}`);
    console.log(`Wallets:         ${walletStatus} ${Object.entries(results.wallets).filter(([_, available]) => available).map(([name]) => name).join(', ') || 'None available'}`);
    console.log(`Browser:         ${browserStatus} ${results.browser.compatible ? 'Compatible' : 'Limited support'}`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('='.repeat(50));

    if (!results.backend.available) {
      console.log('🔧 Backend Issues:');
      console.log('   • Start the backend server on localhost:3001');
      console.log('   • Check if backend is running: npm run dev (in backend folder)');
      console.log('   • Application will use demo data until backend is available');
    }

    if (!results.seiNetwork.mainnet && !results.seiNetwork.testnet) {
      console.log('🌐 Network Issues:');
      console.log('   • Check internet connection');
      console.log('   • Sei network may be experiencing issues');
      console.log('   • Try again in a few minutes');
    }

    if (!Object.values(results.wallets).some(w => w)) {
      console.log('👛 Wallet Issues:');
      console.log('   • Install wallet extensions:');
      console.log('     - Keplr: https://keplr.app');
      console.log('     - Leap: https://leapwallet.io');
      console.log('     - MetaMask: https://metamask.io');
      console.log('   • Refresh page after installation');
    }

    if (!results.browser.compatible) {
      console.log('🌐 Browser Issues:');
      console.log('   • Use a modern browser (Chrome, Firefox, Safari, Edge)');
      console.log('   • Enable JavaScript');
      console.log('   • Some features may not work in older browsers');
    }

    console.log('\n🎯 QUICK FIXES');
    console.log('='.repeat(50));
    console.log('• Run backend: cd backend && npm run dev');
    console.log('• Install wallets and refresh page');
    console.log('• Test specific components: SeiMoneyQuickTest.runAllQuickTests()');
    console.log('• Network diagnostics: NetworkTester.runNetworkDiagnostics()');
  }

  // Test backend API connection
  static async testBackendConnection(): Promise<{
    available: boolean;
    responseTime?: number;
    error?: string;
    endpoints: Record<string, boolean>;
  }> {
    console.log('\n🔧 Testing Backend Connection...');
    
    const endpoints = {
      health: false,
      marketStats: false,
      transfers: false,
      vaults: false
    };

    let available = false;
    let responseTime: number | undefined;
    let error: string | undefined;

    try {
      const startTime = performance.now();
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      responseTime = performance.now() - startTime;
      
      if (response.ok) {
        available = true;
        endpoints.health = true;
        console.log(`  ✅ Health endpoint: ${responseTime.toFixed(0)}ms`);
        
        // Test other endpoints
        const testEndpoints = [
          { name: 'marketStats', url: '/api/v1/market/stats' },
          { name: 'transfers', url: '/api/v1/transfers' },
          { name: 'vaults', url: '/api/v1/vaults' }
        ];

        for (const endpoint of testEndpoints) {
          try {
            const endpointResponse = await fetch(`http://localhost:3001${endpoint.url}`, {
              signal: AbortSignal.timeout(3000)
            });
            endpoints[endpoint.name as keyof typeof endpoints] = endpointResponse.ok;
            console.log(`  ${endpointResponse.ok ? '✅' : '❌'} ${endpoint.name}: ${endpointResponse.status}`);
          } catch (endpointError) {
            console.log(`  ❌ ${endpoint.name}: Failed`);
          }
        }
      } else {
        error = `HTTP ${response.status}`;
        console.log(`  ❌ Backend responded with: ${response.status}`);
      }
    } catch (fetchError) {
      error = fetchError instanceof Error ? fetchError.message : 'Connection failed';
      console.log(`  ❌ Backend connection failed: ${error}`);
    }

    return { available, responseTime, error, endpoints };
  }

  // Test Sei network connectivity
  static async testSeiNetwork(): Promise<{
    mainnet: boolean;
    testnet: boolean;
    evm: boolean;
    details: any;
  }> {
    console.log('\n🌐 Testing Sei Network...');
    
    const results = {
      mainnet: false,
      testnet: false,
      evm: false,
      details: {} as any
    };

    // Test mainnet RPC
    try {
      const response = await fetch('https://rpc.sei-apis.com/status', {
        signal: AbortSignal.timeout(5000)
      });
      results.mainnet = response.ok;
      console.log(`  ${response.ok ? '✅' : '❌'} Mainnet RPC: ${response.status}`);
      
      if (response.ok) {
        results.details.mainnet = await response.json();
      }
    } catch (error) {
      console.log('  ❌ Mainnet RPC: Unreachable');
    }

    // Test testnet RPC
    try {
      const response = await fetch('https://rpc.atlantic-2.seinetwork.io/status', {
        signal: AbortSignal.timeout(5000)
      });
      results.testnet = response.ok;
      console.log(`  ${response.ok ? '✅' : '❌'} Testnet RPC: ${response.status}`);
    } catch (error) {
      console.log('  ❌ Testnet RPC: Unreachable');
    }

    // Test EVM RPC
    try {
      const response = await fetch('https://evm-rpc.sei-apis.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        }),
        signal: AbortSignal.timeout(5000)
      });
      results.evm = response.ok;
      console.log(`  ${response.ok ? '✅' : '❌'} EVM RPC: ${response.status}`);
      
      if (response.ok) {
        results.details.evm = await response.json();
      }
    } catch (error) {
      console.log('  ❌ EVM RPC: Unreachable');
    }

    return results;
  }

  // Test wallet availability
  static async testWalletAvailability(): Promise<{
    keplr: boolean;
    leap: boolean;
    metamask: boolean;
  }> {
    console.log('\n👛 Testing Wallet Availability...');
    
    const results = {
      keplr: !!(window as any).keplr,
      leap: !!(window as any).leap,
      metamask: !!(window as any).ethereum && (window as any).ethereum.isMetaMask
    };

    console.log(`  ${results.keplr ? '✅' : '❌'} Keplr: ${results.keplr ? 'Available' : 'Not installed'}`);
    console.log(`  ${results.leap ? '✅' : '❌'} Leap: ${results.leap ? 'Available' : 'Not installed'}`);
    console.log(`  ${results.metamask ? '✅' : '❌'} MetaMask: ${results.metamask ? 'Available' : 'Not installed'}`);

    return results;
  }

  // Test browser compatibility
  static testBrowserCompatibility(): {
    compatible: boolean;
    browser: string;
    version: string;
    features: Record<string, boolean>;
  } {
    console.log('\n🌐 Testing Browser Compatibility...');
    
    const userAgent = navigator.userAgent;
    const browser = this.detectBrowser(userAgent);
    const version = this.detectBrowserVersion(userAgent);
    
    const features = {
      fetch: typeof fetch !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      webCrypto: typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined',
      bigInt: typeof BigInt !== 'undefined',
      es6: typeof Symbol !== 'undefined',
      webAssembly: typeof WebAssembly !== 'undefined'
    };

    const compatible = Object.values(features).every(f => f);

    console.log(`  Browser: ${browser} ${version}`);
    Object.entries(features).forEach(([feature, supported]) => {
      console.log(`  ${supported ? '✅' : '❌'} ${feature}: ${supported ? 'Supported' : 'Not supported'}`);
    });

    return { compatible, browser, version, features };
  }

  private static detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private static detectBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  // Quick health check
  static async quickHealthCheck(): Promise<void> {
    console.log('⚡ Quick Health Check...');
    
    const checks = await Promise.allSettled([
      fetch('http://localhost:3001/health', { signal: AbortSignal.timeout(2000) }),
      fetch('https://rpc.sei-apis.com/status', { signal: AbortSignal.timeout(2000) })
    ]);

    const backend = checks[0].status === 'fulfilled' && checks[0].value.ok;
    const sei = checks[1].status === 'fulfilled' && checks[1].value.ok;
    const wallets = !!(window as any).keplr || !!(window as any).leap || !!(window as any).ethereum;

    console.log(`Backend: ${backend ? '✅' : '❌'}`);
    console.log(`Sei Network: ${sei ? '✅' : '❌'}`);
    console.log(`Wallets: ${wallets ? '✅' : '❌'}`);

    if (backend && sei && wallets) {
      console.log('🎉 All systems operational!');
    } else {
      console.log('⚠️ Some issues detected. Run ConnectionDiagnostics.runFullDiagnostics() for details.');
    }
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).ConnectionDiagnostics = ConnectionDiagnostics;
  console.log('🔍 Connection Diagnostics loaded!');
  console.log('Commands:');
  console.log('  ConnectionDiagnostics.runFullDiagnostics() - Full diagnostic report');
  console.log('  ConnectionDiagnostics.quickHealthCheck() - Quick status check');
}