// Visual validation utilities
import { UIAutomation } from './UIAutomation';
import { Logger } from '../types';
import { getLogger, createChildLogger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export interface VisualComparisonOptions {
  threshold?: number;
  maxDiffPixels?: number;
  ignoreRegions?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  quality?: number;
  type?: 'png' | 'jpeg';
}

export interface VisualValidationResult {
  isValid: boolean;
  differences?: number;
  screenshotPath?: string;
  baselinePath?: string;
  diffPath?: string;
  error?: string;
}

/**
 * Visual validation utilities for screenshot comparison and UI validation
 */
export class VisualValidation {
  private uiAutomation: UIAutomation;
  private logger: Logger;
  private baselineDir: string;
  private screenshotDir: string;
  private diffDir: string;

  constructor(uiAutomation: UIAutomation) {
    this.uiAutomation = uiAutomation;
    this.logger = createChildLogger(getLogger(), { component: 'VisualValidation' });
    
    this.baselineDir = 'screenshots/baseline';
    this.screenshotDir = 'screenshots/current';
    this.diffDir = 'screenshots/diff';

    this.ensureDirectories();
  }

  /**
   * Take screenshot of current page
   */
  async takeScreenshot(name: string, options: ScreenshotOptions = {}): Promise<string> {
    this.logger.info(`Taking screenshot: ${name}`, options);

    const page = this.uiAutomation.getPage();
    if (!page) {
      throw new Error('UI automation not initialized');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.${options.type || 'png'}`;
    const screenshotPath = path.join(this.screenshotDir, filename);

    try {
      const screenshotOptions: any = {
        path: screenshotPath,
        fullPage: options.fullPage !== false,
        type: options.type || 'png',
      };
      
      if (options.clip) {
        screenshotOptions.clip = options.clip;
      }
      
      if (options.quality) {
        screenshotOptions.quality = options.quality;
      }

      await page.screenshot(screenshotOptions);

      this.logger.info(`Screenshot saved: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      this.logger.error(`Failed to take screenshot: ${name}`, { error });
      throw error;
    }
  }

  /**
   * Take screenshot of specific element
   */
  async takeElementScreenshot(selector: string, name: string, options: ScreenshotOptions = {}): Promise<string> {
    this.logger.info(`Taking element screenshot: ${selector}`, { name, options });

    const page = this.uiAutomation.getPage();
    if (!page) {
      throw new Error('UI automation not initialized');
    }

    try {
      const element = await this.uiAutomation.waitForElement(selector);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${name}-element-${timestamp}.${options.type || 'png'}`;
      const screenshotPath = path.join(this.screenshotDir, filename);

      const screenshotOptions: any = {
        path: screenshotPath,
        type: options.type || 'png',
      };
      
      if (options.quality) {
        screenshotOptions.quality = options.quality;
      }

      await element.screenshot(screenshotOptions);

      this.logger.info(`Element screenshot saved: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      this.logger.error(`Failed to take element screenshot: ${selector}`, { error });
      throw error;
    }
  }

  /**
   * Compare current screenshot with baseline
   */
  async compareWithBaseline(name: string, options: VisualComparisonOptions = {}): Promise<VisualValidationResult> {
    this.logger.info(`Comparing screenshot with baseline: ${name}`, options);

    const page = this.uiAutomation.getPage();
    if (!page) {
      throw new Error('UI automation not initialized');
    }

    const baselinePath = path.join(this.baselineDir, `${name}.png`);
    const currentPath = path.join(this.screenshotDir, `${name}-current.png`);
    const diffPath = path.join(this.diffDir, `${name}-diff.png`);

    try {
      // Take current screenshot
      await page.screenshot({
        path: currentPath,
        fullPage: true,
      });

      // Check if baseline exists
      if (!fs.existsSync(baselinePath)) {
        this.logger.warn(`Baseline not found: ${baselinePath}. Creating new baseline.`);
        fs.copyFileSync(currentPath, baselinePath);
        
        return {
          isValid: true,
          screenshotPath: currentPath,
          baselinePath,
        };
      }

      // Take current screenshot for comparison
      await page.screenshot({
        path: currentPath,
        fullPage: true,
      });

      // For now, we'll implement a basic comparison
      // In a real implementation, you might use a library like pixelmatch
      const isValid = await this.compareImages(baselinePath, currentPath, diffPath, options);

      const result: VisualValidationResult = {
        isValid,
        screenshotPath: currentPath,
        baselinePath,
      };
      
      if (!isValid) {
        result.diffPath = diffPath;
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to compare with baseline: ${name}`, { error });
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate UI elements are present and visible
   */
  async validateUIElements(elements: Array<{ selector: string; name: string; required?: boolean }>): Promise<VisualValidationResult> {
    this.logger.info('Validating UI elements', { count: elements.length });

    const missingElements: string[] = [];
    const foundElements: string[] = [];

    try {
      for (const element of elements) {
        const isVisible = await this.uiAutomation.isElementVisible(element.selector, 5000);
        
        if (isVisible) {
          foundElements.push(element.name);
          this.logger.debug(`Element found: ${element.name}`);
        } else {
          if (element.required !== false) {
            missingElements.push(element.name);
            this.logger.warn(`Required element missing: ${element.name} (${element.selector})`);
          } else {
            this.logger.debug(`Optional element not found: ${element.name}`);
          }
        }
      }

      const isValid = missingElements.length === 0;
      
      if (!isValid) {
        // Take screenshot of current state for debugging
        const screenshotPath = await this.takeScreenshot('ui-validation-failed');
        
        return {
          isValid: false,
          screenshotPath,
          error: `Missing required elements: ${missingElements.join(', ')}`,
        };
      }

      this.logger.info('UI elements validation passed', {
        found: foundElements.length,
        missing: missingElements.length,
      });

      return {
        isValid: true,
      };
    } catch (error) {
      this.logger.error('Failed to validate UI elements', { error });
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate page layout and structure
   */
  async validatePageLayout(expectedLayout: {
    title?: string;
    url?: string;
    elements: Array<{ selector: string; name: string; text?: string; attribute?: { name: string; value: string } }>;
  }): Promise<VisualValidationResult> {
    this.logger.info('Validating page layout', { url: expectedLayout.url, title: expectedLayout.title });

    const validationErrors: string[] = [];

    try {
      // Validate page title
      if (expectedLayout.title) {
        const actualTitle = await this.uiAutomation.getPageTitle();
        if (actualTitle !== expectedLayout.title) {
          validationErrors.push(`Title mismatch: expected "${expectedLayout.title}", got "${actualTitle}"`);
        }
      }

      // Validate page URL
      if (expectedLayout.url) {
        const actualUrl = this.uiAutomation.getCurrentUrl();
        if (!actualUrl.includes(expectedLayout.url)) {
          validationErrors.push(`URL mismatch: expected to contain "${expectedLayout.url}", got "${actualUrl}"`);
        }
      }

      // Validate elements
      for (const element of expectedLayout.elements) {
        const isVisible = await this.uiAutomation.isElementVisible(element.selector, 5000);
        
        if (!isVisible) {
          validationErrors.push(`Element not found: ${element.name} (${element.selector})`);
          continue;
        }

        // Validate element text if specified
        if (element.text) {
          const actualText = await this.uiAutomation.getElementText(element.selector);
          if (!actualText.includes(element.text)) {
            validationErrors.push(`Text mismatch in ${element.name}: expected to contain "${element.text}", got "${actualText}"`);
          }
        }

        // Validate element attribute if specified
        if (element.attribute) {
          const actualValue = await this.uiAutomation.getElementAttribute(element.selector, element.attribute.name);
          if (actualValue !== element.attribute.value) {
            validationErrors.push(`Attribute mismatch in ${element.name}: expected ${element.attribute.name}="${element.attribute.value}", got "${actualValue}"`);
          }
        }
      }

      const isValid = validationErrors.length === 0;

      if (!isValid) {
        // Take screenshot for debugging
        const screenshotPath = await this.takeScreenshot('layout-validation-failed');
        
        return {
          isValid: false,
          screenshotPath,
          error: validationErrors.join('; '),
        };
      }

      this.logger.info('Page layout validation passed');
      return {
        isValid: true,
      };
    } catch (error) {
      this.logger.error('Failed to validate page layout', { error });
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create baseline screenshot for future comparisons
   */
  async createBaseline(name: string, options: ScreenshotOptions = {}): Promise<string> {
    this.logger.info(`Creating baseline screenshot: ${name}`);

    const page = this.uiAutomation.getPage();
    if (!page) {
      throw new Error('UI automation not initialized');
    }

    const baselinePath = path.join(this.baselineDir, `${name}.png`);

    try {
      const screenshotOptions: any = {
        path: baselinePath,
        fullPage: options.fullPage !== false,
        type: 'png',
      };
      
      if (options.clip) {
        screenshotOptions.clip = options.clip;
      }
      
      if (options.quality) {
        screenshotOptions.quality = options.quality;
      }

      await page.screenshot(screenshotOptions);

      this.logger.info(`Baseline created: ${baselinePath}`);
      return baselinePath;
    } catch (error) {
      this.logger.error(`Failed to create baseline: ${name}`, { error });
      throw error;
    }
  }

  /**
   * Get screenshot metadata
   */
  async getScreenshotMetadata(screenshotPath: string): Promise<{
    size: number;
    created: Date;
    dimensions?: { width: number; height: number };
  }> {
    try {
      const stats = fs.statSync(screenshotPath);
      
      return {
        size: stats.size,
        created: stats.birthtime,
      };
    } catch (error) {
      this.logger.error(`Failed to get screenshot metadata: ${screenshotPath}`, { error });
      throw error;
    }
  }

  /**
   * Clean up old screenshots
   */
  async cleanupOldScreenshots(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    this.logger.info('Cleaning up old screenshots', { maxAge });

    const directories = [this.screenshotDir, this.diffDir];
    const cutoffTime = Date.now() - maxAge;

    try {
      for (const dir of directories) {
        if (!fs.existsSync(dir)) continue;

        const files = fs.readdirSync(dir);
        let deletedCount = 0;

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);

          if (stats.birthtime.getTime() < cutoffTime) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }

        this.logger.info(`Cleaned up ${deletedCount} old screenshots from ${dir}`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old screenshots', { error });
      throw error;
    }
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    const directories = [this.baselineDir, this.screenshotDir, this.diffDir];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.debug(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Basic image comparison (placeholder implementation)
   */
  private async compareImages(
    baselinePath: string,
    currentPath: string,
    diffPath: string,
    options: VisualComparisonOptions
  ): Promise<boolean> {
    // This is a simplified implementation
    // In a real scenario, you would use a library like pixelmatch or similar
    
    try {
      const baselineStats = fs.statSync(baselinePath);
      const currentStats = fs.statSync(currentPath);

      // Simple size comparison as a basic check
      const sizeDifference = Math.abs(baselineStats.size - currentStats.size);
      const threshold = options.threshold || 0.1;
      const maxSizeDiff = baselineStats.size * threshold;

      const isValid = sizeDifference <= maxSizeDiff;

      if (!isValid) {
        this.logger.warn('Image comparison failed', {
          baselineSize: baselineStats.size,
          currentSize: currentStats.size,
          sizeDifference,
          threshold: maxSizeDiff,
        });

        // Copy current as diff for now (in real implementation, generate actual diff)
        fs.copyFileSync(currentPath, diffPath);
      }

      return isValid;
    } catch (error) {
      this.logger.error('Failed to compare images', { error });
      return false;
    }
  }
}