// Network Testing Utilities
// Test network connectivity and API endpoints

interface NetworkTest {
  name: string;
  url: string;
  method?: string;
  expectedStatus?: number;
}

class NetworkTester {
  private readonly tests: NetworkTest[] = [
    {
      name: 'Backend Health Check',
      url: 'http://localhost:3001/health/health',
      expectedStatus: 200
    },
    {
      name: 'Backend API Docs',
      url: 'http://localhost:3001/docs',
      expectedStatus: 200
    },
    {
      name: 'Sei Network RPC',
      url: 'https://rpc.atlantic-2.seinetwork.io:443/status',
      expectedStatus: 200
    }
  ];

  async runNetworkDiagnostics(): Promise<void> {
    console.log('🌐 Running network diagnostics...');
    console.log('================================');

    for (const test of this.tests) {
      await this.runSingleTest(test);
    }

    console.log('\n✅ Network diagnostics complete');
  }

  private async runSingleTest(test: NetworkTest): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(test.url, {
        method: test.method || 'GET',
        mode: 'cors'
      });
      
      const duration = Date.now() - startTime;
      const status = response.status;
      const expected = test.expectedStatus || 200;
      
      if (status === expected) {
        console.log(`✅ ${test.name} - ${status} (${duration}ms)`);
      } else {
        console.log(`⚠️ ${test.name} - Expected ${expected}, got ${status} (${duration}ms)`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ ${test.name} - Failed: ${error} (${duration}ms)`);
    }
  }

  async testBackendConnection(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/health/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  async testSeiNetwork(): Promise<boolean> {
    try {
      const response = await fetch('https://rpc.atlantic-2.seinetwork.io:443/status');
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const networkTester = new NetworkTester();

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).NetworkTester = networkTester;
}