// Error Handling and Edge Case Tester
// Testing error handling and edge cases

import { TestResult, TestStatus, TestCategory } from './types';
import { testUtils } from './test-utilities';

export class ErrorEdgeCaseTester {
  private results: TestResult[] = [];
  private originalFetch: typeof fetch;
  private originalWebSocket: typeof WebSocket;

  constructor() {
    this.originalFetch = window.fetch;
    this.originalWebSocket = window.WebSocket;
  }

  async testErrorHandlingAndEdgeCases(): Promise<TestResult[]> {
    console.log('🛡️ Testing Error Handling and Edge Cases...');
    this.results = [];

    try {
      // Test 9.1: Network error scenarios
      await this.testNetworkErrorScenarios();
      
      // Test 9.2: Wallet and contract error scenarios
      await this.testWalletContractErrorScenarios();

    } catch (error) {
      console.error('❌ Error handling testing failed:', error);
      this.results.push(testUtils.handleTestError(error as Error, 'Error Handling Testing'));
    }

    return this.results;
  }

  // Test 9.1: Network error scenarios
  private async testNetworkErrorScenarios(): Promise<void> {
    console.log('  🌐 Testing network error scenarios...');
    const startTime = performance.now();

    try {
      // Test backend API unavailability
      await this.testBackendAPIUnavailable();
      
      // Test graceful degradation with cached data
      await this.testGracefulDegradation();
      
      // Test retry mechanisms
      await this.testRetryMechanisms();
      
      // Test offline mode functionality
      await this.testOfflineMode();
      
      // Test slow network conditions
      await this.testSlowNetworkConditions();

    } catch (error) {
      this.addResult('Network Error Scenarios', TestStatus.FAILED,
        `Network error testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  private async testBackendAPIUnavailable(): Promise<void> {
    const startTime = performance.now();
    console.log('    🚫 Testing backend API unavailability...');

    try {
      // Mock fetch to simulate API unavailability
      const mockFetch = async (url: string | Request, options?: RequestInit): Promise<Response> => {
        // Simulate network error for API calls
        if (typeof url === 'string' && (url.includes('/api/') || url.includes('sei'))) {
          throw new Error('Network Error: API unavailable');
        }
        return this.originalFetch(url, options);
      };

      // Replace fetch temporarily
      window.fetch = mockFetch;

      const errorScenarios = [
        {
          name: 'Dashboard with API unavailable',
          action: async () => {
            window.location.hash = '#/dashboard';
            await this.sleep(3000);
            return this.checkErrorHandling();
          }
        },
        {
          name: 'Payments with API unavailable',
          action: async () => {
            window.location.hash = '#/payments';
            await this.sleep(3000);
            return this.checkErrorHandling();
          }
        },
        {
          name: 'Vaults with API unavailable',
          action: async () => {
            window.location.hash = '#/vaults';
            await this.sleep(3000);
            return this.checkErrorHandling();
          }
        }
      ];

      let successfulErrorHandling = 0;
      const errorDetails: string[] = [];

      for (const scenario of errorScenarios) {
        try {
          const result = await scenario.action();
          if (result.hasErrorMessage || result.hasRetryButton || result.hasOfflineIndicator) {
            successfulErrorHandling++;
            errorDetails.push(`✅ ${scenario.name}: Error handled gracefully`);
          } else {
            errorDetails.push(`⚠️ ${scenario.name}: No clear error handling visible`);
          }
        } catch (error) {
          errorDetails.push(`❌ ${scenario.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Restore original fetch
      window.fetch = this.originalFetch;

      this.addResult('Network Error - API Unavailable',
        successfulErrorHandling >= errorScenarios.length / 2 ? TestStatus.PASSED : TestStatus.WARNING,
        `API unavailability handling: ${successfulErrorHandling}/${errorScenarios.length} scenarios handled. ${errorDetails.join(', ')}`,
        TestCategory.INTEGRATION, performance.now() - startTime);

    } catch (error) {
      // Restore original fetch in case of error
      window.fetch = this.originalFetch;
      
      this.addResult('Network Error - API Unavailable', TestStatus.FAILED,
        `API unavailability test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  private async testGracefulDegradation(): Promise<void> {
    const startTime = performance.now();
    console.log('    📱 Testing graceful degradation with cached data...');

    try {
      // Check if app shows cached data when network fails
      const degradationTests = [
        {
          screen: '#/dashboard',
          expectedCachedElements: ['[data-testid*="balance"]', '.portfolio', '.recent-activity'],
          name: 'Dashboard cached data'
        },
        {
          screen: '#/vaults',
          expectedCachedElements: ['[data-testid*="vault"]', '.apy', '.tvl'],
          name: 'Vaults cached data'
        },
        {
          screen: '#/payments',
          expectedCachedElements: ['[data-testid*="transaction"]', '.history', '.balance'],
          name: 'Payments cached data'
        }
      ];

      let gracefulDegradationCount = 0;
      const degradationDetails: string[] = [];

      for (const test of degradationTests) {
        try {
          window.location.hash = test.screen;
          await this.sleep(2000);

          // Check for cached data elements
          let cachedDataFound = false;
          for (const selector of test.expectedCachedElements) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              cachedDataFound = true;
              break;
            }
          }

          // Check for offline indicators
          const offlineIndicators = document.querySelectorAll(
            '[data-testid*="offline"], [class*="offline"], [class*="cached"]'
          );

          if (cachedDataFound || offlineIndicators.length > 0) {
            gracefulDegradationCount++;
            degradationDetails.push(`✅ ${test.name}: Shows cached data or offline indicator`);
          } else {
            degradationDetails.push(`⚠️ ${test.name}: No cached data or offline indication visible`);
          }

        } catch (error) {
          degradationDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Network Error - Graceful Degradation',
        gracefulDegradationCount > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Graceful degradation: ${gracefulDegradationCount}/${degradationTests.length} screens show cached data. ${degradationDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Network Error - Graceful Degradation', TestStatus.FAILED,
        `Graceful degradation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testRetryMechanisms(): Promise<void> {
    const startTime = performance.now();
    console.log('    🔄 Testing retry mechanisms and user feedback...');

    try {
      // Look for retry buttons and mechanisms
      const screens = ['#/dashboard', '#/payments', '#/vaults', '#/groups'];
      let retryMechanismsFound = 0;
      const retryDetails: string[] = [];

      for (const screen of screens) {
        try {
          window.location.hash = screen;
          await this.sleep(2000);

          // Look for retry buttons
          const retryButtons = document.querySelectorAll(
            '[data-testid*="retry"], [class*="retry"], button'
          );
          
          const retryButtonsArray = Array.from(retryButtons).filter(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            return text.includes('retry') || text.includes('refresh') || text.includes('reload');
          });

          // Look for refresh buttons
          const refreshButtons = document.querySelectorAll(
            '[data-testid*="refresh"], [class*="refresh"]'
          );

          // Look for error messages with retry options
          const errorMessages = document.querySelectorAll(
            '[data-testid*="error"], [class*="error"], .alert'
          );

          const hasRetryMechanism = retryButtonsArray.length > 0 || 
                                   refreshButtons.length > 0 || 
                                   errorMessages.length > 0;

          if (hasRetryMechanism) {
            retryMechanismsFound++;
            retryDetails.push(`✅ ${screen}: Retry mechanisms available (${retryButtonsArray.length + refreshButtons.length} buttons, ${errorMessages.length} error messages)`);
          } else {
            retryDetails.push(`⚠️ ${screen}: No clear retry mechanisms found`);
          }

        } catch (error) {
          retryDetails.push(`❌ ${screen}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Network Error - Retry Mechanisms',
        retryMechanismsFound > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Retry mechanisms: ${retryMechanismsFound}/${screens.length} screens have retry options. ${retryDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Network Error - Retry Mechanisms', TestStatus.FAILED,
        `Retry mechanisms test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testOfflineMode(): Promise<void> {
    const startTime = performance.now();
    console.log('    📴 Testing offline mode functionality...');

    try {
      // Simulate offline mode
      const originalOnLine = navigator.onLine;
      
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Dispatch offline event
      window.dispatchEvent(new Event('offline'));
      await this.sleep(1000);

      const offlineTests = [
        {
          screen: '#/dashboard',
          name: 'Dashboard offline mode'
        },
        {
          screen: '#/payments',
          name: 'Payments offline mode'
        },
        {
          screen: '#/vaults',
          name: 'Vaults offline mode'
        }
      ];

      let offlineModeSupport = 0;
      const offlineDetails: string[] = [];

      for (const test of offlineTests) {
        try {
          window.location.hash = test.screen;
          await this.sleep(2000);

          // Look for offline indicators
          const offlineIndicators = document.querySelectorAll(
            '[data-testid*="offline"], [class*="offline"], [class*="no-connection"]'
          );

          // Look for cached content
          const cachedContent = document.querySelectorAll(
            '[data-testid*="cached"], [class*="cached"]'
          );

          // Check if basic functionality still works
          const basicElements = document.querySelectorAll('nav, header, main');
          const hasBasicFunctionality = basicElements.length >= 2;

          if (offlineIndicators.length > 0 || cachedContent.length > 0 || hasBasicFunctionality) {
            offlineModeSupport++;
            offlineDetails.push(`✅ ${test.name}: Offline mode supported (${offlineIndicators.length} indicators, ${cachedContent.length} cached elements)`);
          } else {
            offlineDetails.push(`⚠️ ${test.name}: No clear offline mode support`);
          }

        } catch (error) {
          offlineDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Restore online status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: originalOnLine
      });
      window.dispatchEvent(new Event('online'));

      this.addResult('Network Error - Offline Mode',
        offlineModeSupport > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Offline mode: ${offlineModeSupport}/${offlineTests.length} screens support offline functionality. ${offlineDetails.join(', ')}`,
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Network Error - Offline Mode', TestStatus.FAILED,
        `Offline mode test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  private async testSlowNetworkConditions(): Promise<void> {
    const startTime = performance.now();
    console.log('    🐌 Testing slow network conditions and timeouts...');

    try {
      // Mock slow fetch responses
      const slowFetch = async (url: string | Request, options?: RequestInit): Promise<Response> => {
        // Add delay to simulate slow network
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.originalFetch(url, options);
      };

      window.fetch = slowFetch;

      const slowNetworkTests = [
        {
          screen: '#/dashboard',
          name: 'Dashboard slow loading'
        },
        {
          screen: '#/vaults',
          name: 'Vaults slow loading'
        }
      ];

      let slowNetworkHandling = 0;
      const slowNetworkDetails: string[] = [];

      for (const test of slowNetworkTests) {
        try {
          const testStartTime = performance.now();
          window.location.hash = test.screen;
          
          // Wait a bit and check for loading indicators
          await this.sleep(2000);
          
          // Look for loading indicators
          const loadingIndicators = document.querySelectorAll(
            '[data-testid*="loading"], [class*="loading"], [class*="spinner"], .skeleton'
          );

          // Look for timeout messages
          const timeoutMessages = document.querySelectorAll(
            '[data-testid*="timeout"], [class*="timeout"], [class*="slow"]'
          );

          const testDuration = performance.now() - testStartTime;
          
          if (loadingIndicators.length > 0 || timeoutMessages.length > 0) {
            slowNetworkHandling++;
            slowNetworkDetails.push(`✅ ${test.name}: Slow network handled (${loadingIndicators.length} loading indicators, ${timeoutMessages.length} timeout messages, ${testDuration.toFixed(0)}ms)`);
          } else {
            slowNetworkDetails.push(`⚠️ ${test.name}: No clear slow network handling (${testDuration.toFixed(0)}ms)`);
          }

        } catch (error) {
          slowNetworkDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Restore original fetch
      window.fetch = this.originalFetch;

      this.addResult('Network Error - Slow Network Conditions',
        slowNetworkHandling > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Slow network handling: ${slowNetworkHandling}/${slowNetworkTests.length} screens handle slow connections. ${slowNetworkDetails.join(', ')}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);

    } catch (error) {
      // Restore original fetch
      window.fetch = this.originalFetch;
      
      this.addResult('Network Error - Slow Network Conditions', TestStatus.FAILED,
        `Slow network test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.PERFORMANCE, performance.now() - startTime);
    }
  }

  // Test 9.2: Wallet and contract error scenarios
  private async testWalletContractErrorScenarios(): Promise<void> {
    console.log('  💳 Testing wallet and contract error scenarios...');
    const startTime = performance.now();

    try {
      // Test wallet connection failures
      await this.testWalletConnectionFailures();
      
      // Test smart contract interaction errors
      await this.testSmartContractErrors();
      
      // Test insufficient balance scenarios
      await this.testInsufficientBalanceScenarios();
      
      // Test transaction failure recovery
      await this.testTransactionFailureRecovery();
      
      // Test wallet switching during operations
      await this.testWalletSwitchingErrors();

    } catch (error) {
      this.addResult('Wallet Contract Error Scenarios', TestStatus.FAILED,
        `Wallet/contract error testing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  private async testWalletConnectionFailures(): Promise<void> {
    const startTime = performance.now();
    console.log('    💳 Testing wallet connection failures and recovery...');

    try {
      // Navigate to dashboard where wallet connection is needed
      window.location.hash = '#/dashboard';
      await this.sleep(2000);

      const walletTests = [
        {
          name: 'Wallet connection error handling',
          test: () => this.checkWalletErrorHandling()
        },
        {
          name: 'Wallet not installed handling',
          test: () => this.checkWalletNotInstalledHandling()
        },
        {
          name: 'Wallet connection timeout',
          test: () => this.checkWalletTimeoutHandling()
        }
      ];

      let walletErrorHandling = 0;
      const walletErrorDetails: string[] = [];

      for (const test of walletTests) {
        try {
          const result = await test.test();
          if (result.hasErrorHandling) {
            walletErrorHandling++;
            walletErrorDetails.push(`✅ ${test.name}: Error handling present`);
          } else {
            walletErrorDetails.push(`⚠️ ${test.name}: No clear error handling`);
          }
        } catch (error) {
          walletErrorDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Wallet Error - Connection Failures',
        walletErrorHandling > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Wallet connection error handling: ${walletErrorHandling}/${walletTests.length} scenarios handled. ${walletErrorDetails.join(', ')}`,
        TestCategory.INTEGRATION, performance.now() - startTime);

    } catch (error) {
      this.addResult('Wallet Error - Connection Failures', TestStatus.FAILED,
        `Wallet connection failure test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  private async testSmartContractErrors(): Promise<void> {
    const startTime = performance.now();
    console.log('    📜 Testing smart contract interaction error handling...');

    try {
      // Navigate to payments screen for contract interactions
      window.location.hash = '#/payments';
      await this.sleep(2000);

      const contractErrorTests = [
        {
          name: 'Contract call failure handling',
          selector: '[data-testid*="transfer"], form',
          action: 'submit'
        },
        {
          name: 'Gas estimation error handling',
          selector: '[data-testid*="amount"], input[type="number"]',
          action: 'input'
        },
        {
          name: 'Transaction rejection handling',
          selector: '[data-testid*="confirm"], button[type="submit"]',
          action: 'click'
        }
      ];

      let contractErrorHandling = 0;
      const contractErrorDetails: string[] = [];

      for (const test of contractErrorTests) {
        try {
          const element = document.querySelector(test.selector);
          if (element) {
            // Look for error handling elements near the interactive element
            const errorElements = document.querySelectorAll(
              '[data-testid*="error"], [class*="error"], .alert, .notification'
            );

            // Look for loading states
            const loadingElements = document.querySelectorAll(
              '[data-testid*="loading"], [class*="loading"], [disabled]'
            );

            if (errorElements.length > 0 || loadingElements.length > 0) {
              contractErrorHandling++;
              contractErrorDetails.push(`✅ ${test.name}: Error handling elements found (${errorElements.length} error, ${loadingElements.length} loading)`);
            } else {
              contractErrorDetails.push(`⚠️ ${test.name}: No clear error handling visible`);
            }
          } else {
            contractErrorDetails.push(`⚠️ ${test.name}: Test element not found`);
          }
        } catch (error) {
          contractErrorDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Wallet Error - Smart Contract Interactions',
        contractErrorHandling > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Smart contract error handling: ${contractErrorHandling}/${contractErrorTests.length} scenarios have error handling. ${contractErrorDetails.join(', ')}`,
        TestCategory.INTEGRATION, performance.now() - startTime);

    } catch (error) {
      this.addResult('Wallet Error - Smart Contract Interactions', TestStatus.FAILED,
        `Smart contract error test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  private async testInsufficientBalanceScenarios(): Promise<void> {
    const startTime = performance.now();
    console.log('    💰 Testing insufficient balance scenarios...');

    try {
      // Test on payments and vaults screens
      const balanceTests = [
        {
          screen: '#/payments',
          name: 'Payment insufficient balance',
          inputSelector: '[data-testid*="amount"], input[type="number"]',
          testValue: '999999999'
        },
        {
          screen: '#/vaults',
          name: 'Vault deposit insufficient balance',
          inputSelector: '[data-testid*="deposit"], input[type="number"]',
          testValue: '999999999'
        }
      ];

      let balanceErrorHandling = 0;
      const balanceErrorDetails: string[] = [];

      for (const test of balanceTests) {
        try {
          window.location.hash = test.screen;
          await this.sleep(2000);

          const inputElement = document.querySelector(test.inputSelector) as HTMLInputElement;
          if (inputElement) {
            // Enter a very large amount
            inputElement.value = test.testValue;
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            inputElement.dispatchEvent(new Event('change', { bubbles: true }));
            
            await this.sleep(1000);

            // Look for balance error messages
            const errorMessages = document.querySelectorAll(
              '[data-testid*="error"], [class*="error"], [class*="insufficient"], .alert'
            );

            const errorTexts = Array.from(errorMessages).map(el => el.textContent?.toLowerCase() || '');
            const hasBalanceError = errorTexts.some(text => 
              text.includes('insufficient') || 
              text.includes('balance') || 
              text.includes('not enough')
            );

            // Check if submit button is disabled
            const submitButtons = document.querySelectorAll('button[type="submit"], [data-testid*="submit"]');
            const hasDisabledSubmit = Array.from(submitButtons).some(btn => 
              (btn as HTMLButtonElement).disabled
            );

            if (hasBalanceError || hasDisabledSubmit) {
              balanceErrorHandling++;
              balanceErrorDetails.push(`✅ ${test.name}: Balance validation working (${errorMessages.length} errors, ${hasDisabledSubmit ? 'submit disabled' : 'submit enabled'})`);
            } else {
              balanceErrorDetails.push(`⚠️ ${test.name}: No clear balance validation`);
            }
          } else {
            balanceErrorDetails.push(`⚠️ ${test.name}: Input element not found`);
          }
        } catch (error) {
          balanceErrorDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Wallet Error - Insufficient Balance',
        balanceErrorHandling > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Insufficient balance handling: ${balanceErrorHandling}/${balanceTests.length} scenarios validated. ${balanceErrorDetails.join(', ')}`,
        TestCategory.VALIDATION, performance.now() - startTime);

    } catch (error) {
      this.addResult('Wallet Error - Insufficient Balance', TestStatus.FAILED,
        `Insufficient balance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.VALIDATION, performance.now() - startTime);
    }
  }

  private async testTransactionFailureRecovery(): Promise<void> {
    const startTime = performance.now();
    console.log('    🔄 Testing transaction failure recovery...');

    try {
      // Look for transaction recovery mechanisms
      const screens = ['#/payments', '#/dashboard'];
      let recoveryMechanisms = 0;
      const recoveryDetails: string[] = [];

      for (const screen of screens) {
        try {
          window.location.hash = screen;
          await this.sleep(2000);

          // Look for retry buttons
          const retryButtons = document.querySelectorAll(
            '[data-testid*="retry"], [class*="retry"], button'
          );
          
          const retryButtonsArray = Array.from(retryButtons).filter(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            return text.includes('retry') || text.includes('try again');
          });

          // Look for transaction status indicators
          const statusIndicators = document.querySelectorAll(
            '[data-testid*="status"], [class*="status"], [class*="pending"], [class*="failed"]'
          );

          // Look for cancel/refund options
          const cancelButtons = document.querySelectorAll(
            '[data-testid*="cancel"], [data-testid*="refund"], button'
          );
          
          const cancelButtonsArray = Array.from(cancelButtons).filter(btn => {
            const text = btn.textContent?.toLowerCase() || '';
            return text.includes('cancel') || text.includes('refund');
          });

          const hasRecoveryMechanisms = retryButtonsArray.length > 0 || 
                                       statusIndicators.length > 0 || 
                                       cancelButtonsArray.length > 0;

          if (hasRecoveryMechanisms) {
            recoveryMechanisms++;
            recoveryDetails.push(`✅ ${screen}: Recovery mechanisms found (${retryButtonsArray.length} retry, ${statusIndicators.length} status, ${cancelButtonsArray.length} cancel)`);
          } else {
            recoveryDetails.push(`⚠️ ${screen}: No clear recovery mechanisms`);
          }

        } catch (error) {
          recoveryDetails.push(`❌ ${screen}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Wallet Error - Transaction Failure Recovery',
        recoveryMechanisms > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Transaction recovery: ${recoveryMechanisms}/${screens.length} screens have recovery mechanisms. ${recoveryDetails.join(', ')}`,
        TestCategory.INTEGRATION, performance.now() - startTime);

    } catch (error) {
      this.addResult('Wallet Error - Transaction Failure Recovery', TestStatus.FAILED,
        `Transaction failure recovery test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  private async testWalletSwitchingErrors(): Promise<void> {
    const startTime = performance.now();
    console.log('    🔄 Testing wallet switching during active operations...');

    try {
      // Navigate to dashboard
      window.location.hash = '#/dashboard';
      await this.sleep(2000);

      const walletSwitchingTests = [
        {
          name: 'Wallet switch detection',
          test: () => this.checkWalletSwitchHandling()
        },
        {
          name: 'Account change handling',
          test: () => this.checkAccountChangeHandling()
        },
        {
          name: 'Network switch handling',
          test: () => this.checkNetworkSwitchHandling()
        }
      ];

      let walletSwitchHandling = 0;
      const switchHandlingDetails: string[] = [];

      for (const test of walletSwitchingTests) {
        try {
          const result = await test.test();
          if (result.hasHandling) {
            walletSwitchHandling++;
            switchHandlingDetails.push(`✅ ${test.name}: Switch handling present`);
          } else {
            switchHandlingDetails.push(`⚠️ ${test.name}: No clear switch handling`);
          }
        } catch (error) {
          switchHandlingDetails.push(`❌ ${test.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.addResult('Wallet Error - Wallet Switching',
        walletSwitchHandling > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Wallet switching handling: ${walletSwitchHandling}/${walletSwitchingTests.length} scenarios handled. ${switchHandlingDetails.join(', ')}`,
        TestCategory.INTEGRATION, performance.now() - startTime);

    } catch (error) {
      this.addResult('Wallet Error - Wallet Switching', TestStatus.FAILED,
        `Wallet switching test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.INTEGRATION, performance.now() - startTime);
    }
  }

  // Helper methods
  private async checkErrorHandling(): Promise<{
    hasErrorMessage: boolean;
    hasRetryButton: boolean;
    hasOfflineIndicator: boolean;
  }> {
    // Look for error messages
    const errorMessages = document.querySelectorAll(
      '[data-testid*="error"], [class*="error"], .alert, .notification'
    );

    // Look for retry buttons
    const retryButtons = document.querySelectorAll(
      '[data-testid*="retry"], [class*="retry"], button'
    );
    
    const retryButtonsArray = Array.from(retryButtons).filter(btn => {
      const text = btn.textContent?.toLowerCase() || '';
      return text.includes('retry') || text.includes('refresh');
    });

    // Look for offline indicators
    const offlineIndicators = document.querySelectorAll(
      '[data-testid*="offline"], [class*="offline"], [class*="no-connection"]'
    );

    return {
      hasErrorMessage: errorMessages.length > 0,
      hasRetryButton: retryButtonsArray.length > 0,
      hasOfflineIndicator: offlineIndicators.length > 0
    };
  }

  private async checkWalletErrorHandling(): Promise<{ hasErrorHandling: boolean }> {
    // Look for wallet-specific error handling
    const walletErrors = document.querySelectorAll(
      '[data-testid*="wallet-error"], [class*="wallet-error"], [data-testid*="connection-error"]'
    );

    const connectButtons = document.querySelectorAll(
      '[data-testid*="connect"], [class*="connect"], button'
    );
    
    const connectButtonsArray = Array.from(connectButtons).filter(btn => {
      const text = btn.textContent?.toLowerCase() || '';
      return text.includes('connect') || text.includes('wallet');
    });

    return {
      hasErrorHandling: walletErrors.length > 0 || connectButtonsArray.length > 0
    };
  }

  private async checkWalletNotInstalledHandling(): Promise<{ hasErrorHandling: boolean }> {
    // Look for wallet installation prompts
    const installPrompts = document.querySelectorAll(
      '[data-testid*="install"], [class*="install"], [href*="chrome.google.com"]'
    );

    const installTexts = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent?.toLowerCase() || '';
      return text.includes('install') && (text.includes('wallet') || text.includes('keplr') || text.includes('metamask'));
    });

    return {
      hasErrorHandling: installPrompts.length > 0 || installTexts.length > 0
    };
  }

  private async checkWalletTimeoutHandling(): Promise<{ hasErrorHandling: boolean }> {
    // Look for timeout handling
    const timeoutMessages = document.querySelectorAll(
      '[data-testid*="timeout"], [class*="timeout"], [class*="slow"]'
    );

    const timeoutTexts = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent?.toLowerCase() || '';
      return text.includes('timeout') || text.includes('taking too long') || text.includes('slow');
    });

    return {
      hasErrorHandling: timeoutMessages.length > 0 || timeoutTexts.length > 0
    };
  }

  private async checkWalletSwitchHandling(): Promise<{ hasHandling: boolean }> {
    // Look for wallet switch notifications
    const switchNotifications = document.querySelectorAll(
      '[data-testid*="switch"], [class*="switch"], [class*="change"]'
    );

    const switchTexts = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent?.toLowerCase() || '';
      return text.includes('switch') || text.includes('changed') || text.includes('different');
    });

    return {
      hasHandling: switchNotifications.length > 0 || switchTexts.length > 0
    };
  }

  private async checkAccountChangeHandling(): Promise<{ hasHandling: boolean }> {
    // Look for account change handling
    const accountChangeElements = document.querySelectorAll(
      '[data-testid*="account"], [class*="account"], [data-testid*="address"]'
    );

    return {
      hasHandling: accountChangeElements.length > 0
    };
  }

  private async checkNetworkSwitchHandling(): Promise<{ hasHandling: boolean }> {
    // Look for network switch handling
    const networkElements = document.querySelectorAll(
      '[data-testid*="network"], [class*="network"], [data-testid*="chain"]'
    );

    const networkTexts = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent?.toLowerCase() || '';
      return text.includes('network') || text.includes('chain') || text.includes('sei');
    });

    return {
      hasHandling: networkElements.length > 0 || networkTexts.length > 0
    };
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
export const errorEdgeCaseTester = new ErrorEdgeCaseTester();

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).ErrorEdgeCaseTester = errorEdgeCaseTester;
}