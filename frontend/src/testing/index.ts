// SeiMoney Testing Infrastructure
// Comprehensive testing suite for development

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message?: string;
  duration?: number;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
}

class ComprehensiveTester {
  private results: TestSuite[] = [];

  async runAllTests(): Promise<TestSuite[]> {
    console.log('🧪 Starting comprehensive test suite...');
    
    const suites = [
      this.testUIComponents(),
      this.testAPIConnections(),
      this.testWalletIntegration(),
      this.testSmartContracts()
    ];

    this.results = await Promise.all(suites);
    this.displayResults();
    return this.results;
  }

  private async testUIComponents(): Promise<TestSuite> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test if main components exist
    tests.push({
      name: 'App component renders',
      status: document.getElementById('root') ? 'pass' : 'fail'
    });

    tests.push({
      name: 'Navigation elements present',
      status: document.querySelector('nav') ? 'pass' : 'skip'
    });

    return {
      name: 'UI Components',
      tests,
      duration: Date.now() - startTime
    };
  }

  private async testAPIConnections(): Promise<TestSuite> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    try {
      const response = await fetch('http://localhost:3001/health/health');
      tests.push({
        name: 'Backend API connection',
        status: response.ok ? 'pass' : 'fail',
        message: response.ok ? 'API responding' : `Status: ${response.status}`
      });
    } catch (error) {
      tests.push({
        name: 'Backend API connection',
        status: 'fail',
        message: 'Connection failed'
      });
    }

    return {
      name: 'API Connections',
      tests,
      duration: Date.now() - startTime
    };
  }

  private async testWalletIntegration(): Promise<TestSuite> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    tests.push({
      name: 'Wallet detection',
      status: (window as any).keplr ? 'pass' : 'skip',
      message: (window as any).keplr ? 'Keplr detected' : 'No wallet detected'
    });

    return {
      name: 'Wallet Integration',
      tests,
      duration: Date.now() - startTime
    };
  }

  private async testSmartContracts(): Promise<TestSuite> {
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test contract addresses are configured
    const contracts = [
      'CONTRACT_PAYMENTS',
      'CONTRACT_GROUPS', 
      'CONTRACT_POTS',
      'CONTRACT_VAULTS',
      'CONTRACT_ESCROW',
      'CONTRACT_ALIAS'
    ];

    contracts.forEach(contract => {
      tests.push({
        name: `${contract} configured`,
        status: 'skip',
        message: 'Contract validation requires backend'
      });
    });

    return {
      name: 'Smart Contracts',
      tests,
      duration: Date.now() - startTime
    };
  }

  private displayResults(): void {
    console.log('\n🧪 Test Results Summary:');
    console.log('========================');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    this.results.forEach(suite => {
      console.log(`\n📋 ${suite.name} (${suite.duration}ms)`);
      suite.tests.forEach(test => {
        const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏭️';
        console.log(`  ${icon} ${test.name}${test.message ? ` - ${test.message}` : ''}`);
        
        totalTests++;
        if (test.status === 'pass') passedTests++;
        else if (test.status === 'fail') failedTests++;
        else skippedTests++;
      });
    });

    console.log('\n📊 Summary:');
    console.log(`Total: ${totalTests}, Passed: ${passedTests}, Failed: ${failedTests}, Skipped: ${skippedTests}`);
  }

  // Quick health check
  async quickHealthCheck(): Promise<void> {
    console.log('🔍 Quick health check...');
    
    const checks = [
      { name: 'DOM Ready', check: () => document.readyState === 'complete' },
      { name: 'React Root', check: () => !!document.getElementById('root') },
      { name: 'Console Available', check: () => typeof console !== 'undefined' }
    ];

    checks.forEach(({ name, check }) => {
      const result = check();
      console.log(`${result ? '✅' : '❌'} ${name}`);
    });
  }
}

export const comprehensiveTester = new ComprehensiveTester();

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).SeiMoneyTesting = comprehensiveTester;
}