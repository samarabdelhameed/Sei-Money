// Data Validators - Quick Implementation
import { ValidationResult, TestResult } from './types';
import { TestUtilities } from './test-utilities';

export class DataValidators {
  private utils = TestUtilities.getInstance();

  async validateRealData(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    try {
      // Check if displayed data looks real (not mock)
      const tvlElement = document.querySelector('[data-testid="stat-tvl"]');
      const tvlText = tvlElement?.textContent || '';
      const hasRealTVL = tvlText && !tvlText.includes('Loading') && !tvlText.includes('$0');

      results.push(this.utils.createTestResult(
        'Real TVL Data',
        hasRealTVL ? 'passed' : 'warning',
        `TVL: ${tvlText}`,
        performance.now() - startTime
      ));

      // Check portfolio values
      const portfolioElement = document.querySelector('[data-testid="portfolio-value"]');
      const portfolioText = portfolioElement?.textContent || '';
      const hasRealPortfolio = portfolioText && !portfolioText.includes('0.00');

      results.push(this.utils.createTestResult(
        'Real Portfolio Data',
        hasRealPortfolio ? 'passed' : 'warning',
        `Portfolio: ${portfolioText}`,
        performance.now() - startTime
      ));

    } catch (error) {
      results.push(this.utils.createTestResult(
        'Data Validation',
        'failed',
        `Error: ${error}`,
        performance.now() - startTime,
        [String(error)]
      ));
    }

    return results;
  }
}