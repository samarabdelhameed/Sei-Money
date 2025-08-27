import { Browser, BrowserContext, Page, chromium, firefox, webkit, Locator } from 'playwright';
import { TestConfig, Logger } from '../types';
import { getLogger, createChildLogger } from '../utils/logger';

export interface UIAutomationConfig {
  browser: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  timeout: number;
  screenshotOnFailure: boolean;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface FormField {
  selector: string;
  value: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'radio';
  waitForVisible?: boolean;
}

export interface NavigationOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
}

export interface ElementInteractionOptions {
  timeout?: number;
  force?: boolean;
  waitForVisible?: boolean;
  screenshot?: boolean;
}

/**
 * UI Automation class for browser automation using Playwright
 */
export class UIAutomation {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: UIAutomationConfig;
  private logger: Logger;
  private screenshotCounter = 0;

  constructor(config: TestConfig) {
    this.config = {
      browser: 'chromium',
      headless: config.browser.headless,
      timeout: config.browser.timeout,
      screenshotOnFailure: config.browser.screenshotOnFailure,
      viewport: {
        width: 1280,
        height: 720,
      },
    };
    
    this.logger = createChildLogger(getLogger(), { component: 'UIAutomation' });
  }

  /**
   * Initialize browser and create new page
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing UI automation...', {
      browser: this.config.browser,
      headless: this.config.headless,
    });

    try {
      // Launch browser based on configuration
      switch (this.config.browser) {
        case 'firefox':
          this.browser = await firefox.launch({
            headless: this.config.headless,
            timeout: this.config.timeout,
          });
          break;
        case 'webkit':
          this.browser = await webkit.launch({
            headless: this.config.headless,
            timeout: this.config.timeout,
          });
          break;
        case 'chromium':
        default:
          this.browser = await chromium.launch({
            headless: this.config.headless,
            timeout: this.config.timeout,
          });
          break;
      }

      // Create browser context
      this.context = await this.browser.newContext({
        viewport: this.config.viewport || null,
        ignoreHTTPSErrors: true,
      });

      // Create new page
      this.page = await this.context.newPage();

      // Set default timeout
      this.page.setDefaultTimeout(this.config.timeout);

      this.logger.info('UI automation initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize UI automation', { error });
      throw error;
    }
  }

  /**
   * Navigate to a URL
   */
  async navigateTo(url: string, options: NavigationOptions = {}): Promise<void> {
    if (!this.page) {
      throw new Error('UI automation not initialized. Call initialize() first.');
    }

    this.logger.info(`Navigating to: ${url}`, options);

    try {
      await this.page.goto(url, {
        waitUntil: options.waitUntil || 'domcontentloaded',
        timeout: options.timeout || this.config.timeout,
      });

      this.logger.info(`Successfully navigated to: ${url}`);
    } catch (error) {
      this.logger.error(`Failed to navigate to: ${url}`, { error });
      
      if (this.config.screenshotOnFailure) {
        await this.takeScreenshot(`navigation-error-${Date.now()}`);
      }
      
      throw error;
    }
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string, options: ElementInteractionOptions = {}): Promise<Locator> {
    if (!this.page) {
      throw new Error('UI automation not initialized. Call initialize() first.');
    }

    this.logger.debug(`Waiting for element: ${selector}`, options);

    try {
      const element = this.page.locator(selector);
      
      if (options.waitForVisible !== false) {
        await element.waitFor({
          state: 'visible',
          timeout: options.timeout || this.config.timeout,
        });
      }

      this.logger.debug(`Element found: ${selector}`);
      return element;
    } catch (error) {
      this.logger.error(`Element not found: ${selector}`, { error });
      
      if (this.config.screenshotOnFailure) {
        await this.takeScreenshot(`element-not-found-${Date.now()}`);
      }
      
      throw error;
    }
  }

  /**
   * Click on an element
   */
  async clickElement(selector: string, options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info(`Clicking element: ${selector}`, options);

    try {
      const element = await this.waitForElement(selector, options);
      
      await element.click({
        force: options.force || false,
        timeout: options.timeout || this.config.timeout,
      });

      this.logger.info(`Successfully clicked: ${selector}`);

      if (options.screenshot) {
        await this.takeScreenshot(`after-click-${this.screenshotCounter++}`);
      }
    } catch (error) {
      this.logger.error(`Failed to click element: ${selector}`, { error });
      
      if (this.config.screenshotOnFailure) {
        await this.takeScreenshot(`click-error-${Date.now()}`);
      }
      
      throw error;
    }
  }

