// Test Utilities for SeiMoney Frontend Comprehensive Testing

import { TestResult, TestStatus, TestCategory, ErrorSeverity, EnvironmentInfo, ScreenshotCapture, Annotation } from './types';

export class TestUtilities {
  private static instance: TestUtilities;
  private screenshotCounter = 0;

  static getInstance(): TestUtilities {
    if (!TestUtilities.instance) {
      TestUtilities.instance = new TestUtilities();
    }
    return TestUtilities.instance;
  }

  // Environment Detection
  getEnvironmentInfo(): EnvironmentInfo {
    const userAgent = navigator.userAgent;
    const screen = window.screen;
    
    return {
      browser: this.detectBrowser(userAgent),
      browserVersion: this.detectBrowserVersion(userAgent),
      os: this.detectOS(userAgent),
      screenResolution: `${screen.width}x${screen.height}`,
      deviceType: this.detectDeviceType(),
      networkCondition: this.detectNetworkCondition()
    };
  }

  private detectBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private detectBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }

  private detectOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private detectNetworkCondition(): string {
    // @ts-ignore - navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      return `${connection.effectiveType} (${connection.downlink}Mbps)`;
    }
    return 'Unknown';
  }

  // Element Utilities
  async waitForElement(selector: string, timeout = 10000): Promise<Element | null> {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  async waitForElementToDisappear(selector: string, timeout = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (!element) {
          resolve(true);
          return;
        }
        setTimeout(checkElement, 100);
      };

      checkElement();
      setTimeout(() => resolve(false), timeout);
    });
  }

  isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      parseFloat(style.opacity) > 0
    );
  }

  // Interaction Utilities
  async clickElement(selector: string): Promise<boolean> {
    const element = await this.waitForElement(selector);
    if (!element) return false;

    try {
      (element as HTMLElement).click();
      await this.sleep(100); // Small delay for UI updates
      return true;
    } catch (error) {
      console.error(`Failed to click element ${selector}:`, error);
      return false;
    }
  }

  async inputText(selector: string, text: string): Promise<boolean> {
    const element = await this.waitForElement(selector) as HTMLInputElement;
    if (!element) return false;

    try {
      element.focus();
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (error) {
      console.error(`Failed to input text to ${selector}:`, error);
      return false;
    }
  }

  async scrollToElement(selector: string): Promise<boolean> {
    const element = await this.waitForElement(selector);
    if (!element) return false;

    try {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(500); // Wait for scroll animation
      return true;
    } catch (error) {
      console.error(`Failed to scroll to element ${selector}:`, error);
      return false;
    }
  }

  // Data Validation Utilities
  validateNumericValue(actual: number, expected: number, tolerance = 0.01): boolean {
    const diff = Math.abs(actual - expected);
    const maxDiff = Math.abs(expected * tolerance);
    return diff <= maxDiff;
  }

  validateStringFormat(value: string, pattern: RegExp): boolean {
    return pattern.test(value);
  }

  validateDateRange(date: Date, minDate?: Date, maxDate?: Date): boolean {
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    return true;
  }

  // Performance Utilities
  async measurePageLoadTime(): Promise<number> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        resolve(perfData.loadEventEnd - perfData.fetchStart);
      } else {
        window.addEventListener('load', () => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          resolve(perfData.loadEventEnd - perfData.fetchStart);
        });
      }
    });
  }

  async measureApiResponseTime(url: string): Promise<number> {
    const startTime = performance.now();
    try {
      await fetch(url);
      return performance.now() - startTime;
    } catch (error) {
      return -1; // Error indicator
    }
  }

  getMemoryUsage(): number {
    // @ts-ignore - performance.memory is Chrome-specific
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return -1;
  }

  // Screenshot Utilities
  async captureScreenshot(elementSelector?: string): Promise<string> {
    try {
      // This would integrate with a screenshot library like html2canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (elementSelector) {
        const element = document.querySelector(elementSelector);
        if (element) {
          const rect = element.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
          // Simplified screenshot logic - in real implementation would use html2canvas
          ctx?.fillRect(0, 0, rect.width, rect.height);
        }
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx?.fillRect(0, 0, window.innerWidth, window.innerHeight);
      }

      const screenshotId = `screenshot_${++this.screenshotCounter}_${Date.now()}`;
      return canvas.toDataURL();
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return '';
    }
  }

  // Test Result Utilities
  createTestResult(
    testName: string,
    status: TestStatus,
    details: string,
    category: TestCategory,
    executionTime: number,
    errors?: string[],
    screenshots?: string[]
  ): TestResult {
    return {
      testName,
      status,
      executionTime,
      details,
      errors,
      screenshots,
      timestamp: new Date(),
      category
    };
  }

  // Utility Functions
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateRandomString(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  formatCurrency(amount: number, currency = 'SEI'): string {
    return `${amount.toFixed(6)} ${currency}`;
  }

  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

  // Error Handling Utilities
  handleTestError(error: Error, testName: string): TestResult {
    console.error(`Test ${testName} failed:`, error);
    
    return this.createTestResult(
      testName,
      TestStatus.FAILED,
      `Test failed with error: ${error.message}`,
      TestCategory.UI,
      0,
      [error.message, error.stack || '']
    );
  }

  // Network Utilities
  async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/health', { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Local Storage Utilities
  saveTestData(key: string, data: any): void {
    try {
      localStorage.setItem(`seiMoney_test_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save test data:', error);
    }
  }

  loadTestData(key: string): any {
    try {
      const data = localStorage.getItem(`seiMoney_test_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load test data:', error);
      return null;
    }
  }

  clearTestData(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('seiMoney_test_'));
    keys.forEach(key => localStorage.removeItem(key));
  }

  // Wallet Testing Utilities
  async detectWalletAvailability(): Promise<{ keplr: boolean; leap: boolean; metamask: boolean }> {
    return {
      keplr: !!(window as any).keplr,
      leap: !!(window as any).leap,
      metamask: !!(window as any).ethereum
    };
  }

  // API Testing Utilities
  async testApiEndpoint(url: string, method = 'GET', data?: any): Promise<{
    success: boolean;
    status: number;
    responseTime: number;
    data?: any;
    error?: string;
  }> {
    const startTime = performance.now();
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseTime = performance.now() - startTime;
      const responseData = await response.json();

      return {
        success: response.ok,
        status: response.status,
        responseTime,
        data: responseData
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const testUtils = TestUtilities.getInstance();