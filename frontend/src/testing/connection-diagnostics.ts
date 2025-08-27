// Connection Diagnostics
// Comprehensive connection testing and diagnostics

interface DiagnosticResult {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

class ConnectionDiagnostics {
  async quickHealthCheck(): Promise<DiagnosticResult[]> {
    console.log('🔍 Running quick health check...');
    
    const results: DiagnosticResult[] = [];
    
    // Check frontend
    results.push({
      component: 'Frontend',
      status: 'healthy',
      message: 'React app loaded successfully'
    });

    // Check backend connection
    try {
      const response = await fetch('http://localhost:3001/health/health', {
        method: 'GET',
        timeout: 5000
      } as any);
      
      if (response.ok) {
        results.push({
          component: 'Backend API',
          status: 'healthy',
          message: 'Backend responding normally'
        });
      } else {
        results.push({
          component: 'Backend API',
          status: 'warning',
          message: `Backend returned status ${response.status}`
        });
      }
    } catch (error) {
      results.push({
        component: 'Backend API',
        status: 'error',
        message: 'Cannot connect to backend',
        details: error
      });
    }

    // Check wallet
    if ((window as any).keplr) {
      results.push({
        component: 'Wallet',
        status: 'healthy',
        message: 'Keplr wallet detected'
      });
    } else {
      results.push({
        component: 'Wallet',
        status: 'warning',
        message: 'No wallet detected'
      });
    }

    // Check Sei network
    try {
      const response = await fetch('https://rpc.atlantic-2.seinetwork.io:443/status');
      if (response.ok) {
        results.push({
          component: 'Sei Network',
          status: 'healthy',
          message: 'Sei testnet accessible'
        });
      } else {
        results.push({
          component: 'Sei Network',
          status: 'warning',
          message: 'Sei network connection issues'
        });
      }
    } catch (error) {
      results.push({
        component: 'Sei Network',
        status: 'error',
        message: 'Cannot reach Sei network',
        details: error
      });
    }

    this.displayResults(results);
    return results;
  }

  private displayResults(results: DiagnosticResult[]): void {
    console.log('\n🏥 Health Check Results:');
    console.log('========================');
    
    results.forEach(result => {
      const icon = result.status === 'healthy' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${result.component}: ${result.message}`);
      if (result.details) {
        console.log(`   Details:`, result.details);
      }
    });

    const healthy = results.filter(r => r.status === 'healthy').length;
    const total = results.length;
    console.log(`\n📊 Overall: ${healthy}/${total} components healthy`);
  }

  async fullDiagnostics(): Promise<void> {
    console.log('🔬 Running full diagnostics...');
    
    await this.quickHealthCheck();
    
    // Additional detailed checks
    console.log('\n🔍 Detailed Checks:');
    console.log('==================');
    
    // Check localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      console.log('✅ LocalStorage: Working');
    } catch {
      console.log('❌ LocalStorage: Not available');
    }

    // Check sessionStorage
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      console.log('✅ SessionStorage: Working');
    } catch {
      console.log('❌ SessionStorage: Not available');
    }

    // Check WebSocket support
    if (typeof WebSocket !== 'undefined') {
      console.log('✅ WebSocket: Supported');
    } else {
      console.log('❌ WebSocket: Not supported');
    }

    // Check crypto support
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      console.log('✅ Web Crypto API: Available');
    } else {
      console.log('❌ Web Crypto API: Not available');
    }
  }
}

export const connectionDiagnostics = new ConnectionDiagnostics();

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).ConnectionDiagnostics = connectionDiagnostics;
}