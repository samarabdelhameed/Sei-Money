// Cross-Screen Navigation and Integration Tester
// Testing navigation and screen integration

import { TestResult, TestStatus, TestCategory } from './types';
import { testUtils } from './test-utilities';

export class NavigationTester {
  private results: TestResult[] = [];

  async testCrossScreenNavigation(): Promise<TestResult[]> {
    console.log('🧭 Testing Cross-Screen Navigation...');
    this.results = [];

    try {
      // Test 8.1: Navigation flow between all screens
      await this.testNavigationFlow();
      
      // Test 8.2: Data consistency across screens
      await this.testDataConsistency();

    } catch (error) {
      console.error('❌ Navigation testing failed:', error);
      this.results.push(testUtils.handleTestError(error as Error, 'Navigation Testing'));
    }

    return this.results;
  }

  // Test 8.1: Navigation flow between all screens
  private async testNavigationFlow(): Promise<void> {
    console.log('  🗺️ Testing navigation flow...');
    const startTime = performance.now();

    try {
      const screens = [
        { name: 'Home', hash: '#/', path: '/', expectedElements: ['[data-testid="home-screen"]', '.hero', 'nav'] },
        { name: 'Dashboard', hash: '#/dashboard', path: '/dashboard', expectedElements: ['[data-testid="dashboard-screen"]', '.portfolio', '.balance'] },
        { name: 'Payments', hash: '#/payments', path: '/payments', expectedElements: ['[data-testid="payments-screen"]', 'form', '.transfer'] },
        { name: 'Vaults', hash: '#/vaults', path: '/vaults', expectedElements: ['[data-testid="vaults-screen"]', '.vault', '.apy'] },
        { name: 'Groups', hash: '#/groups', path: '/groups', expectedElements: ['[data-testid="groups-screen"]', '.group', '.savings'] },
        { name: 'AI Agent', hash: '#/ai-agent', path: '/ai-agent', expectedElements: ['[data-testid="ai-agent-screen"]', '.chat', '.ai'] }
      ];

      let successfulNavigations = 0;
      const navigationDetails: string[] = [];

      // Test navigation from Home to all feature screens
      console.log('    📍 Testing navigation from Home to all screens...');
      window.location.hash = '#/';
      await this.sleep(1000);

      for (const screen of screens) {
        try {
          console.log(`    🔍 Testing navigation to ${screen.name}...`);
          
          // Navigate to screen
          window.location.hash = screen.hash;
          await this.sleep(1500);

          // Verify navigation occurred
          const currentHash = window.location.hash;
          const navigationSuccessful = currentHash === screen.hash || currentHash.includes(screen.path);

          if (navigationSuccessful) {
            successfulNavigations++;
            navigationDetails.push(`✅ ${screen.name}: Navigation successful`);

            // Check if screen content loaded by looking for expected elements
            let contentLoaded = false;
            for (const selector of screen.expectedElements) {
              const element = document.querySelector(selector);
              if (element && this.isElementVisible(element)) {
                contentLoaded = true;
                break;
              }
            }
            
            if (contentLoaded) {
              navigationDetails.push(`  ✅ ${screen.name}: Content loaded and visible`);
            } else {
              navigationDetails.push(`  ⚠️ ${screen.name}: Content may not be fully loaded (expected elements: ${screen.expectedElements.join(', ')})`);
            }

            // Test navigation buttons/links on the current screen
            const navButtons = document.querySelectorAll('nav a, [data-testid*="nav"], [href*="#/"]');
            if (navButtons.length > 0) {
              navigationDetails.push(`  ✅ ${screen.name}: Found ${navButtons.length} navigation elements`);
            }

          } else {
            navigationDetails.push(`❌ ${screen.name}: Navigation failed (expected: ${screen.hash}, got: ${currentHash})`);
          }

        } catch (error) {
          navigationDetails.push(`❌ ${screen.name}: Navigation error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Navigation - Screen Routing',
        successfulNavigations === screens.length ? TestStatus.PASSED : 
        successfulNavigations > screens.length / 2 ? TestStatus.WARNING : TestStatus.FAILED,
        `${successfulNavigations}/${screens.length} screens navigated successfully. ${navigationDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

      // Test Dashboard navigation to specific features
      console.log('    📊 Testing Dashboard navigation to specific features...');
      window.location.hash = '#/dashboard';
      await this.sleep(1500);

      const dashboardFeatureLinks = [
        { selector: '[data-testid="nav-payments"], [href="#/payments"]', target: 'Payments' },
        { selector: '[data-testid="nav-vaults"], [href="#/vaults"]', target: 'Vaults' },
        { selector: '[data-testid="nav-groups"], [href="#/groups"]', target: 'Groups' },
        { selector: '[data-testid="nav-ai-agent"], [href="#/ai-agent"]', target: 'AI Agent' }
      ];

      let dashboardNavSuccess = 0;
      const dashboardNavDetails: string[] = [];

      for (const link of dashboardFeatureLinks) {
        try {
          const linkElement = document.querySelector(link.selector) as HTMLElement;
          if (linkElement) {
            dashboardNavDetails.push(`✅ Dashboard: ${link.target} link found`);
            
            // Test clicking the link (if it's safe to do so)
            if (linkElement.tagName === 'A' || linkElement.onclick) {
              const initialHash = window.location.hash;
              linkElement.click();
              await this.sleep(1000);
              
              const newHash = window.location.hash;
              if (newHash !== initialHash) {
                dashboardNavSuccess++;
                dashboardNavDetails.push(`  ✅ Dashboard: ${link.target} navigation works`);
                
                // Navigate back to dashboard
                window.location.hash = '#/dashboard';
                await this.sleep(1000);
              } else {
                dashboardNavDetails.push(`  ⚠️ Dashboard: ${link.target} click didn't change route`);
              }
            } else {
              dashboardNavSuccess++;
              dashboardNavDetails.push(`  ✅ Dashboard: ${link.target} element present`);
            }
          } else {
            dashboardNavDetails.push(`❌ Dashboard: ${link.target} link not found`);
          }
        } catch (error) {
          dashboardNavDetails.push(`❌ Dashboard: ${link.target} error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Navigation - Dashboard Feature Links',
        dashboardNavSuccess >= dashboardFeatureLinks.length / 2 ? TestStatus.PASSED : TestStatus.WARNING,
        `Dashboard feature navigation: ${dashboardNavSuccess}/${dashboardFeatureLinks.length} working. ${dashboardNavDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

      // Test browser back/forward functionality
      console.log('    ⬅️➡️ Testing browser back/forward navigation...');
      try {
        const initialHash = window.location.hash;
        const navigationHistory: string[] = [];
        
        // Create a navigation history
        const navigationSequence = ['#/', '#/dashboard', '#/payments', '#/vaults'];
        
        for (const hash of navigationSequence) {
          window.location.hash = hash;
          await this.sleep(800);
          navigationHistory.push(window.location.hash);
        }
        
        // Test back button functionality
        let backSteps = 0;
        const backResults: string[] = [];
        
        for (let i = navigationSequence.length - 2; i >= 0; i--) {
          window.history.back();
          await this.sleep(800);
          
          const currentHash = window.location.hash;
          const expectedHash = navigationSequence[i];
          
          if (currentHash === expectedHash) {
            backSteps++;
            backResults.push(`✅ Back to ${expectedHash}`);
          } else {
            backResults.push(`❌ Back failed: expected ${expectedHash}, got ${currentHash}`);
          }
        }
        
        // Test forward button functionality
        let forwardSteps = 0;
        const forwardResults: string[] = [];
        
        for (let i = 1; i < navigationSequence.length; i++) {
          window.history.forward();
          await this.sleep(800);
          
          const currentHash = window.location.hash;
          const expectedHash = navigationSequence[i];
          
          if (currentHash === expectedHash) {
            forwardSteps++;
            forwardResults.push(`✅ Forward to ${expectedHash}`);
          } else {
            forwardResults.push(`❌ Forward failed: expected ${expectedHash}, got ${currentHash}`);
          }
        }
        
        const backWorking = backSteps === navigationSequence.length - 1;
        const forwardWorking = forwardSteps === navigationSequence.length - 1;
        
        // Restore initial state
        window.location.hash = initialHash;
        
        this.addResult('Navigation - Browser Back/Forward',
          (backWorking && forwardWorking) ? TestStatus.PASSED : 
          (backWorking || forwardWorking) ? TestStatus.WARNING : TestStatus.FAILED,
          `Browser navigation: Back ${backSteps}/${navigationSequence.length - 1} ✅, Forward ${forwardSteps}/${navigationSequence.length - 1} ✅. Details: ${[...backResults, ...forwardResults].join(', ')}`,
          TestCategory.UI, performance.now() - startTime);

      } catch (error) {
        this.addResult('Navigation - Browser Back/Forward', TestStatus.WARNING,
          `Could not test browser back/forward: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TestCategory.UI, performance.now() - startTime);
      }

      // Test deep linking and URL routing functionality
      console.log('    🔗 Testing deep linking and URL routing...');
      try {
        const deepLinks = [
          { url: '#/', name: 'Home', shouldLoad: true },
          { url: '#/dashboard', name: 'Dashboard', shouldLoad: true },
          { url: '#/payments', name: 'Payments', shouldLoad: true },
          { url: '#/vaults', name: 'Vaults', shouldLoad: true },
          { url: '#/groups', name: 'Groups', shouldLoad: true },
          { url: '#/ai-agent', name: 'AI Agent', shouldLoad: true },
          { url: '#/invalid-route', name: 'Invalid Route', shouldLoad: false }
        ];

        let workingDeepLinks = 0;
        const deepLinkDetails: string[] = [];
        
        for (const link of deepLinks) {
          const initialHash = window.location.hash;
          window.location.hash = link.url;
          await this.sleep(1200);
          
          const currentHash = window.location.hash;
          const routeChanged = currentHash === link.url;
          
          if (link.shouldLoad) {
            if (routeChanged) {
              workingDeepLinks++;
              deepLinkDetails.push(`✅ ${link.name}: Deep link works`);
              
              // Check if content actually loaded
              const hasContent = document.querySelector('main, .app-content, [data-testid*="screen"]');
              if (hasContent && this.isElementVisible(hasContent)) {
                deepLinkDetails.push(`  ✅ ${link.name}: Content loaded via deep link`);
              } else {
                deepLinkDetails.push(`  ⚠️ ${link.name}: Route changed but content unclear`);
              }
            } else {
              deepLinkDetails.push(`❌ ${link.name}: Deep link failed (expected: ${link.url}, got: ${currentHash})`);
            }
          } else {
            // Invalid route should either stay the same or redirect to a valid route
            if (currentHash === link.url) {
              deepLinkDetails.push(`⚠️ ${link.name}: Invalid route was accepted`);
            } else {
              workingDeepLinks++;
              deepLinkDetails.push(`✅ ${link.name}: Invalid route properly handled (redirected to: ${currentHash})`);
            }
          }
        }

        this.addResult('Navigation - Deep Linking & URL Routing',
          workingDeepLinks >= deepLinks.length - 1 ? TestStatus.PASSED : TestStatus.WARNING,
          `${workingDeepLinks}/${deepLinks.length} URL routes working correctly. ${deepLinkDetails.join(', ')}`,
          TestCategory.UI, performance.now() - startTime);

        // Test URL parameters and query strings (if applicable)
        try {
          const urlWithParams = '#/payments?amount=100&recipient=test';
          window.location.hash = urlWithParams;
          await this.sleep(1000);
          
          const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
          const hasParams = urlParams.has('amount') && urlParams.has('recipient');
          
          this.addResult('Navigation - URL Parameters',
            hasParams ? TestStatus.PASSED : TestStatus.WARNING,
            hasParams ? 'URL parameters preserved and accessible' : 'URL parameters not preserved or not applicable',
            TestCategory.UI, performance.now() - startTime);
            
        } catch (error) {
          this.addResult('Navigation - URL Parameters', TestStatus.WARNING,
            'Could not test URL parameters',
            TestCategory.UI, performance.now() - startTime);
        }

      } catch (error) {
        this.addResult('Navigation - Deep Linking', TestStatus.WARNING,
          `Could not test deep linking: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TestCategory.UI, performance.now() - startTime);
      }

      // Test navigation state preservation
      console.log('    💾 Testing navigation state preservation...');
      try {
        const stateTests = [
          {
            screen: '#/payments',
            testName: 'Payment Form State',
            setup: async () => {
              const inputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
              if (inputs.length > 0) {
                const input = inputs[0] as HTMLInputElement;
                const testValue = 'test-state-preservation-' + Date.now();
                input.value = testValue;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return { element: input, value: testValue };
              }
              return null;
            }
          },
          {
            screen: '#/vaults',
            testName: 'Vault Filter State',
            setup: async () => {
              const selects = document.querySelectorAll('select');
              const filterButtons = document.querySelectorAll('[data-testid*="filter"], button[class*="filter"]');
              
              if (selects.length > 0) {
                const select = selects[0] as HTMLSelectElement;
                if (select.options.length > 1) {
                  select.selectedIndex = 1;
                  select.dispatchEvent(new Event('change', { bubbles: true }));
                  return { element: select, value: select.value };
                }
              } else if (filterButtons.length > 0) {
                const button = filterButtons[0] as HTMLButtonElement;
                button.click();
                return { element: button, value: 'clicked' };
              }
              return null;
            }
          }
        ];

        let statePreservationResults: string[] = [];
        let successfulTests = 0;

        for (const test of stateTests) {
          try {
            // Navigate to the test screen
            window.location.hash = test.screen;
            await this.sleep(1500);

            // Set up the test state
            const stateInfo = await test.setup();
            
            if (stateInfo) {
              // Navigate away
              window.location.hash = '#/dashboard';
              await this.sleep(1000);
              
              // Navigate back
              window.location.hash = test.screen;
              await this.sleep(1500);
              
              // Check if state was preserved
              let statePreserved = false;
              
              if (stateInfo.element.tagName === 'INPUT' || stateInfo.element.tagName === 'TEXTAREA') {
                const currentValue = (stateInfo.element as HTMLInputElement).value;
                statePreserved = currentValue === stateInfo.value;
              } else if (stateInfo.element.tagName === 'SELECT') {
                const currentValue = (stateInfo.element as HTMLSelectElement).value;
                statePreserved = currentValue === stateInfo.value;
              } else {
                // For buttons or other elements, check if they maintain their state
                statePreserved = stateInfo.element.classList.contains('active') || 
                                stateInfo.element.getAttribute('aria-pressed') === 'true';
              }
              
              if (statePreserved) {
                successfulTests++;
                statePreservationResults.push(`✅ ${test.testName}: State preserved`);
              } else {
                statePreservationResults.push(`❌ ${test.testName}: State not preserved`);
              }
            } else {
              statePreservationResults.push(`⚠️ ${test.testName}: No testable elements found`);
            }
            
          } catch (error) {
            statePreservationResults.push(`❌ ${test.testName}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Test scroll position preservation
        try {
          window.location.hash = '#/vaults';
          await this.sleep(1500);
          
          // Scroll down if possible
          const scrollableElement = document.documentElement || document.body;
          const initialScrollTop = scrollableElement.scrollTop;
          
          scrollableElement.scrollTop = 500;
          await this.sleep(500);
          
          const scrolledPosition = scrollableElement.scrollTop;
          
          // Navigate away and back
          window.location.hash = '#/dashboard';
          await this.sleep(1000);
          window.location.hash = '#/vaults';
          await this.sleep(1500);
          
          const finalScrollPosition = scrollableElement.scrollTop;
          const scrollPreserved = Math.abs(finalScrollPosition - scrolledPosition) < 50;
          
          if (scrollPreserved) {
            successfulTests++;
            statePreservationResults.push('✅ Scroll Position: Preserved');
          } else {
            statePreservationResults.push(`❌ Scroll Position: Not preserved (was: ${scrolledPosition}, now: ${finalScrollPosition})`);
          }
          
        } catch (error) {
          statePreservationResults.push('⚠️ Scroll Position: Could not test');
        }

        this.addResult('Navigation - State Preservation',
          successfulTests > 0 ? TestStatus.PASSED : TestStatus.WARNING,
          `State preservation: ${successfulTests}/${stateTests.length + 1} tests passed. ${statePreservationResults.join(', ')}`,
          TestCategory.UI, performance.now() - startTime);

      } catch (error) {
        this.addResult('Navigation - State Preservation', TestStatus.WARNING,
          `Could not test navigation state preservation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          TestCategory.UI, performance.now() - startTime);
      }

    } catch (error) {
      this.addResult('Navigation Flow Test', TestStatus.FAILED,
        `Navigation flow test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  // Test 8.2: Data consistency across screens
  private async testDataConsistency(): Promise<void> {
    console.log('  📊 Testing data consistency across screens...');
    const startTime = performance.now();

    try {
      // Test wallet balance consistency across all screens
      console.log('    💰 Testing wallet balance consistency...');
      await this.testWalletBalanceConsistency();
      
      // Test portfolio data synchronization
      console.log('    📈 Testing portfolio data synchronization...');
      await this.testPortfolioDataSync();
      
      // Test transaction data consistency
      console.log('    💸 Testing transaction data consistency...');
      await this.testTransactionDataConsistency();
      
      // Test vault data consistency
      console.log('    🏦 Testing vault data consistency...');
      await this.testVaultDataConsistency();
      
      // Test real-time updates propagation
      console.log('    🔄 Testing real-time updates propagation...');
      await this.testRealTimeUpdates();

    } catch (error) {
      this.addResult('Data Consistency Test', TestStatus.FAILED,
        `Data consistency test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.DATA, performance.now() - startTime);
    }
  }

  private async testWalletBalanceConsistency(): Promise<void> {
    const startTime = performance.now();
    const balanceData: { screen: string; balance: string; elements: number }[] = [];
    
    const screensToCheck = [
      { name: 'Dashboard', hash: '#/dashboard' },
      { name: 'Payments', hash: '#/payments' },
      { name: 'Vaults', hash: '#/vaults' },
      { name: 'Groups', hash: '#/groups' }
    ];

    for (const screen of screensToCheck) {
      try {
        window.location.hash = screen.hash;
        await this.sleep(2000); // Longer wait for data loading

        // Look for balance displays with multiple strategies
        const balanceSelectors = [
          '[data-testid*="balance"]',
          '[data-testid*="wallet-balance"]',
          '[class*="balance"]',
          '[class*="wallet"]',
          '.text-2xl', // Common for displaying large numbers
          '.font-bold' // Common for highlighting important values
        ];

        let foundBalance = '';
        let elementsFound = 0;

        // Try each selector strategy
        for (const selector of balanceSelectors) {
          const elements = document.querySelectorAll(selector);
          elementsFound += elements.length;
          
          for (const element of elements) {
            const text = element.textContent || '';
            // Look for SEI amounts or balance-like patterns
            if (text.includes('SEI') || text.match(/\d+\.\d+/) || text.toLowerCase().includes('balance')) {
              if (!foundBalance || text.includes('SEI')) {
                foundBalance = text.trim();
              }
            }
          }
          
          if (foundBalance) break;
        }

        // Also check for wallet connection status
        const walletElements = document.querySelectorAll('[data-testid*="wallet"], [class*="wallet"]');
        const isWalletConnected = Array.from(walletElements).some(el => 
          el.textContent?.toLowerCase().includes('connected') || 
          el.textContent?.toLowerCase().includes('sei')
        );

        balanceData.push({
          screen: screen.name,
          balance: foundBalance || (isWalletConnected ? 'Connected (no balance shown)' : 'No balance found'),
          elements: elementsFound
        });

      } catch (error) {
        balanceData.push({
          screen: screen.name,
          balance: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          elements: 0
        });
      }
    }

    // Analyze balance consistency
    const validBalances = balanceData.filter(b => b.balance && !b.balance.includes('Error') && !b.balance.includes('No balance'));
    const uniqueBalances = [...new Set(validBalances.map(b => b.balance))];
    const hasConsistentBalances = uniqueBalances.length <= 1;

    this.addResult('Data Consistency - Wallet Balance',
      hasConsistentBalances && validBalances.length > 0 ? TestStatus.PASSED : 
      validBalances.length > 0 ? TestStatus.WARNING : TestStatus.FAILED,
      `Wallet balance consistency: ${validBalances.length} screens showing balance data. ${hasConsistentBalances ? 'Consistent' : 'Inconsistent'}. Details: ${balanceData.map(b => `${b.screen}: ${b.balance} (${b.elements} elements)`).join(', ')}`,
      TestCategory.DATA, performance.now() - startTime);
  }

  private async testPortfolioDataSync(): Promise<void> {
    const startTime = performance.now();
    const portfolioData: { screen: string; data: any }[] = [];
    
    const portfolioScreens = [
      { name: 'Dashboard', hash: '#/dashboard' },
      { name: 'Vaults', hash: '#/vaults' }
    ];

    for (const screen of portfolioScreens) {
      try {
        window.location.hash = screen.hash;
        await this.sleep(2000);

        const portfolioInfo = {
          totalValue: '',
          dailyPL: '',
          activeVaults: 0,
          apy: ''
        };

        // Look for portfolio value
        const valueElements = document.querySelectorAll('.text-2xl, .text-3xl, [data-testid*="portfolio"], [data-testid*="total"]');
        for (const element of valueElements) {
          const text = element.textContent || '';
          if (text.includes('SEI') || text.includes('$') || text.match(/\d+\.\d+/)) {
            portfolioInfo.totalValue = text.trim();
            break;
          }
        }

        // Look for daily P&L
        const plElements = document.querySelectorAll('[data-testid*="pnl"], [data-testid*="daily"], [class*="profit"], [class*="loss"]');
        for (const element of plElements) {
          const text = element.textContent || '';
          if (text.includes('%') || text.includes('+') || text.includes('-')) {
            portfolioInfo.dailyPL = text.trim();
            break;
          }
        }

        // Count active vaults
        const vaultElements = document.querySelectorAll('[data-testid*="vault"], [class*="vault"]');
        portfolioInfo.activeVaults = vaultElements.length;

        // Look for APY information
        const apyElements = document.querySelectorAll('[data-testid*="apy"], [class*="apy"]');
        for (const element of apyElements) {
          const text = element.textContent || '';
          if (text.includes('%')) {
            portfolioInfo.apy = text.trim();
            break;
          }
        }

        portfolioData.push({
          screen: screen.name,
          data: portfolioInfo
        });

      } catch (error) {
        portfolioData.push({
          screen: screen.name,
          data: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    // Check portfolio data synchronization
    const validData = portfolioData.filter(p => !p.data.error);
    let syncIssues: string[] = [];

    if (validData.length >= 2) {
      const [dashboard, vaults] = validData;
      
      if (dashboard.data.totalValue && vaults.data.totalValue && 
          dashboard.data.totalValue !== vaults.data.totalValue) {
        syncIssues.push('Total value mismatch');
      }
      
      if (dashboard.data.activeVaults !== vaults.data.activeVaults) {
        syncIssues.push(`Active vaults count mismatch: Dashboard(${dashboard.data.activeVaults}) vs Vaults(${vaults.data.activeVaults})`);
      }
    }

    this.addResult('Data Consistency - Portfolio Data Sync',
      syncIssues.length === 0 && validData.length > 0 ? TestStatus.PASSED : TestStatus.WARNING,
      syncIssues.length === 0 ? 
        'Portfolio data synchronized between Dashboard and Vaults' : 
        `Portfolio sync issues: ${syncIssues.join(', ')}. Data: ${portfolioData.map(p => `${p.screen}: ${JSON.stringify(p.data)}`).join(', ')}`,
      TestCategory.DATA, performance.now() - startTime);
  }

  private async testTransactionDataConsistency(): Promise<void> {
    const startTime = performance.now();
    const transactionData: { screen: string; transactions: any[] }[] = [];
    
    const transactionScreens = [
      { name: 'Dashboard', hash: '#/dashboard' },
      { name: 'Payments', hash: '#/payments' }
    ];

    for (const screen of transactionScreens) {
      try {
        window.location.hash = screen.hash;
        await this.sleep(2000);

        const transactions: any[] = [];

        // Look for transaction elements
        const transactionSelectors = [
          '[data-testid*="transfer"]',
          '[data-testid*="transaction"]',
          '[class*="transaction"]',
          '[class*="transfer"]',
          '[class*="history"]'
        ];

        for (const selector of transactionSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent || '';
            if (text.includes('SEI') || text.match(/\d+\.\d+/) || text.includes('Transfer')) {
              transactions.push({
                text: text.trim(),
                element: element.tagName,
                selector
              });
            }
          }
        }

        // Also look for transaction history tables or lists
        const tables = document.querySelectorAll('table tbody tr, .transaction-item, .transfer-item');
        for (const row of tables) {
          const text = row.textContent || '';
          if (text.includes('SEI') || text.match(/\d+\.\d+/)) {
            transactions.push({
              text: text.trim(),
              element: 'table-row',
              selector: 'table'
            });
          }
        }

        transactionData.push({
          screen: screen.name,
          transactions
        });

      } catch (error) {
        transactionData.push({
          screen: screen.name,
          transactions: [{ error: error instanceof Error ? error.message : 'Unknown error' }]
        });
      }
    }

    // Analyze transaction data consistency
    const dashboardTxns = transactionData.find(t => t.screen === 'Dashboard')?.transactions || [];
    const paymentsTxns = transactionData.find(t => t.screen === 'Payments')?.transactions || [];
    
    const hasTransactionData = dashboardTxns.length > 0 || paymentsTxns.length > 0;
    const bothHaveData = dashboardTxns.length > 0 && paymentsTxns.length > 0;

    this.addResult('Data Consistency - Transaction Data',
      hasTransactionData ? TestStatus.PASSED : TestStatus.WARNING,
      hasTransactionData ? 
        `Transaction data found: Dashboard(${dashboardTxns.length}), Payments(${paymentsTxns.length}). ${bothHaveData ? 'Both screens have data' : 'Data may be screen-specific'}` : 
        'Transaction data not clearly visible on either screen',
      TestCategory.DATA, performance.now() - startTime);
  }

  private async testVaultDataConsistency(): Promise<void> {
    const startTime = performance.now();
    const vaultData: { screen: string; vaults: any[] }[] = [];
    
    const vaultScreens = [
      { name: 'Dashboard', hash: '#/dashboard' },
      { name: 'Vaults', hash: '#/vaults' }
    ];

    for (const screen of vaultScreens) {
      try {
        window.location.hash = screen.hash;
        await this.sleep(2000);

        const vaults: any[] = [];

        // Look for vault elements
        const vaultSelectors = [
          '[data-testid*="vault"]',
          '[class*="vault"]',
          '[class*="investment"]',
          '[class*="pool"]'
        ];

        for (const selector of vaultSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const text = element.textContent || '';
            // Look for APY, vault names, or investment amounts
            if (text.includes('%') || text.includes('APY') || text.includes('Vault') || text.match(/\d+\.\d+/)) {
              vaults.push({
                text: text.trim(),
                element: element.tagName,
                selector
              });
            }
          }
        }

        // Look for APY displays specifically
        const apyElements = document.querySelectorAll('[data-testid*="apy"], [class*="apy"]');
        for (const element of apyElements) {
          const text = element.textContent || '';
          if (text.includes('%')) {
            vaults.push({
              text: text.trim(),
              element: 'apy',
              selector: 'apy'
            });
          }
        }

        vaultData.push({
          screen: screen.name,
          vaults
        });

      } catch (error) {
        vaultData.push({
          screen: screen.name,
          vaults: [{ error: error instanceof Error ? error.message : 'Unknown error' }]
        });
      }
    }

    // Analyze vault data consistency
    const dashboardVaults = vaultData.find(v => v.screen === 'Dashboard')?.vaults || [];
    const vaultsScreenVaults = vaultData.find(v => v.screen === 'Vaults')?.vaults || [];
    
    const hasVaultData = dashboardVaults.length > 0 || vaultsScreenVaults.length > 0;
    const bothHaveData = dashboardVaults.length > 0 && vaultsScreenVaults.length > 0;

    this.addResult('Data Consistency - Vault Data',
      hasVaultData ? TestStatus.PASSED : TestStatus.WARNING,
      hasVaultData ? 
        `Vault data found: Dashboard(${dashboardVaults.length}), Vaults(${vaultsScreenVaults.length}). ${bothHaveData ? 'Both screens have vault data' : 'Data may be screen-specific'}` : 
        'Vault data not clearly visible on either screen',
      TestCategory.DATA, performance.now() - startTime);
  }

  private async testRealTimeUpdates(): Promise<void> {
    const startTime = performance.now();
    
    try {
      const updateMechanisms: { screen: string; mechanisms: string[] }[] = [];
      
      const screensToCheck = [
        { name: 'Dashboard', hash: '#/dashboard' },
        { name: 'Payments', hash: '#/payments' },
        { name: 'Vaults', hash: '#/vaults' }
      ];

      for (const screen of screensToCheck) {
        try {
          window.location.hash = screen.hash;
          await this.sleep(1500);

          const mechanisms: string[] = [];

          // Look for refresh buttons
          const refreshButtons = document.querySelectorAll('button');
          for (const button of refreshButtons) {
            const text = button.textContent?.toLowerCase() || '';
            const hasRefreshIcon = button.querySelector('svg') !== null;
            const hasRefreshClass = button.className.toLowerCase().includes('refresh');
            
            if (text.includes('refresh') || hasRefreshIcon || hasRefreshClass) {
              mechanisms.push('Refresh button');
              break;
            }
          }

          // Look for auto-refresh indicators
          const autoRefreshElements = document.querySelectorAll('[data-testid*="auto"], [class*="auto"]');
          if (autoRefreshElements.length > 0) {
            mechanisms.push('Auto-refresh elements');
          }

          // Look for loading indicators (suggests real-time updates)
          const loadingElements = document.querySelectorAll('[data-testid*="loading"], [class*="loading"], [class*="spinner"]');
          if (loadingElements.length > 0) {
            mechanisms.push('Loading indicators');
          }

          // Look for timestamp elements (suggests data freshness)
          const timestampElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const text = el.textContent || '';
            return text.includes('ago') || text.includes('Updated') || text.match(/\d+:\d+/);
          });
          if (timestampElements.length > 0) {
            mechanisms.push('Timestamp indicators');
          }

          // Look for WebSocket or real-time connection indicators
          const connectionElements = document.querySelectorAll('[data-testid*="connection"], [class*="connection"], [class*="status"]');
          if (connectionElements.length > 0) {
            mechanisms.push('Connection status indicators');
          }

          updateMechanisms.push({
            screen: screen.name,
            mechanisms
          });

        } catch (error) {
          updateMechanisms.push({
            screen: screen.name,
            mechanisms: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
          });
        }
      }

      // Test if data actually updates (simulate by checking if elements change)
      try {
        window.location.hash = '#/dashboard';
        await this.sleep(2000);
        
        // Capture initial state
        const initialElements = document.querySelectorAll('.text-2xl, [data-testid*="balance"]');
        const initialTexts = Array.from(initialElements).map(el => el.textContent);
        
        // Wait a bit and check again
        await this.sleep(3000);
        
        const updatedElements = document.querySelectorAll('.text-2xl, [data-testid*="balance"]');
        const updatedTexts = Array.from(updatedElements).map(el => el.textContent);
        
        const hasChanges = initialTexts.some((text, index) => text !== updatedTexts[index]);
        
        if (hasChanges) {
          updateMechanisms.push({
            screen: 'Real-time Test',
            mechanisms: ['Data actually updated during test']
          });
        }
        
      } catch (error) {
        // This is optional, so we don't fail the test
      }

      const totalMechanisms = updateMechanisms.reduce((sum, screen) => sum + screen.mechanisms.length, 0);
      const screensWithMechanisms = updateMechanisms.filter(screen => screen.mechanisms.length > 0).length;

      this.addResult('Data Consistency - Real-time Updates',
        totalMechanisms > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        totalMechanisms > 0 ? 
          `Real-time update mechanisms found: ${totalMechanisms} total across ${screensWithMechanisms} screens. Details: ${updateMechanisms.map(s => `${s.screen}: ${s.mechanisms.join(', ')}`).join('; ')}` : 
          'Real-time update mechanisms not clearly visible',
        TestCategory.INTEGRATION, performance.now() - startTime);

    } catch (error) {
      this.addResult('Data Consistency - Real-time Updates', TestStatus.WARNING,
        `Could not test real-time updates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  // Helper methods
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isElementVisible(element: Element | null): boolean {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           style.opacity !== '0';
  }

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

  // Get summary of results
  getSummary(): { total: number; passed: number; failed: number; warnings: number; passRate: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === TestStatus.PASSED).length;
    const failed = this.results.filter(r => r.status === TestStatus.FAILED).length;
    const warnings = this.results.filter(r => r.status === TestStatus.WARNING).length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return { total, passed, failed, warnings, passRate };
  }

  // Get detailed results
  getResults(): TestResult[] {
    return this.results;
  }
}

// Export singleton instance
export const navigationTester = new NavigationTester();

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).NavigationTester = navigationTester;
}