  /**
   * Fill text in an input field
   */
  async fillField(selector: string, value: string, options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info(`Filling field: ${selector} with value: ${value}`, options);

    try {
      const element = await this.waitForElement(selector, options);
      
      // Clear existing content first
      await element.clear();
      
      // Fill with new value
      await element.fill(value, {
        timeout: options.timeout || this.config.timeout,
      });

      this.logger.info(`Successfully filled field: ${selector}`);

      if (options.screenshot) {
        await this.takeScreenshot(`after-fill-${this.screenshotCounter++}`);
      }
    } catch (error) {
      this.logger.error(`Failed to fill field: ${selector}`, { error });
      
      if (this.config.screenshotOnFailure) {
        await this.takeScreenshot(`fill-error-${Date.now()}`);
      }
      
      throw error;
    }
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: string, value: string, options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info(`Selecting option: ${value} from: ${selector}`, options);

    try {
      const element = await this.waitForElement(selector, options);
      
      await element.selectOption(value, {
        timeout: options.timeout || this.config.timeout,
      });

      this.logger.info(`Successfully selected option: ${value}`);

      if (options.screenshot) {
        await this.takeScreenshot(`after-select-${this.screenshotCounter++}`);
      }
    } catch (error) {
      this.logger.error(`Failed to select option: ${value} from: ${selector}`, { error });
      
      if (this.config.screenshotOnFailure) {
        await this.takeScreenshot(`select-error-${Date.now()}`);
      }
      
      throw error;
    }
  }

  /**
   * Fill multiple form fields
   */
  async fillForm(fields: FormField[], options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info(`Filling form with ${fields.length} fields`, { fields: fields.map(f => f.selector) });

    try {
      for (const field of fields) {
        const fieldOptions = {
          ...options,
          waitForVisible: field.waitForVisible !== false,
        };

        switch (field.type) {
          case 'select':
            await this.selectOption(field.selector, field.value, fieldOptions);
            break;
          case 'checkbox':
            await this.setCheckbox(field.selector, field.value === 'true', fieldOptions);
            break;
          case 'radio':
            await this.selectRadio(field.selector, field.value, fieldOptions);
            break;
          default:
            await this.fillField(field.selector, field.value, fieldOptions);
            break;
        }

        // Small delay between fields to avoid race conditions
        await this.page!.waitForTimeout(100);
      }

      this.logger.info('Successfully filled all form fields');

      if (options.screenshot) {
        await this.takeScreenshot(`form-filled-${this.screenshotCounter++}`);
      }
    } catch (error) {
      this.logger.error('Failed to fill form', { error });
      
      if (this.config.screenshotOnFailure) {
        await this.takeScreenshot(`form-error-${Date.now()}`);
      }
      
      throw error;
    }
  }

  /**
   * Set checkbox state
   */
  async setCheckbox(selector: string, checked: boolean, options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info(`Setting checkbox: ${selector} to: ${checked}`, options);

    try {
      const element = await this.waitForElement(selector, options);
      
      await element.setChecked(checked, {
        timeout: options.timeout || this.config.timeout,
      });

      this.logger.info(`Successfully set checkbox: ${selector} to: ${checked}`);
    } catch (error) {
      this.logger.error(`Failed to set checkbox: ${selector}`, { error });
      
      if (this.config.screenshotOnFailure) {
        await this.takeScreenshot(`checkbox-error-${Date.now()}`);
      }
      
      throw error;
    }
  }

  /**
   * Select radio button
   */
  async selectRadio(selector: string, value: string, options: ElementInteractionOptions = {}): Promise<void> {
    this.logger.info(`Selecting radio: ${selector} with value: ${value}`, options);

    try {
      const radioSelector = `${selector}[value="${value}"]`;
      const element = await this.waitForElement(radioSelector, options);
      
      await element.check({
        timeout: options.timeout || this.config.timeout,
      });

      this.logger.info(`Successfully selected radio: ${value}`);
    } catch (error) {
      this.logger.error(`Failed to select radio: ${selector}`, { error });
      
      if (this.config.screenshotOnFailure) {
        await this.takeScreenshot(`radio-error-${Date.now()}`);
      }
      
      throw error;
    }
  }

