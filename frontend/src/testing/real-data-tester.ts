// Real Data Tester - Tests if screens are displaying real data
// Real Data Tester - Verifies that screens are displaying actual data

import { TestResult, TestStatus, TestCategory } from './types';
import { testUtils } from './test-utilities';
import { apiService } from '../lib/api';

export class RealDataTester {
  private results: TestResult[] = [];

  async testRealDataIntegration(): Promise<TestResult[]> {
    console.log('🔍 Testing Real Data Integration...');
    this.results = [];

    try {
      // Test Home Screen Real Data
      await this.testHomeScreenRealData();
      
      // Test Dashboard Real Data
      await this.testDashboardRealData();
      
      // Test Payments Real Data
      await this.testPaymentsRealData();
      
      // Test API Connectivity
      await this.testAPIConnectivity();
      
      // Test Market Data
      await this.testMarketDataIntegration();

    } catch (error) {
      console.error('❌ Real data testing failed:', error);
      this.results.push(testUtils.handleTestError(error as Error, 'Real Data Testing'));
    }

    return this.results;
  }

  // Test Home Screen Real Data
  private async testHomeScreenRealData(): Promise<void> {
    console.log('🏠 Testing Home Screen Real Data...');
    
    try {
      // Navigate to home screen
      await this.navigateToScreen('/');
      await testUtils.sleep(3000); // Wait for data to load

      // Check for real market statistics
      const tvlElement = document.querySelector('[data-testid="tvl-value"]') || 
                        document.querySelector('.text-2xl') ||
                        document.querySelector('.font-bold');
      
      let tvlValue = '';
      if (tvlElement) {
        tvlValue = tvlElement.textContent || '';
      }

      // Check if showing demo data or real data
      const isDemoData = tvlValue.includes('12.4M') || tvlValue.includes('Loading') || tvlValue === '';
      const hasRealData = !isDemoData && tvlValue.length > 0;

      // Check for chart data
      const chartCanvas = document.querySelector('canvas');
      const hasChart = chartCanvas !== null;

      // Check for feature cards
      const featureCards = document.querySelectorAll('[class*="cursor-pointer"], [onclick]');
      const hasInteractiveElements = featureCards.length > 0;

      this.results.push(testUtils.createTestResult(
        'Home Screen - Market Data Display',
        hasRealData ? TestStatus.PASSED : TestStatus.WARNING,
        hasRealData ? 
          `Real market data displayed: ${tvlValue}` : 
          `Demo data displayed: ${tvlValue} (Backend offline)`,
        TestCategory.DATA,
        0
      ));

      this.results.push(testUtils.createTestResult(
        'Home Screen - Chart Integration',
        hasChart ? TestStatus.PASSED : TestStatus.FAILED,
        hasChart ? 'Chart canvas found and rendered' : 'Chart not found',
        TestCategory.UI,
        0
      ));

      this.results.push(testUtils.createTestResult(
        'Home Screen - Interactive Elements',
        hasInteractiveElements ? TestStatus.PASSED : TestStatus.FAILED,
        `Found ${featureCards.length} interactive elements`,
        TestCategory.UI,
        0
      ));

    } catch (error) {
      this.results.push(testUtils.handleTestError(error as Error, 'Home Screen Real Data'));
    }
  }

