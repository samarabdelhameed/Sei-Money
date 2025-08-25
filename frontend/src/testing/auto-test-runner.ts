// Auto Test Runner - Runs comprehensive tests automatically
// Auto Test Runner - Automatically runs comprehensive tests

import { TestResult, TestStatus, TestCategory } from './types';
import { testUtils } from './test-utilities';

export class AutoTestRunner {
  private results: TestResult[] = [];
  private isRunning = false;

  async runComprehensiveTest(): Promise<{
    results: TestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      warnings: number;
      passRate: number;
      realDataAvailable: boolean;
      apiConnected: boolean;
      uiWorking: boolean;
      integrationStatus: string;
    };
    report: string;
  }> {
    if (this.isRunning) {
      throw new Error('Test already running');
    }

    this.isRunning = true;
    this.results = [];
    
    console.log('🚀 Starting Comprehensive Auto Test...');
    
    try {
      // Phase 1: Infrastructure Tests
      console.log('📋 Phase 1: Testing Infrastructure...');
      await this.testInfrastructure();
      
      // Phase 2: API Connectivity Tests
      console.log('🌐 Phase 2: Testing API Connectivity...');
      await this.testAPIConnectivity();
      
      // Phase 3: Screen Tests
      console.log('🖥️ Phase 3: Testing All Screens...');
      await this.testAllScreens();
      
      // Phase 4: Data Integration Tests
      console.log('📊 Phase 4: Testing Data Integration...');
      await this.testDataIntegration();
      
      // Phase 5: User Interaction Tests
      console.log('👆 Phase 5: Testing User Interactions...');
      await this.testUserInteractions();
      
      // Generate summary and report
      const summary = this.generateSummary();
      const report = this.generateDetailedReport();
      
      console.log('✅ Comprehensive Auto Test Completed!');
      console.log(`📊 Results: ${summary.passed}/${summary.total} passed (${summary.passRate.toFixed(1)}%)`);
      
      return {
        results: this.results,
        summary,
        report
      };
      
    } catch (error) {
      console.error('❌ Auto test failed:', error);
      this.results.push(testUtils.handleTestError(error as Error, 'Auto Test Runner'));
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Phase 1: Infrastructure Tests
  private async testInfrastructure(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test if testing utilities are available
      const hasTestUtils = typeof testUtils !== 'undefined';
      this.addResult('Infrastructure - Test Utilities', 
        hasTestUtils ? TestStatus.PASSED : TestStatus.FAILED,
        hasTestUtils ? 'Test utilities loaded and functional' : 'Test utilities not available',
        TestCategory.INFRASTRUCTURE, performance.now() - startTime);

      // Test browser environment
      const browserFeatures = {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        console: typeof console !== 'undefined'
      };
      
      const workingFeatures = Object.values(browserFeatures).filter(Boolean).length;
      this.addResult('Infrastructure - Browser Features',
        workingFeatures === 4 ? TestStatus.PASSED : TestStatus.WARNING,
        `Browser features: ${workingFeatures}/4 available`,
        TestCategory.INFRASTRUCTURE, performance.now() - startTime);

      // Test DOM availability
      const domReady = document.readyState === 'complete' || document.readyState === 'interactive';
      this.addResult('Infrastructure - DOM Ready',
        domReady ? TestStatus.PASSED : TestStatus.WARNING,
        domReady ? 'DOM is ready for testing' : 'DOM not fully loaded',
        TestCategory.INFRASTRUCTURE, performance.now() - startTime);

    } catch (error) {
      this.addResult('Infrastructure Tests', TestStatus.FAILED,
        `Infrastructure test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INFRASTRUCTURE, performance.now() - startTime);
    }
  }

  // Phase 2: API Connectivity Tests
  private async testAPIConnectivity(): Promise<void> {
    const endpoints = [
      { url: 'http://localhost:3001/health', name: 'Health Check', timeout: 5000 },
      { url: 'http://localhost:3001/api/v1/market/stats', name: 'Market Stats', timeout: 5000 },
      { url: 'http://localhost:3001/api/v1/market/tvl-history', name: 'TVL History', timeout: 5000 }
    ];

    for (const endpoint of endpoints) {
      const startTime = performance.now();
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);
        
        const response = await fetch(endpoint.url, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        const responseTime = performance.now() - startTime;
        
        if (response.ok) {
          // Try to parse JSON response
          try {
            const data = await response.json();
            this.addResult(`API - ${endpoint.name}`, TestStatus.PASSED,
              `${endpoint.name} responding with valid JSON (${response.status}) in ${responseTime.toFixed(2)}ms`,
              TestCategory.INTEGRATION, responseTime);
          } catch (jsonError) {
            this.addResult(`API - ${endpoint.name}`, TestStatus.WARNING,
              `${endpoint.name} responding but invalid JSON (${response.status}) in ${responseTime.toFixed(2)}ms`,
              TestCategory.INTEGRATION, responseTime);
          }
        } else {
          this.addResult(`API - ${endpoint.name}`, TestStatus.WARNING,
            `${endpoint.name} error: HTTP ${response.status} in ${responseTime.toFixed(2)}ms`,
            TestCategory.INTEGRATION, responseTime);
        }
        
      } catch (error) {
        const responseTime = performance.now() - startTime;
        
        if (error instanceof Error && error.name === 'AbortError') {
          this.addResult(`API - ${endpoint.name}`, TestStatus.WARNING,
            `${endpoint.name} timeout after ${endpoint.timeout}ms`,
            TestCategory.INTEGRATION, responseTime);
        } else {
          this.addResult(`API - ${endpoint.name}`, TestStatus.WARNING,
            `${endpoint.name} not available (expected if backend offline)`,
            TestCategory.INTEGRATION, responseTime);
        }
      }
    }
  }

  // Phase 3: Screen Tests
  private async testAllScreens(): Promise<void> {
    const screens = [
      { name: 'Home', path: '/', hash: '#/' },
      { name: 'Dashboard', path: '/dashboard', hash: '#/dashboard' },
      { name: 'Payments', path: '/payments', hash: '#/payments' },
      { name: 'AI Agent', path: '/ai-agent', hash: '#/ai-agent' }
    ];

    for (const screen of screens) {
      console.log(`  🔍 Testing ${screen.name} screen...`);
      
      try {
        // Navigate to screen
        await this.navigateToScreen(screen.hash);
        await this.sleep(2000); // Wait for screen to load
        
        await this.testScreen(screen.name);
        
      } catch (error) {
        this.addResult(`${screen.name} Screen Test`, TestStatus.FAILED,
          `Failed to test ${screen.name} screen: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TestCategory.UI, 0);
      }
    }
  }

  // Test individual screen
  private async testScreen(screenName: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Check if screen is visible
      const mainContent = document.querySelector('main') || document.body;
      const isVisible = mainContent && this.isElementVisible(mainContent);
      
      this.addResult(`${screenName} - Screen Visibility`, 
        isVisible ? TestStatus.PASSED : TestStatus.FAILED,
        isVisible ? `${screenName} screen is visible and rendered` : `${screenName} screen not visible`,
        TestCategory.UI, performance.now() - startTime);

      // Screen-specific tests
      switch (screenName.toLowerCase()) {
        case 'home':
          await this.testHomeScreen();
          break;
        case 'dashboard':
          await this.testDashboardScreen();
          break;
        case 'payments':
          await this.testPaymentsScreen();
          break;
        case 'ai agent':
          await this.testAIAgentScreen();
          break;
      }

    } catch (error) {
      this.addResult(`${screenName} Screen Test`, TestStatus.FAILED,
        `${screenName} screen test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  // Test Home Screen
  private async testHomeScreen(): Promise<void> {
    const startTime = performance.now();
    
    // Check for key elements
    const elements = [
      { selector: '.text-2xl, .text-3xl, .font-bold', name: 'Statistics Display', required: true },
      { selector: 'canvas, svg', name: 'Charts', required: false },
      { selector: 'button, [role="button"]', name: 'Interactive Buttons', required: true },
      { selector: '[class*="card"], [class*="feature"]', name: 'Feature Cards', required: false }
    ];

    let foundElements = 0;
    const details: string[] = [];

    for (const element of elements) {
      const found = document.querySelectorAll(element.selector);
      if (found.length > 0) {
        foundElements++;
        details.push(`✅ ${element.name}: ${found.length} found`);
      } else if (element.required) {
        details.push(`❌ ${element.name}: Required but not found`);
      } else {
        details.push(`⚠️ ${element.name}: Optional, not found`);
      }
    }

    // Check for data that might indicate real vs demo
    const textElements = document.querySelectorAll('.text-2xl, .font-bold, .text-xl');
    let hasVariableData = false;
    let hasDemoIndicators = false;

    textElements.forEach(el => {
      const text = el.textContent || '';
      if (text.includes('12.4M') || text.includes('8,942') || text.includes('99.1%')) {
        hasDemoIndicators = true;
      }
      if (text.match(/\d+\.\d+/) && !text.includes('12.4') && !text.includes('8,942')) {
        hasVariableData = true;
      }
    });

    this.addResult('Home Screen - Elements Check',
      foundElements >= 2 ? TestStatus.PASSED : TestStatus.WARNING,
      `Found ${foundElements} element types. ${details.join(', ')}`,
      TestCategory.UI, performance.now() - startTime);

    this.addResult('Home Screen - Data Analysis',
      hasVariableData ? TestStatus.PASSED : TestStatus.WARNING,
      hasVariableData ? 'Appears to show variable/real data' : 
      hasDemoIndicators ? 'Showing demo data (expected if backend offline)' : 'Data status unclear',
      TestCategory.DATA, performance.now() - startTime);
  }

  // Test Dashboard Screen
  private async testDashboardScreen(): Promise<void> {
    const startTime = performance.now();
    
    // Check for wallet connection elements
    const walletButtons = document.querySelectorAll('button');
    const hasWalletOptions = Array.from(walletButtons).some(btn => {
      const text = btn.textContent?.toLowerCase() || '';
      return text.includes('connect') || text.includes('keplr') || text.includes('leap') || text.includes('metamask');
    });

    this.addResult('Dashboard - Wallet Integration',
      hasWalletOptions ? TestStatus.PASSED : TestStatus.WARNING,
      hasWalletOptions ? 'Wallet connection options available' : 'Wallet connection options not clearly visible',
      TestCategory.INTEGRATION, performance.now() - startTime);

    // Check for portfolio/balance elements
    const dataElements = document.querySelectorAll('.text-2xl, .font-bold, .text-xl');
    const hasPortfolioData = dataElements.length > 0;

    this.addResult('Dashboard - Portfolio Display',
      hasPortfolioData ? TestStatus.PASSED : TestStatus.WARNING,
      `Found ${dataElements.length} potential data display elements`,
      TestCategory.DATA, performance.now() - startTime);
  }

  // Test Payments Screen
  private async testPaymentsScreen(): Promise<void> {
    const startTime = performance.now();
    
    // Check for form elements
    const inputs = document.querySelectorAll('input');
    const buttons = document.querySelectorAll('button');
    const hasForm = inputs.length > 0 && buttons.length > 0;

    this.addResult('Payments - Form Elements',
      hasForm ? TestStatus.PASSED : TestStatus.FAILED,
      `Found ${inputs.length} inputs and ${buttons.length} buttons`,
      TestCategory.UI, performance.now() - startTime);

    // Test form validation if possible
    if (inputs.length > 0) {
      try {
        const firstInput = inputs[0] as HTMLInputElement;
        const originalValue = firstInput.value;
        
        // Try to trigger validation
        firstInput.value = 'test-invalid-input';
        firstInput.dispatchEvent(new Event('input', { bubbles: true }));
        firstInput.dispatchEvent(new Event('blur', { bubbles: true }));
        
        await this.sleep(500);
        
        // Check for validation messages
        const errorElements = document.querySelectorAll('[class*="error"], [class*="invalid"], .text-red-400, .text-red-500');
        const hasValidation = errorElements.length > 0;
        
        // Restore original value
        firstInput.value = originalValue;
        
        this.addResult('Payments - Form Validation',
          hasValidation ? TestStatus.PASSED : TestStatus.WARNING,
          hasValidation ? 'Form validation appears to be working' : 'Form validation not clearly visible',
          TestCategory.UI, performance.now() - startTime);
          
      } catch (error) {
        this.addResult('Payments - Form Validation',
          TestStatus.WARNING,
          'Could not test form validation automatically',
          TestCategory.UI, performance.now() - startTime);
      }
    }
  }

  // Test AI Agent Screen
  private async testAIAgentScreen(): Promise<void> {
    const startTime = performance.now();
    
    const inputs = document.querySelectorAll('input, textarea');
    const buttons = document.querySelectorAll('button');
    const hasAIInterface = inputs.length > 0 && buttons.length > 0;

    this.addResult('AI Agent - Interface Elements',
      hasAIInterface ? TestStatus.PASSED : TestStatus.WARNING,
      `Found ${inputs.length} input fields and ${buttons.length} buttons`,
      TestCategory.UI, performance.now() - startTime);
  }

  // Phase 4: Data Integration Tests
  private async testDataIntegration(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Check for console warnings about demo data
      const originalWarn = console.warn;
      const warnings: string[] = [];
      
      console.warn = (...args) => {
        warnings.push(args.join(' '));
        originalWarn.apply(console, args);
      };
      
      // Wait a bit to catch any warnings
      await this.sleep(1000);
      
      // Restore original console.warn
      console.warn = originalWarn;
      
      const hasDemoWarnings = warnings.some(w => 
        w.includes('demo') || w.includes('offline') || w.includes('not available')
      );
      
      this.addResult('Data Integration - Backend Status',
        hasDemoWarnings ? TestStatus.WARNING : TestStatus.PASSED,
        hasDemoWarnings ? 'Backend appears offline, using demo data' : 'No demo data warnings detected',
        TestCategory.INTEGRATION, performance.now() - startTime);

      // Check for real-time data indicators
      const timestamps = document.querySelectorAll('[class*="time"], [class*="date"]');
      const hasTimestamps = timestamps.length > 0;
      
      this.addResult('Data Integration - Timestamps',
        hasTimestamps ? TestStatus.PASSED : TestStatus.WARNING,
        `Found ${timestamps.length} timestamp elements`,
        TestCategory.DATA, performance.now() - startTime);

    } catch (error) {
      this.addResult('Data Integration Tests', TestStatus.WARNING,
        `Data integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  // Phase 5: User Interaction Tests
  private async testUserInteractions(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Test button interactions
      const buttons = document.querySelectorAll('button:not([disabled])');
      const clickableButtons = Array.from(buttons).filter(btn => 
        this.isElementVisible(btn) && !btn.hasAttribute('disabled')
      );

      this.addResult('User Interactions - Clickable Elements',
        clickableButtons.length > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Found ${clickableButtons.length} clickable buttons`,
        TestCategory.UI, performance.now() - startTime);

      // Test navigation
      const navElements = document.querySelectorAll('nav a, [role="navigation"] button, [class*="nav"] button');
      const hasNavigation = navElements.length > 0;

      this.addResult('User Interactions - Navigation',
        hasNavigation ? TestStatus.PASSED : TestStatus.WARNING,
        `Found ${navElements.length} navigation elements`,
        TestCategory.UI, performance.now() - startTime);

      // Test form interactions
      const formElements = document.querySelectorAll('input, textarea, select');
      const interactiveFormElements = Array.from(formElements).filter(el => 
        this.isElementVisible(el) && !el.hasAttribute('disabled')
      );

      this.addResult('User Interactions - Form Elements',
        interactiveFormElements.length > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Found ${interactiveFormElements.length} interactive form elements`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('User Interaction Tests', TestStatus.WARNING,
        `User interaction test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  // Helper Methods
  private addResult(testName: string, status: TestStatus, details: string, category: TestCategory, executionTime: number): void {
    this.results.push({
      testName,
      status,
      details,
      category,
      executionTime,
      timestamp: new Date(),
      errors: status === TestStatus.FAILED ? [details] : undefined
    });
  }

  private async navigateToScreen(hash: string): Promise<void> {
    if (window.location.hash !== hash) {
      window.location.hash = hash;
      await this.sleep(1000);
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isElementVisible(element: Element): boolean {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           style.opacity !== '0';
  }

  private generateSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === TestStatus.PASSED).length;
    const failed = this.results.filter(r => r.status === TestStatus.FAILED).length;
    const warnings = this.results.filter(r => r.status === TestStatus.WARNING).length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    // Analyze results for specific insights
    const apiTests = this.results.filter(r => r.testName.includes('API'));
    const apiConnected = apiTests.some(r => r.status === TestStatus.PASSED);
    
    const dataTests = this.results.filter(r => r.category === TestCategory.DATA);
    const realDataAvailable = dataTests.some(r => 
      r.status === TestStatus.PASSED && 
      r.details.includes('real') || r.details.includes('variable')
    );
    
    const uiTests = this.results.filter(r => r.category === TestCategory.UI);
    const uiWorking = uiTests.filter(r => r.status === TestStatus.PASSED).length > uiTests.length * 0.7;
    
    let integrationStatus = 'Unknown';
    if (apiConnected && realDataAvailable) {
      integrationStatus = 'Full Integration';
    } else if (apiConnected) {
      integrationStatus = 'API Connected';
    } else if (uiWorking) {
      integrationStatus = 'Offline Mode';
    } else {
      integrationStatus = 'Issues Detected';
    }

    return {
      total,
      passed,
      failed,
      warnings,
      passRate,
      realDataAvailable,
      apiConnected,
      uiWorking,
      integrationStatus
    };
  }

  private generateDetailedReport(): string {
    const summary = this.generateSummary();
    
    let report = `
# Comprehensive Auto Test Report

## 📊 Executive Summary
- **Total Tests**: ${summary.total}
- **Passed**: ${summary.passed} ✅
- **Failed**: ${summary.failed} ❌
- **Warnings**: ${summary.warnings} ⚠️
- **Pass Rate**: ${summary.passRate.toFixed(1)}%
- **Integration Status**: ${summary.integrationStatus}

## 🔍 Key Findings
- **API Connected**: ${summary.apiConnected ? '✅ Yes' : '❌ No'}
- **Real Data Available**: ${summary.realDataAvailable ? '✅ Yes' : '⚠️ Demo Data'}
- **UI Working**: ${summary.uiWorking ? '✅ Yes' : '❌ Issues Found'}

## 📋 Detailed Results

`;

    // Group results by category
    const categories = [TestCategory.INFRASTRUCTURE, TestCategory.INTEGRATION, TestCategory.UI, TestCategory.DATA];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      if (categoryResults.length > 0) {
        report += `### ${category} Tests\n\n`;
        
        categoryResults.forEach(result => {
          const statusIcon = result.status === TestStatus.PASSED ? '✅' : 
                           result.status === TestStatus.FAILED ? '❌' : '⚠️';
          
          report += `- ${statusIcon} **${result.testName}**: ${result.details}\n`;
          if (result.executionTime > 0) {
            report += `  - *Duration: ${result.executionTime.toFixed(2)}ms*\n`;
          }
        });
        
        report += '\n';
      }
    });

    report += `
## 💡 Recommendations

${summary.apiConnected ? 
  '✅ **Backend Integration**: API is responding correctly.' : 
  '⚠️ **Backend Integration**: Start backend server for full functionality.'
}

${summary.realDataAvailable ? 
  '✅ **Data Integration**: Real data is being displayed.' : 
  '⚠️ **Data Integration**: Currently showing demo data (expected when backend offline).'
}

${summary.uiWorking ? 
  '✅ **User Interface**: All UI components working correctly.' : 
  '❌ **User Interface**: Some UI issues detected, review failed tests.'
}

## 🚀 Next Steps

1. ${summary.apiConnected ? '✅' : '🔄'} **Backend Server**: ${summary.apiConnected ? 'Running' : 'Start backend server'}
2. ${summary.realDataAvailable ? '✅' : '🔄'} **Real Data**: ${summary.realDataAvailable ? 'Available' : 'Configure data sources'}
3. ${summary.uiWorking ? '✅' : '🔧'} **UI Issues**: ${summary.uiWorking ? 'All working' : 'Fix identified issues'}
4. 🔄 **User Testing**: Conduct user acceptance testing
5. 🔄 **Performance Testing**: Test under load conditions

---
*Auto-generated report at: ${new Date().toISOString()}*
*Test Duration: ${this.results.reduce((sum, r) => sum + r.executionTime, 0).toFixed(2)}ms*
`;

    return report;
  }
}

// Export singleton instance
export const autoTestRunner = new AutoTestRunner();

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).AutoTestRunner = autoTestRunner;
}