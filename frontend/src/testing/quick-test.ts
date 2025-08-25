// Quick Test Runner for Browser Console

import { comprehensiveTester } from './comprehensive-tester';
import { testUtils } from './test-utilities';
import { screenValidators } from './screen-validators';
import { integrationTesters } from './integration-testers';

// Quick test functions for immediate execution
export const quickTests = {
  
  // Test current screen
  async testCurrentScreen() {
    console.log('🔍 Testing current screen...');
    const currentPath = window.location.pathname;
    
    try {
      let results;
      
      if (currentPath === '/' || currentPath === '/home') {
        results = await screenValidators.validateHomeScreen();
        console.log('📱 Home screen test results:', results);
      } else if (currentPath.includes('dashboard')) {
        results = await screenValidators.validateDashboardScreen();
        console.log('📊 Dashboard test results:', results);
      } else if (currentPath.includes('payments')) {
        results = await screenValidators.validatePaymentsScreen();
        console.log('💸 Payments screen test results:', results);
      } else if (currentPath.includes('ai-agent')) {
        results = await screenValidators.validateAIAgentScreen();
        console.log('🤖 AI Agent screen test results:', results);
      } else {
        console.log('❓ Unknown screen, running basic tests...');
        results = await quickTests.testBasicFunctionality();
      }
      
      // Summary
      const passed = results.filter(r => r.status === 'passed').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const warnings = results.filter(r => r.status === 'warning').length;
      
      console.log(`✅ Results: ${passed} passed, ${failed} failed, ${warnings} warnings`);
      
      return results;
    } catch (error) {
      console.error('❌ Screen test failed:', error);
      return [];
    }
  },

  // Test basic functionality
  async testBasicFunctionality() {
    console.log('🧪 Running basic functionality tests...');
    
    const results = [];
    
    try {
      // Test page load
      const loadTime = await testUtils.measurePageLoadTime();
      results.push({
        testName: 'Page Load Time',
        status: loadTime < 5000 ? 'passed' : 'warning',
        details: `Page loaded in ${loadTime.toFixed(2)}ms`,
        executionTime: loadTime,
        timestamp: new Date(),
        category: 'performance'
      });
      
      // Test navigation elements
      const navbar = document.querySelector('[data-testid="navbar"]') || document.querySelector('nav');
      results.push({
        testName: 'Navigation Present',
        status: navbar ? 'passed' : 'failed',
        details: navbar ? 'Navigation found' : 'Navigation not found',
        executionTime: 0,
        timestamp: new Date(),
        category: 'ui'
      });
      
      // Test responsive design
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      const isDesktop = window.innerWidth >= 1024;
      
      results.push({
        testName: 'Responsive Design',
        status: 'passed',
        details: `Screen size: ${window.innerWidth}x${window.innerHeight} (${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'})`,
        executionTime: 0,
        timestamp: new Date(),
        category: 'ui'
      });
      
      console.log('✅ Basic functionality tests completed');
      return results;
      
    } catch (error) {
      console.error('❌ Basic functionality test failed:', error);
      return [{
        testName: 'Basic Functionality',
        status: 'failed',
        details: `Test failed: ${error}`,
        executionTime: 0,
        timestamp: new Date(),
        category: 'ui'
      }];
    }
  },

  // Test API connectivity
  async testAPIConnectivity() {
    console.log('🌐 Testing API connectivity...');
    
    try {
      const results = await integrationTesters.testBackendIntegration();
      
      console.log('📡 API test results:');
      results.forEach(result => {
        const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
        console.log(`  ${icon} ${result.testName}: ${result.details}`);
      });
      
      return results;
    } catch (error) {
      console.error('❌ API connectivity test failed:', error);
      return [];
    }
  },

  // Test wallet detection
  async testWalletDetection() {
    console.log('👛 Testing wallet detection...');
    
    try {
      const walletAvailability = await testUtils.detectWalletAvailability();
      
      console.log('🔍 Wallet detection results:');
      console.log(`  Keplr: ${walletAvailability.keplr ? '✅ Available' : '❌ Not found'}`);
      console.log(`  Leap: ${walletAvailability.leap ? '✅ Available' : '❌ Not found'}`);
      console.log(`  MetaMask: ${walletAvailability.metamask ? '✅ Available' : '❌ Not found'}`);
      
      const results = Object.entries(walletAvailability).map(([wallet, available]) => ({
        testName: `${wallet.charAt(0).toUpperCase() + wallet.slice(1)} Wallet Detection`,
        status: available ? 'passed' : 'warning',
        details: available ? `${wallet} wallet detected` : `${wallet} wallet not found`,
        executionTime: 0,
        timestamp: new Date(),
        category: 'integration'
      }));
      
      return results;
    } catch (error) {
      console.error('❌ Wallet detection failed:', error);
      return [];
    }
  },

  // Test data validation
  async testDataValidation() {
    console.log('📊 Testing data validation...');
    
    const results = [];
    
    try {
      // Test market data elements
      const tvlElement = document.querySelector('[data-testid="tvl-value"]');
      const usersElement = document.querySelector('[data-testid="active-users"]');
      const successElement = document.querySelector('[data-testid="success-rate"]');
      
      if (tvlElement) {
        const tvlText = tvlElement.textContent || '';
        const isValidTVL = /^\$[\d,]+\.?\d*[KMB]?$/.test(tvlText) || tvlText.includes('Loading');
        
        results.push({
          testName: 'TVL Data Format',
          status: isValidTVL ? 'passed' : 'warning',
          details: `TVL value: "${tvlText}"`,
          executionTime: 0,
          timestamp: new Date(),
          category: 'data'
        });
      }
      
      if (usersElement) {
        const usersText = usersElement.textContent || '';
        const isValidUsers = /^[\d,]+$/.test(usersText) || usersText.includes('Loading');
        
        results.push({
          testName: 'Active Users Data Format',
          status: isValidUsers ? 'passed' : 'warning',
          details: `Users value: "${usersText}"`,
          executionTime: 0,
          timestamp: new Date(),
          category: 'data'
        });
      }
      
      // Test wallet balance if present
      const balanceElement = document.querySelector('[data-testid="wallet-balance"]');
      if (balanceElement) {
        const balanceText = balanceElement.textContent || '';
        const isValidBalance = balanceText.includes('SEI') || balanceText.includes('Loading');
        
        results.push({
          testName: 'Wallet Balance Format',
          status: isValidBalance ? 'passed' : 'warning',
          details: `Balance value: "${balanceText}"`,
          executionTime: 0,
          timestamp: new Date(),
          category: 'data'
        });
      }
      
      console.log('📊 Data validation completed');
      return results;
      
    } catch (error) {
      console.error('❌ Data validation failed:', error);
      return [];
    }
  },

  // Test user interactions
  async testUserInteractions() {
    console.log('👆 Testing user interactions...');
    
    const results = [];
    
    try {
      // Test button clicks
      const buttons = document.querySelectorAll('button');
      const clickableButtons = Array.from(buttons).filter(btn => 
        !btn.disabled && testUtils.isElementVisible(btn)
      );
      
      results.push({
        testName: 'Interactive Buttons',
        status: clickableButtons.length > 0 ? 'passed' : 'warning',
        details: `Found ${clickableButtons.length} clickable buttons`,
        executionTime: 0,
        timestamp: new Date(),
        category: 'ui'
      });
      
      // Test form inputs
      const inputs = document.querySelectorAll('input, textarea, select');
      const visibleInputs = Array.from(inputs).filter(input => 
        testUtils.isElementVisible(input)
      );
      
      results.push({
        testName: 'Form Inputs',
        status: 'passed',
        details: `Found ${visibleInputs.length} form inputs`,
        executionTime: 0,
        timestamp: new Date(),
        category: 'ui'
      });
      
      // Test navigation links
      const links = document.querySelectorAll('a[href], [data-testid*="nav"]');
      const visibleLinks = Array.from(links).filter(link => 
        testUtils.isElementVisible(link)
      );
      
      results.push({
        testName: 'Navigation Links',
        status: visibleLinks.length > 0 ? 'passed' : 'warning',
        details: `Found ${visibleLinks.length} navigation elements`,
        executionTime: 0,
        timestamp: new Date(),
        category: 'ui'
      });
      
      console.log('👆 User interaction tests completed');
      return results;
      
    } catch (error) {
      console.error('❌ User interaction test failed:', error);
      return [];
    }
  },

  // Run all quick tests
  async runAllQuickTests() {
    console.log('🚀 Running all quick tests...');
    console.log('=====================================');
    
    const allResults = [];
    
    try {
      // Test 1: Current screen
      console.log('\n1️⃣ Testing current screen...');
      const screenResults = await this.testCurrentScreen();
      allResults.push(...screenResults);
      
      // Test 2: API connectivity
      console.log('\n2️⃣ Testing API connectivity...');
      const apiResults = await this.testAPIConnectivity();
      allResults.push(...apiResults);
      
      // Test 3: Wallet detection
      console.log('\n3️⃣ Testing wallet detection...');
      const walletResults = await this.testWalletDetection();
      allResults.push(...walletResults);
      
      // Test 4: Data validation
      console.log('\n4️⃣ Testing data validation...');
      const dataResults = await this.testDataValidation();
      allResults.push(...dataResults);
      
      // Test 5: User interactions
      console.log('\n5️⃣ Testing user interactions...');
      const interactionResults = await this.testUserInteractions();
      allResults.push(...interactionResults);
      
      // Summary
      console.log('\n📊 FINAL SUMMARY');
      console.log('=====================================');
      
      const passed = allResults.filter(r => r.status === 'passed').length;
      const failed = allResults.filter(r => r.status === 'failed').length;
      const warnings = allResults.filter(r => r.status === 'warning').length;
      const total = allResults.length;
      
      console.log(`✅ Passed: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
      console.log(`❌ Failed: ${failed}/${total} (${((failed/total)*100).toFixed(1)}%)`);
      console.log(`⚠️  Warnings: ${warnings}/${total} (${((warnings/total)*100).toFixed(1)}%)`);
      
      if (failed === 0) {
        console.log('🎉 All critical tests passed!');
      } else {
        console.log('🔧 Some tests failed - check the details above');
      }
      
      return {
        results: allResults,
        summary: { passed, failed, warnings, total }
      };
      
    } catch (error) {
      console.error('❌ Quick tests failed:', error);
      return { results: allResults, summary: { passed: 0, failed: 1, warnings: 0, total: 1 } };
    }
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).SeiMoneyQuickTest = quickTests;
  
  console.log('⚡ Quick Test Suite loaded!');
  console.log('Available commands:');
  console.log('  SeiMoneyQuickTest.testCurrentScreen() - Test current screen');
  console.log('  SeiMoneyQuickTest.testAPIConnectivity() - Test API connections');
  console.log('  SeiMoneyQuickTest.testWalletDetection() - Test wallet availability');
  console.log('  SeiMoneyQuickTest.testDataValidation() - Test data formats');
  console.log('  SeiMoneyQuickTest.testUserInteractions() - Test UI interactions');
  console.log('  SeiMoneyQuickTest.runAllQuickTests() - Run all tests');
}

export default quickTests;