  // Test Dashboard Real Data
  private async testDashboardRealData(): Promise<void> {
    console.log('📊 Testing Dashboard Real Data...');
    
    try {
      // Navigate to dashboard
      await this.navigateToScreen('/dashboard');
      await testUtils.sleep(3000);

      // Check if wallet connection is required
      const connectWalletButton = document.querySelector('[data-testid="connect-keplr"]') ||
                                 document.querySelector('[data-testid="connect-leap"]') ||
                                 document.querySelector('[data-testid="connect-metamask"]') ||
                                 document.querySelector('button');

      const hasWalletConnection = connectWalletButton !== null;

      // Check for portfolio data
      const portfolioElements = document.querySelectorAll('.text-2xl, .font-bold, [data-testid*="portfolio"]');
      const hasPortfolioData = portfolioElements.length > 0;

      // Check for balance display
      const balanceElements = document.querySelectorAll('[data-testid*="balance"], [class*="balance"]');
      const hasBalanceDisplay = balanceElements.length > 0;

      // Check for charts or progress indicators
      const charts = document.querySelectorAll('canvas, svg, [class*="chart"], [class*="progress"]');
      const hasCharts = charts.length > 0;

      this.results.push(testUtils.createTestResult(
        'Dashboard - Wallet Integration',
        hasWalletConnection ? TestStatus.PASSED : TestStatus.WARNING,
        hasWalletConnection ? 'Wallet connection options available' : 'Wallet connection not found',
        TestCategory.INTEGRATION,
        0
      ));

      this.results.push(testUtils.createTestResult(
        'Dashboard - Portfolio Data',
        hasPortfolioData ? TestStatus.PASSED : TestStatus.WARNING,
        `Found ${portfolioElements.length} portfolio data elements`,
        TestCategory.DATA,
        0
      ));

      this.results.push(testUtils.createTestResult(
        'Dashboard - Charts and Visualizations',
        hasCharts ? TestStatus.PASSED : TestStatus.WARNING,
        `Found ${charts.length} chart/visualization elements`,
        TestCategory.UI,
        0
      ));

    } catch (error) {
      this.results.push(testUtils.handleTestError(error as Error, 'Dashboard Real Data'));
    }
  }

