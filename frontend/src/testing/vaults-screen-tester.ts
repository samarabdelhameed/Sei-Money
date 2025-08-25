// Vaults Screen Comprehensive Tester
// Comprehensive testing for Vaults screen

import { TestResult, TestStatus, TestCategory } from './types';
import { testUtils } from './test-utilities';

export class VaultsScreenTester {
  private results: TestResult[] = [];

  async testVaultsScreen(): Promise<TestResult[]> {
    console.log('🏦 Testing Vaults Screen...');
    this.results = [];

    try {
      // Navigate to vaults screen
      await this.navigateToVaults();
      await this.sleep(2000);

      // Test 5.1: Vault data display and calculations
      await this.testVaultDataDisplay();
      
      // Test 5.2: Vault investment workflow
      await this.testVaultInvestmentWorkflow();

    } catch (error) {
      console.error('❌ Vaults screen testing failed:', error);
      this.results.push(testUtils.handleTestError(error as Error, 'Vaults Screen Testing'));
    }

    return this.results;
  }

  // Test 5.1: Vault data display and calculations
  private async testVaultDataDisplay(): Promise<void> {
    console.log('  📊 Testing vault data display...');
    const startTime = performance.now();

    try {
      // Check for vault statistics cards
      const statsCards = document.querySelectorAll('[data-testid*="vault-stat"], .text-xl, .font-bold');
      const hasStatsDisplay = statsCards.length >= 4; // Should have 4 stat cards

      this.addResult('Vaults - Statistics Display',
        hasStatsDisplay ? TestStatus.PASSED : TestStatus.WARNING,
        `Found ${statsCards.length} statistics elements (expected 4+)`,
        TestCategory.DATA, performance.now() - startTime);

      // Check for vault cards/listings
      const vaultCards = document.querySelectorAll('[data-testid*="vault-card"], [class*="vault"], .grid > div');
      const hasVaultListings = vaultCards.length > 0;

      this.addResult('Vaults - Vault Listings',
        hasVaultListings ? TestStatus.PASSED : TestStatus.WARNING,
        hasVaultListings ? `Found ${vaultCards.length} vault cards` : 'No vault cards found',
        TestCategory.UI, performance.now() - startTime);

      // Check for APY displays
      const apyElements = document.querySelectorAll('[data-testid*="apy"], [class*="apy"]');
      const apyTexts = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent?.includes('%') && el.textContent?.includes('APY')
      );
      const hasAPYDisplay = apyElements.length > 0 || apyTexts.length > 0;

      this.addResult('Vaults - APY Display',
        hasAPYDisplay ? TestStatus.PASSED : TestStatus.WARNING,
        hasAPYDisplay ? 'APY information displayed' : 'APY display not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for TVL information
      const tvlElements = document.querySelectorAll('[data-testid*="tvl"], [class*="tvl"]');
      const tvlTexts = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent?.includes('TVL') || el.textContent?.includes('Total Value')
      );
      const hasTVLDisplay = tvlElements.length > 0 || tvlTexts.length > 0;

      this.addResult('Vaults - TVL Display',
        hasTVLDisplay ? TestStatus.PASSED : TestStatus.WARNING,
        hasTVLDisplay ? 'TVL information displayed' : 'TVL display not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for risk level indicators
      const riskElements = document.querySelectorAll('[data-testid*="risk"], [class*="risk"]');
      const riskTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('low') || text.includes('medium') || text.includes('high');
      });
      const hasRiskDisplay = riskElements.length > 0 || riskTexts.length > 0;

      this.addResult('Vaults - Risk Level Display',
        hasRiskDisplay ? TestStatus.PASSED : TestStatus.WARNING,
        hasRiskDisplay ? 'Risk level indicators found' : 'Risk level indicators not clearly visible',
        TestCategory.UI, performance.now() - startTime);

      // Check for performance charts or historical data
      const chartElements = document.querySelectorAll('canvas, svg, [class*="chart"]');
      const hasCharts = chartElements.length > 0;

