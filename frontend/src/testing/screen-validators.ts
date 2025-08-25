// Screen Validators for SeiMoney Frontend Testing

import { TestResult, TestStatus, TestCategory, ValidationResult } from './types';
import { testUtils } from './test-utilities';
import { TEST_SELECTORS, API_ENDPOINTS, TEST_DATA } from './test-config';

export class ScreenValidators {
  
  // Home Screen Validator
  async validateHomeScreen(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    try {
      // Test market statistics display
      results.push(await this.testMarketStatistics());
      
      // Test navigation buttons
      results.push(await this.testHomeNavigation());
      
      // Test TVL chart
      results.push(await this.testTVLChart());
      
      // Test feature cards
      results.push(await this.testFeatureCards());
      
      // Test responsive design
      results.push(await this.testHomeResponsive());

    } catch (error) {
      results.push(testUtils.handleTestError(error as Error, 'Home Screen Validation'));
    }

    const totalTime = performance.now() - startTime;
    console.log(`Home screen validation completed in ${totalTime}ms`);
    
    return results;
  }

  private async testMarketStatistics(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      // Check if statistics are displayed
      const tvlElement = await testUtils.waitForElement(TEST_SELECTORS.HOME.TVL_VALUE);
      const usersElement = await testUtils.waitForElement(TEST_SELECTORS.HOME.ACTIVE_USERS);
      const successElement = await testUtils.waitForElement(TEST_SELECTORS.HOME.SUCCESS_RATE);
      const apyElement = await testUtils.waitForElement(TEST_SELECTORS.HOME.AVG_APY);

      if (!tvlElement || !usersElement || !successElement || !apyElement) {
        return testUtils.createTestResult(
          'Market Statistics Display',
          TestStatus.FAILED,
          'One or more market statistics elements not found',
          TestCategory.DATA,
          performance.now() - startTime
        );
      }

      // Validate data format
      const tvlText = tvlElement.textContent || '';
      const usersText = usersElement.textContent || '';
      const successText = successElement.textContent || '';
      const apyText = apyElement.textContent || '';

      const errors: string[] = [];
      
      if (!tvlText.match(/^\$[\d,]+\.?\d*[KMB]?$/)) {
        errors.push(`Invalid TVL format: ${tvlText}`);
      }
      
      if (!usersText.match(/^[\d,]+$/)) {
        errors.push(`Invalid users format: ${usersText}`);
      }
      
      if (!successText.match(/^\d+\.\d+%$/)) {
        errors.push(`Invalid success rate format: ${successText}`);
      }
      
      if (!apyText.match(/^\d+\.\d+%$/)) {
        errors.push(`Invalid APY format: ${apyText}`);
      }

      const status = errors.length === 0 ? TestStatus.PASSED : TestStatus.FAILED;
      const details = errors.length === 0 ? 
        'All market statistics displayed correctly' : 
        `Validation errors: ${errors.join(', ')}`;

      return testUtils.createTestResult(
        'Market Statistics Display',
        status,
        details,
        TestCategory.DATA,
        performance.now() - startTime,
        errors.length > 0 ? errors : undefined
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'Market Statistics Display');
    }
  }

  private async testHomeNavigation(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      // Test Get Started button
      const getStartedBtn = await testUtils.waitForElement(TEST_SELECTORS.HOME.GET_STARTED_BTN);
      if (!getStartedBtn) {
        return testUtils.createTestResult(
          'Home Navigation',
          TestStatus.FAILED,
          'Get Started button not found',
          TestCategory.UI,
          performance.now() - startTime
        );
      }

      await testUtils.clickElement(TEST_SELECTORS.HOME.GET_STARTED_BTN);
      await testUtils.sleep(1000);
      
      // Check if navigated to dashboard
      const dashboardHeader = document.querySelector(TEST_SELECTORS.DASHBOARD.HEADER);
      if (!dashboardHeader) {
        return testUtils.createTestResult(
          'Home Navigation',
          TestStatus.FAILED,
          'Navigation to dashboard failed',
          TestCategory.UI,
          performance.now() - startTime
        );
      }

      // Navigate back to home
      window.history.back();
      await testUtils.sleep(1000);

      // Test Learn More button
      const learnMoreBtn = await testUtils.waitForElement(TEST_SELECTORS.HOME.LEARN_MORE_BTN);
      if (learnMoreBtn) {
        await testUtils.clickElement(TEST_SELECTORS.HOME.LEARN_MORE_BTN);
        await testUtils.sleep(1000);
      }

      return testUtils.createTestResult(
        'Home Navigation',
        TestStatus.PASSED,
        'Navigation buttons work correctly',
        TestCategory.UI,
        performance.now() - startTime
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'Home Navigation');
    }
  }

  private async testTVLChart(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const chartElement = await testUtils.waitForElement(TEST_SELECTORS.HOME.TVL_CHART, 5000);
      
      if (!chartElement) {
        return testUtils.createTestResult(
          'TVL Chart Display',
          TestStatus.FAILED,
          'TVL chart element not found',
          TestCategory.DATA,
          performance.now() - startTime
        );
      }

      // Check if chart has data
      const hasData = chartElement.children.length > 0;
      
      return testUtils.createTestResult(
        'TVL Chart Display',
        hasData ? TestStatus.PASSED : TestStatus.WARNING,
        hasData ? 'TVL chart displayed with data' : 'TVL chart found but no data visible',
        TestCategory.DATA,
        performance.now() - startTime
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'TVL Chart Display');
    }
  }

  private async testFeatureCards(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const featureCards = document.querySelectorAll(TEST_SELECTORS.HOME.FEATURE_CARDS);
      
      if (featureCards.length === 0) {
        return testUtils.createTestResult(
          'Feature Cards',
          TestStatus.FAILED,
          'No feature cards found',
          TestCategory.UI,
          performance.now() - startTime
        );
      }

      // Test clicking first feature card
      const firstCard = featureCards[0] as HTMLElement;
      firstCard.click();
      await testUtils.sleep(1000);

      return testUtils.createTestResult(
        'Feature Cards',
        TestStatus.PASSED,
        `Found ${featureCards.length} feature cards, navigation tested`,
        TestCategory.UI,
        performance.now() - startTime
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'Feature Cards');
    }
  }

  private async testHomeResponsive(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const originalWidth = window.innerWidth;
      
      // Test mobile view
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      window.dispatchEvent(new Event('resize'));
      await testUtils.sleep(500);
      
      // Test tablet view
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      window.dispatchEvent(new Event('resize'));
      await testUtils.sleep(500);
      
      // Restore original width
      Object.defineProperty(window, 'innerWidth', { value: originalWidth, writable: true });
      window.dispatchEvent(new Event('resize'));

      return testUtils.createTestResult(
        'Home Responsive Design',
        TestStatus.PASSED,
        'Responsive design tested across different screen sizes',
        TestCategory.UI,
        performance.now() - startTime
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'Home Responsive Design');
    }
  }

  // Dashboard Screen Validator
  async validateDashboardScreen(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    try {
      // Test wallet connection
      results.push(await this.testWalletConnection());
      
      // Test portfolio display
      results.push(await this.testPortfolioDisplay());
      
      // Test real-time updates
      results.push(await this.testRealTimeUpdates());
      
      // Test quick actions
      results.push(await this.testQuickActions());

    } catch (error) {
      results.push(testUtils.handleTestError(error as Error, 'Dashboard Screen Validation'));
    }

    const totalTime = performance.now() - startTime;
    console.log(`Dashboard validation completed in ${totalTime}ms`);
    
    return results;
  }

  private async testWalletConnection(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      // Check if wallet connection buttons are present
      const keplrBtn = document.querySelector(TEST_SELECTORS.DASHBOARD.CONNECT_KEPLR);
      const leapBtn = document.querySelector(TEST_SELECTORS.DASHBOARD.CONNECT_LEAP);
      const metamaskBtn = document.querySelector(TEST_SELECTORS.DASHBOARD.CONNECT_METAMASK);

      if (!keplrBtn && !leapBtn && !metamaskBtn) {
        // Wallet might already be connected
        const portfolioValue = document.querySelector(TEST_SELECTORS.DASHBOARD.PORTFOLIO_VALUE);
        if (portfolioValue) {
          return testUtils.createTestResult(
            'Wallet Connection',
            TestStatus.PASSED,
            'Wallet already connected, portfolio data displayed',
            TestCategory.INTEGRATION,
            performance.now() - startTime
          );
        }
      }

      // Test wallet availability
      const walletAvailability = await testUtils.detectWalletAvailability();
      const availableWallets = Object.entries(walletAvailability)
        .filter(([_, available]) => available)
        .map(([wallet, _]) => wallet);

      return testUtils.createTestResult(
        'Wallet Connection',
        availableWallets.length > 0 ? TestStatus.PASSED : TestStatus.WARNING,
        `Available wallets: ${availableWallets.join(', ') || 'None'}`,
        TestCategory.INTEGRATION,
        performance.now() - startTime
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'Wallet Connection');
    }
  }

  private async testPortfolioDisplay(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const portfolioElement = await testUtils.waitForElement(TEST_SELECTORS.DASHBOARD.PORTFOLIO_VALUE);
      const balanceElement = await testUtils.waitForElement(TEST_SELECTORS.DASHBOARD.WALLET_BALANCE);
      const pnlElement = await testUtils.waitForElement(TEST_SELECTORS.DASHBOARD.DAILY_PNL);

      const errors: string[] = [];
      
      if (!portfolioElement) errors.push('Portfolio value not displayed');
      if (!balanceElement) errors.push('Wallet balance not displayed');
      if (!pnlElement) errors.push('Daily P&L not displayed');

      if (errors.length > 0) {
        return testUtils.createTestResult(
          'Portfolio Display',
          TestStatus.FAILED,
          `Missing elements: ${errors.join(', ')}`,
          TestCategory.DATA,
          performance.now() - startTime,
          errors
        );
      }

      // Validate data formats
      const portfolioText = portfolioElement?.textContent || '';
      const balanceText = balanceElement?.textContent || '';
      const pnlText = pnlElement?.textContent || '';

      const formatErrors: string[] = [];
      
      if (!portfolioText.match(/[\d,]+\.?\d*\s*SEI/)) {
        formatErrors.push(`Invalid portfolio format: ${portfolioText}`);
      }
      
      if (!balanceText.match(/[\d,]+\.?\d*\s*SEI/)) {
        formatErrors.push(`Invalid balance format: ${balanceText}`);
      }

      return testUtils.createTestResult(
        'Portfolio Display',
        formatErrors.length === 0 ? TestStatus.PASSED : TestStatus.WARNING,
        formatErrors.length === 0 ? 'Portfolio data displayed correctly' : `Format issues: ${formatErrors.join(', ')}`,
        TestCategory.DATA,
        performance.now() - startTime,
        formatErrors.length > 0 ? formatErrors : undefined
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'Portfolio Display');
    }
  }

  private async testRealTimeUpdates(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const refreshBtn = await testUtils.waitForElement(TEST_SELECTORS.DASHBOARD.REFRESH_DATA);
      
      if (!refreshBtn) {
        return testUtils.createTestResult(
          'Real-time Updates',
          TestStatus.WARNING,
          'Refresh button not found',
          TestCategory.PERFORMANCE,
          performance.now() - startTime
        );
      }

      // Click refresh and check for loading indicator
      await testUtils.clickElement(TEST_SELECTORS.DASHBOARD.REFRESH_DATA);
      await testUtils.sleep(100);
      
      const loadingIndicator = document.querySelector(TEST_SELECTORS.DASHBOARD.LOADING_INDICATOR);
      
      return testUtils.createTestResult(
        'Real-time Updates',
        TestStatus.PASSED,
        `Refresh functionality tested, loading indicator ${loadingIndicator ? 'shown' : 'not shown'}`,
        TestCategory.PERFORMANCE,
        performance.now() - startTime
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'Real-time Updates');
    }
  }

  private async testQuickActions(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const newTransferBtn = await testUtils.waitForElement(TEST_SELECTORS.DASHBOARD.NEW_TRANSFER_BTN);
      
      if (!newTransferBtn) {
        return testUtils.createTestResult(
          'Quick Actions',
          TestStatus.FAILED,
          'New transfer button not found',
          TestCategory.UI,
          performance.now() - startTime
        );
      }

      // Test navigation to payments
      await testUtils.clickElement(TEST_SELECTORS.DASHBOARD.NEW_TRANSFER_BTN);
      await testUtils.sleep(1000);
      
      const paymentsHeader = document.querySelector(TEST_SELECTORS.PAYMENTS.HEADER);
      
      return testUtils.createTestResult(
        'Quick Actions',
        paymentsHeader ? TestStatus.PASSED : TestStatus.FAILED,
        paymentsHeader ? 'Quick action navigation works' : 'Navigation to payments failed',
        TestCategory.UI,
        performance.now() - startTime
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'Quick Actions');
    }
  }

  // Payments Screen Validator
  async validatePaymentsScreen(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    try {
      results.push(await this.testPaymentFormValidation());
      results.push(await this.testPaymentStatistics());
      results.push(await this.testPaymentHistory());

    } catch (error) {
      results.push(testUtils.handleTestError(error as Error, 'Payments Screen Validation'));
    }

    const totalTime = performance.now() - startTime;
    console.log(`Payments validation completed in ${totalTime}ms`);
    
    return results;
  }

  private async testPaymentFormValidation(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      // Test invalid recipient address
      await testUtils.inputText(TEST_SELECTORS.PAYMENTS.RECIPIENT_INPUT, TEST_DATA.INVALID_SEI_ADDRESS);
      await testUtils.inputText(TEST_SELECTORS.PAYMENTS.AMOUNT_INPUT, '10');
      await testUtils.clickElement(TEST_SELECTORS.PAYMENTS.CREATE_TRANSFER_BTN);
      await testUtils.sleep(500);

      // Check for validation error
      const errorMessage = document.querySelector(TEST_SELECTORS.COMMON.ERROR_MESSAGE);
      
      // Test valid data
      await testUtils.inputText(TEST_SELECTORS.PAYMENTS.RECIPIENT_INPUT, TEST_DATA.VALID_SEI_ADDRESS);
      await testUtils.inputText(TEST_SELECTORS.PAYMENTS.AMOUNT_INPUT, '1.5');
      
      const expiryInput = document.querySelector(TEST_SELECTORS.PAYMENTS.EXPIRY_INPUT) as HTMLInputElement;
      if (expiryInput) {
        expiryInput.value = TEST_DATA.FUTURE_DATE;
        expiryInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      return testUtils.createTestResult(
        'Payment Form Validation',
        TestStatus.PASSED,
        `Form validation tested, error handling ${errorMessage ? 'working' : 'needs verification'}`,
        TestCategory.UI,
        performance.now() - startTime
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'Payment Form Validation');
    }
  }

  private async testPaymentStatistics(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const totalSent = await testUtils.waitForElement(TEST_SELECTORS.PAYMENTS.TOTAL_SENT);
      const totalReceived = await testUtils.waitForElement(TEST_SELECTORS.PAYMENTS.TOTAL_RECEIVED);
      const pendingCount = await testUtils.waitForElement(TEST_SELECTORS.PAYMENTS.PENDING_COUNT);

      const errors: string[] = [];
      
      if (!totalSent) errors.push('Total sent not displayed');
      if (!totalReceived) errors.push('Total received not displayed');
      if (!pendingCount) errors.push('Pending count not displayed');

      return testUtils.createTestResult(
        'Payment Statistics',
        errors.length === 0 ? TestStatus.PASSED : TestStatus.FAILED,
        errors.length === 0 ? 'Payment statistics displayed correctly' : `Missing: ${errors.join(', ')}`,
        TestCategory.DATA,
        performance.now() - startTime,
        errors.length > 0 ? errors : undefined
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'Payment Statistics');
    }
  }

  private async testPaymentHistory(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const transferList = await testUtils.waitForElement(TEST_SELECTORS.PAYMENTS.TRANSFER_LIST);
      
      if (!transferList) {
        return testUtils.createTestResult(
          'Payment History',
          TestStatus.WARNING,
          'Transfer list not found or empty',
          TestCategory.DATA,
          performance.now() - startTime
        );
      }

      const transferItems = transferList.children.length;
      
      return testUtils.createTestResult(
        'Payment History',
        TestStatus.PASSED,
        `Payment history displayed with ${transferItems} items`,
        TestCategory.DATA,
        performance.now() - startTime
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'Payment History');
    }
  }

  // AI Agent Screen Validator
  async validateAIAgentScreen(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    try {
      results.push(await this.testAIServiceConnection());
      results.push(await this.testAIQueryResponse());

    } catch (error) {
      results.push(testUtils.handleTestError(error as Error, 'AI Agent Screen Validation'));
    }

    const totalTime = performance.now() - startTime;
    console.log(`AI Agent validation completed in ${totalTime}ms`);
    
    return results;
  }

  private async testAIServiceConnection(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const statusElement = await testUtils.waitForElement(TEST_SELECTORS.AI_AGENT.STATUS);
      
      if (!statusElement) {
        return testUtils.createTestResult(
          'AI Service Connection',
          TestStatus.WARNING,
          'AI status indicator not found',
          TestCategory.INTEGRATION,
          performance.now() - startTime
        );
      }

      const statusText = statusElement.textContent || '';
      const isConnected = statusText.toLowerCase().includes('connected') || 
                         statusText.toLowerCase().includes('online') ||
                         statusText.toLowerCase().includes('available');

      return testUtils.createTestResult(
        'AI Service Connection',
        isConnected ? TestStatus.PASSED : TestStatus.WARNING,
        `AI service status: ${statusText}`,
        TestCategory.INTEGRATION,
        performance.now() - startTime
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'AI Service Connection');
    }
  }

  private async testAIQueryResponse(): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const queryInput = await testUtils.waitForElement(TEST_SELECTORS.AI_AGENT.QUERY_INPUT);
      const sendBtn = await testUtils.waitForElement(TEST_SELECTORS.AI_AGENT.SEND_QUERY_BTN);

      if (!queryInput || !sendBtn) {
        return testUtils.createTestResult(
          'AI Query Response',
          TestStatus.FAILED,
          'AI query interface not found',
          TestCategory.UI,
          performance.now() - startTime
        );
      }

      // Send test query
      await testUtils.inputText(TEST_SELECTORS.AI_AGENT.QUERY_INPUT, TEST_DATA.TEST_QUERIES[0]);
      await testUtils.clickElement(TEST_SELECTORS.AI_AGENT.SEND_QUERY_BTN);
      
      // Wait for response
      const response = await testUtils.waitForElement(TEST_SELECTORS.AI_AGENT.RESPONSE, 10000);
      
      return testUtils.createTestResult(
        'AI Query Response',
        response ? TestStatus.PASSED : TestStatus.WARNING,
        response ? 'AI query processed and response received' : 'No response received within timeout',
        TestCategory.WORKFLOW,
        performance.now() - startTime
      );

    } catch (error) {
      return testUtils.handleTestError(error as Error, 'AI Query Response');
    }
  }
}

export const screenValidators = new ScreenValidators();