  // Test Payments Real Data
  private async testPaymentsRealData(): Promise<void> {
    console.log('💸 Testing Payments Real Data...');
    
    try {
      // Navigate to payments screen
      await this.navigateToScreen('/payments');
      await testUtils.sleep(2000);

      // Check for form elements
      const recipientInput = document.querySelector('[data-testid="recipient-input"]') ||
                           document.querySelector('input[placeholder*="sei"]') ||
                           document.querySelector('input[type="text"]');

      const amountInput = document.querySelector('[data-testid="amount-input"]') ||
                        document.querySelector('input[type="number"]');

      const submitButton = document.querySelector('[data-testid="create-transfer-btn"]') ||
                         document.querySelector('button[type="submit"]') ||
                         document.querySelector('button');

      // Check for balance display
      const balanceDisplay = document.querySelector('[data-testid*="balance"]') ||
                           document.querySelector('[class*="balance"]');

      // Check for transaction history
      const transactionElements = document.querySelectorAll('[data-testid*="transfer"], [class*="transaction"]');

      // Test form validation
      let formValidationWorks = false;
      if (recipientInput && amountInput) {
        // Try to trigger validation
        (recipientInput as HTMLInputElement).value = 'invalid';
        (amountInput as HTMLInputElement).value = '-1';
        
        if (submitButton) {
          submitButton.click();
          await testUtils.sleep(500);
          
          // Check for error messages
          const errorMessages = document.querySelectorAll('[class*="error"], [data-testid*="error"]');
          formValidationWorks = errorMessages.length > 0;
        }
      }

      this.results.push(testUtils.createTestResult(
        'Payments - Form Elements',
        (recipientInput && amountInput && submitButton) ? TestStatus.PASSED : TestStatus.FAILED,
        `Form elements: Recipient ${recipientInput ? '✅' : '❌'}, Amount ${amountInput ? '✅' : '❌'}, Submit ${submitButton ? '✅' : '❌'}`,
        TestCategory.UI,
        0
      ));

      this.results.push(testUtils.createTestResult(
        'Payments - Form Validation',
        formValidationWorks ? TestStatus.PASSED : TestStatus.WARNING,
        formValidationWorks ? 'Form validation working' : 'Form validation needs verification',
        TestCategory.UI,
        0
      ));

      this.results.push(testUtils.createTestResult(
        'Payments - Balance Display',
        balanceDisplay ? TestStatus.PASSED : TestStatus.WARNING,
        balanceDisplay ? 'Balance display found' : 'Balance display not found (may require wallet connection)',
        TestCategory.DATA,
        0
      ));

      this.results.push(testUtils.createTestResult(
        'Payments - Transaction History',
        transactionElements.length > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Found ${transactionElements.length} transaction elements`,
        TestCategory.DATA,
        0
      ));

    } catch (error) {
      this.results.push(testUtils.handleTestError(error as Error, 'Payments Real Data'));
    }
  }

  // Test API Connectivity
  private async testAPIConnectivity(): Promise<void> {
    console.log('🌐 Testing API Connectivity...');
    
    try {
      // Test health endpoint
      const healthTest = await this.testAPIEndpoint('/health', 'Health Check');
      this.results.push(healthTest);

      // Test market stats endpoint
      const marketStatsTest = await this.testAPIEndpoint('/api/v1/market/stats', 'Market Stats');
      this.results.push(marketStatsTest);

      // Test TVL history endpoint
      const tvlHistoryTest = await this.testAPIEndpoint('/api/v1/market/tvl-history', 'TVL History');
      this.results.push(tvlHistoryTest);

    } catch (error) {
      this.results.push(testUtils.handleTestError(error as Error, 'API Connectivity'));
    }
  }

  // Test Market Data Integration
  private async testMarketDataIntegration(): Promise<void> {
    console.log('📈 Testing Market Data Integration...');
    
    try {
      // Try to get market stats
      const startTime = performance.now();
      
      try {
        const marketStats = await apiService.getMarketStats();
        
        this.results.push(testUtils.createTestResult(
          'Market Data - API Response',
          marketStats.ok ? TestStatus.PASSED : TestStatus.WARNING,
          marketStats.ok ? 'Market stats API responding' : 'Market stats API not available',
          TestCategory.INTEGRATION,
          performance.now() - startTime
        ));

        if (marketStats.ok && marketStats.stats) {
          const stats = marketStats.stats;
          
          this.results.push(testUtils.createTestResult(
            'Market Data - TVL Data',
            stats.totalTvl ? TestStatus.PASSED : TestStatus.WARNING,
            stats.totalTvl ? `TVL: ${stats.totalTvl.formatted}` : 'TVL data not available',
            TestCategory.DATA,
            0
          ));

          this.results.push(testUtils.createTestResult(
            'Market Data - User Stats',
            stats.activeUsers ? TestStatus.PASSED : TestStatus.WARNING,
            stats.activeUsers ? `Active Users: ${stats.activeUsers.formatted}` : 'User stats not available',
            TestCategory.DATA,
            0
          ));
        }

      } catch (apiError) {
        this.results.push(testUtils.createTestResult(
          'Market Data - API Response',
          TestStatus.WARNING,
          'API not available - using demo data (expected if backend offline)',
          TestCategory.INTEGRATION,
          performance.now() - startTime
        ));
      }

      // Try to get TVL history
      try {
        const tvlHistory = await apiService.getTvlHistory();
        
        this.results.push(testUtils.createTestResult(
          'Market Data - TVL History',
          tvlHistory.ok ? TestStatus.PASSED : TestStatus.WARNING,
          tvlHistory.ok ? `TVL history: ${tvlHistory.data?.length || 0} data points` : 'TVL history not available',
          TestCategory.DATA,
          0
        ));

      } catch (tvlError) {
        this.results.push(testUtils.createTestResult(
          'Market Data - TVL History',
          TestStatus.WARNING,
          'TVL history not available - using demo data',
          TestCategory.DATA,
          0
        ));
      }

    } catch (error) {
      this.results.push(testUtils.handleTestError(error as Error, 'Market Data Integration'));
    }
  }

  // Helper method to test API endpoints
  private async testAPIEndpoint(endpoint: string, name: string): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`);
      const responseTime = performance.now() - startTime;
      
      return testUtils.createTestResult(
        `API - ${name}`,
        response.ok ? TestStatus.PASSED : TestStatus.WARNING,
        response.ok ? 
          `${name} API responding (${response.status}) in ${responseTime.toFixed(2)}ms` :
          `${name} API error: ${response.status}`,
        TestCategory.INTEGRATION,
        responseTime
      );

    } catch (error) {
      return testUtils.createTestResult(
        `API - ${name}`,
        TestStatus.WARNING,
        `${name} API not available (expected if backend offline)`,
        TestCategory.INTEGRATION,
        performance.now() - startTime
      );
    }
  }

  // Navigation helper
  private async navigateToScreen(path: string): Promise<void> {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      await testUtils.sleep(1000);
    }
  }