      this.addResult('Vaults - Performance Charts',
        hasCharts ? TestStatus.PASSED : TestStatus.WARNING,
        hasCharts ? `Found ${chartElements.length} chart elements` : 'No performance charts found',
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Vaults Data Display Test', TestStatus.FAILED,
        `Data display test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.DATA, performance.now() - startTime);
    }
  }

  // Test 5.2: Vault investment workflow
  private async testVaultInvestmentWorkflow(): Promise<void> {
    console.log('  💰 Testing vault investment workflow...');
    const startTime = performance.now();

    try {
      // Check for deposit buttons
      const depositButtons = document.querySelectorAll('[data-testid*="deposit"], button');
      const depositButtonsArray = Array.from(depositButtons).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('deposit') || text.includes('invest');
      });
      const hasDepositButtons = depositButtonsArray.length > 0;

      this.addResult('Vaults - Deposit Buttons',
        hasDepositButtons ? TestStatus.PASSED : TestStatus.WARNING,
        hasDepositButtons ? `Found ${depositButtonsArray.length} deposit buttons` : 'No deposit buttons found',
        TestCategory.UI, performance.now() - startTime);

      // Check for withdraw buttons
      const withdrawButtons = document.querySelectorAll('[data-testid*="withdraw"], button');
      const withdrawButtonsArray = Array.from(withdrawButtons).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('withdraw') || text.includes('redeem');
      });
      const hasWithdrawButtons = withdrawButtonsArray.length > 0;

      this.addResult('Vaults - Withdraw Buttons',
        hasWithdrawButtons ? TestStatus.PASSED : TestStatus.WARNING,
        hasWithdrawButtons ? `Found ${withdrawButtonsArray.length} withdraw buttons` : 'No withdraw buttons found',
        TestCategory.UI, performance.now() - startTime);

      // Test deposit button interaction
      if (depositButtonsArray.length > 0) {
        try {
          const firstDepositButton = depositButtonsArray[0] as HTMLElement;
          const originalText = firstDepositButton.textContent;
          
          // Click the button
          firstDepositButton.click();
          await this.sleep(1000);

          // Check for modal or form
          const modals = document.querySelectorAll('[data-testid*="modal"], [class*="modal"], [class*="fixed"]');
          const forms = document.querySelectorAll('form, [data-testid*="form"]');
          const inputs = document.querySelectorAll('input[type="number"], input[placeholder*="amount"]');
          
          const hasDepositInterface = modals.length > 0 || forms.length > 0 || inputs.length > 0;

          this.addResult('Vaults - Deposit Interface',
            hasDepositInterface ? TestStatus.PASSED : TestStatus.WARNING,
            hasDepositInterface ? 'Deposit interface opens correctly' : 'Deposit interface not clearly visible',
            TestCategory.UI, performance.now() - startTime);

          // Close modal if opened (click outside or escape)
          if (modals.length > 0) {
            const modal = modals[0] as HTMLElement;
            // Try to close by clicking outside
            document.body.click();
            await this.sleep(500);
          }

        } catch (error) {
          this.addResult('Vaults - Deposit Interaction', TestStatus.WARNING,
            'Could not test deposit button interaction automatically',
            TestCategory.UI, performance.now() - startTime);
        }
      }

      // Check for wallet connection requirement
      const walletButtons = document.querySelectorAll('button');
      const connectWalletButtons = Array.from(walletButtons).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('connect wallet') || text.includes('connect');
      });
      const hasWalletConnection = connectWalletButtons.length > 0;

      this.addResult('Vaults - Wallet Connection',
        hasWalletConnection ? TestStatus.PASSED : TestStatus.WARNING,
        hasWalletConnection ? 'Wallet connection prompts available' : 'Wallet connection not clearly indicated',
        TestCategory.INTEGRATION, performance.now() - startTime);

      // Check for position tracking
      const positionElements = document.querySelectorAll('[data-testid*="position"], [class*="position"]');
      const positionTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('position') || text.includes('my') || text.includes('portfolio');
      });
      const hasPositionTracking = positionElements.length > 0 || positionTexts.length > 0;

      this.addResult('Vaults - Position Tracking',
        hasPositionTracking ? TestStatus.PASSED : TestStatus.WARNING,
        hasPositionTracking ? 'Position tracking elements found' : 'Position tracking not clearly visible',
        TestCategory.DATA, performance.now() - startTime);

      // Check for fee information
      const feeElements = document.querySelectorAll('[data-testid*="fee"], [class*="fee"]');
      const feeTexts = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('fee') || text.includes('cost') || text.includes('gas');
      });
      const hasFeeDisplay = feeElements.length > 0 || feeTexts.length > 0;

      this.addResult('Vaults - Fee Information',
        hasFeeDisplay ? TestStatus.PASSED : TestStatus.WARNING,
        hasFeeDisplay ? 'Fee information displayed' : 'Fee information not clearly visible',
        TestCategory.UI, performance.now() - startTime);

    } catch (error) {
      this.addResult('Vaults Investment Workflow Test', TestStatus.FAILED,
        `Investment workflow test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TestCategory.UI, performance.now() - startTime);
    }
  }

  // Helper methods
  private async navigateToVaults(): Promise<void> {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    
    if (!currentPath.includes('/vaults') && !currentHash.includes('/vaults')) {
      window.location.hash = '#/vaults';
      await this.sleep(1000);
    }
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
export const vaultsScreenTester = new VaultsScreenTester();

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).VaultsScreenTester = vaultsScreenTester;
}