  /**
   * Get text content of an element
   */
  async getElementText(selector: string, options: ElementInteractionOptions = {}): Promise<string> {
    this.logger.debug(`Getting text from element: ${selector}`, options);

    try {
      const element = await this.waitForElement(selector, options);
      const text = await element.textContent();
      
      this.logger.debug(`Element text: ${text}`);
      return text || '';
    } catch (error) {
      this.logger.error(`Failed to get text from element: ${selector}`, { error });
      
      if (this.config.screenshotOnFailure) {
        await this.takeScreenshot(`get-text-error-${Date.now()}`);
      }
      
      throw error;
    }
  }

  /**
   * Get attribute value of an element
   */
  async getElementAttribute(selector: string, attribute: string, options: ElementInteractionOptions = {}): Promise<string | null> {
    this.logger.debug(`Getting attribute ${attribute} from element: ${selector}`, options);

    try {
      const element = await this.waitForElement(selector, options);
      const value = await element.getAttribute(attribute);
      
      this.logger.debug(`Element attribute ${attribute}: ${value}`);
      return value;
    } catch (error) {
      this.logger.error(`Failed to get attribute ${attribute} from element: ${selector}`, { error });
      
      if (this.config.screenshotOnFailure) {
        await this.takeScreenshot(`get-attribute-error-${Date.now()}`);
      }
      
      throw error;
    }
  }

  /**
   * Check if element exists and is visible
   */
  async isElementVisible(selector: string, timeout: number = 5000): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      const element = this.page.locator(selector);
      await element.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad(timeout?: number): Promise<void> {
    if (!this.page) {
      throw new Error('UI automation not initialized. Call initialize() first.');
    }

    this.logger.debug('Waiting for page to load completely');

    try {
      await this.page.waitForLoadState('networkidle', {
        timeout: timeout || this.config.timeout,
      });

      this.logger.debug('Page loaded completely');
    } catch (error) {
      this.logger.error('Page load timeout', { error });
      throw error;
    }
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(filename?: string): Promise<string> {
    if (!this.page) {
      throw new Error('UI automation not initialized. Call initialize() first.');
    }

    const screenshotName = filename || `screenshot-${Date.now()}`;
    const screenshotPath = `screenshots/${screenshotName}.png`;

    try {
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      this.logger.info(`Screenshot saved: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      this.logger.error('Failed to take screenshot', { error });
      throw error;
    }
  }

  /**
   * Execute JavaScript in the browser
   */
  async executeScript<T = any>(script: string | Function, ...args: any[]): Promise<T> {
    if (!this.page) {
      throw new Error('UI automation not initialized. Call initialize() first.');
    }

    this.logger.debug('Executing JavaScript', { script: typeof script === 'function' ? script.toString() : script });

    try {
      const result = await this.page.evaluate(script as any, ...args);
      this.logger.debug('JavaScript executed successfully', { result });
      return result as T;
    } catch (error) {
      this.logger.error('Failed to execute JavaScript', { error, script: typeof script === 'function' ? script.toString() : script });
      throw error;
    }
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string {
    if (!this.page) {
      throw new Error('UI automation not initialized. Call initialize() first.');
    }

    return this.page.url();
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    if (!this.page) {
      throw new Error('UI automation not initialized. Call initialize() first.');
    }

    return await this.page.title();
  }

  /**
   * Refresh the page
   */
  async refreshPage(): Promise<void> {
    if (!this.page) {
      throw new Error('UI automation not initialized. Call initialize() first.');
    }

    this.logger.info('Refreshing page');

    try {
      await this.page.reload({
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout,
      });

      this.logger.info('Page refreshed successfully');
    } catch (error) {
      this.logger.error('Failed to refresh page', { error });
      throw error;
    }
  }

  /**
   * Close browser and cleanup
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up UI automation...');

    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }

      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.logger.info('UI automation cleanup completed');
    } catch (error) {
      this.logger.error('Error during UI automation cleanup', { error });
      throw error;
    }
  }

  /**
   * Get current page instance (for advanced operations)
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Get current browser context (for advanced operations)
   */
  getContext(): BrowserContext | null {
    return this.context;
  }
}