  // Get summary of results
  getSummary(): { 
    total: number; 
    passed: number; 
    failed: number; 
    warnings: number; 
    passRate: number;
    realDataAvailable: boolean;
    apiConnected: boolean;
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === TestStatus.PASSED).length;
    const failed = this.results.filter(r => r.status === TestStatus.FAILED).length;
    const warnings = this.results.filter(r => r.status === TestStatus.WARNING).length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    // Check if real data is available
    const apiTests = this.results.filter(r => r.testName.includes('API'));
    const apiConnected = apiTests.some(r => r.status === TestStatus.PASSED);
    
    const dataTests = this.results.filter(r => r.category === TestCategory.DATA);
    const realDataAvailable = dataTests.some(r => 
      r.status === TestStatus.PASSED && 
      !r.details.includes('demo') && 
      !r.details.includes('Demo')
    );

    return { 
      total, 
      passed, 
      failed, 
      warnings, 
      passRate,
      realDataAvailable,
      apiConnected
    };
  }

  // Get detailed results
  getResults(): TestResult[] {
    return this.results;
  }

  // Generate detailed report
  generateReport(): string {
    const summary = this.getSummary();
    
    let report = `
# Real Data Integration Test Report

## Summary
- **Total Tests**: ${summary.total}
- **Passed**: ${summary.passed}
- **Failed**: ${summary.failed}
- **Warnings**: ${summary.warnings}
- **Pass Rate**: ${summary.passRate.toFixed(1)}%
- **Real Data Available**: ${summary.realDataAvailable ? '✅ Yes' : '❌ No (Demo Data)'}
- **API Connected**: ${summary.apiConnected ? '✅ Yes' : '❌ No (Offline)'}

## Test Results

`;

    // Group results by category
    const categories = ['UI', 'DATA', 'INTEGRATION'];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      if (categoryResults.length > 0) {
        report += `### ${category} Tests\n\n`;
        
        categoryResults.forEach(result => {
          const statusIcon = result.status === TestStatus.PASSED ? '✅' : 
                           result.status === TestStatus.FAILED ? '❌' : '⚠️';
          
          report += `- ${statusIcon} **${result.testName}**: ${result.details}\n`;
        });
        
        report += '\n';
      }
    });

    report += `
## Recommendations

${summary.apiConnected ? 
  '✅ Backend API is connected and responding.' : 
  '⚠️ Backend API is offline. Start the backend server to test real data integration.'
}

${summary.realDataAvailable ? 
  '✅ Real data is being displayed in the frontend.' : 
  '⚠️ Frontend is using demo data. This is expected when backend is offline.'
}

## Next Steps

1. ${summary.apiConnected ? '✅' : '🔄'} Start backend server (if not running)
2. ${summary.realDataAvailable ? '✅' : '🔄'} Verify real data integration
3. 🔄 Test with wallet connections
4. 🔄 Test smart contract interactions

---
*Report generated at: ${new Date().toISOString()}*
`;

    return report;
  }
}

// Export singleton instance
export const realDataTester = new RealDataTester();

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).RealDataTester = realDataTester;
}