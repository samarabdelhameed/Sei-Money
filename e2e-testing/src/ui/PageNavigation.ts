import { UIAutomation, NavigationOptions } from './UIAutomation';
import { Logger } from '../types';
import { getLogger, createChildLogger } from '../utils/logger';

export interface SeiMoneyPages {
  dashboard: string;
  payments: string;
  groups: string;
  pots: string;
  vaults: string;
  profile: string;
  settings: string;
}

export interface NavigationResult {
  success: boolean;
  url: string;
  title: string;
  loadTime: number;
  error?: string;
}

/**
 * Page navigation utilities for SeiMoney platform
 */
export class PageNavigation {
  private uiAutomation: UIAutomation;
  private logger: Logger;
  private baseUrl: string;
  private pages: SeiMoneyPages;

  constructor(uiAutomation: UIAutomation, baseUrl: string = 'http://localhost:3000') {
    this.uiAutomation = uiAutomation;
    this.logger = createChildLogger(getLogger(), { component: 'PageNavigation' });
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    
    this.pages = {
      dashboard: `${this.baseUrl}/dashboard`,
      payments: `${this.baseUrl}/payments`,
      groups: `${this.baseUrl}/groups`,
      pots: `${this.baseUrl}/pots`,
      vaults: `${this.baseUrl}/vaults`,
      profile: `${this.baseUrl}/profile`,
      settings: `${this.baseUrl}/settings`,
    };
  }

  /**
   * Navigate to dashboard page
   */
  async goToDashboard(options: NavigationOptions = {}): Promise<NavigationResult> {
    return this.navigateToPage('dashboard', this.pages.dashboard, options);
  }

  /**
   * Navigate to payments page
   */
  async goToPayments(options: NavigationOptions = {}): Promise<NavigationResult> {
    return this.navigateToPage('payments', this.pages.payments, options);
  }

  /**
   * Navigate to groups page
   */
  async goToGroups(options: NavigationOptions = {}): Promise<NavigationResult> {
    return this.navigateToPage('groups', this.pages.groups, options);
  }

  /**
   * Navigate to pots page
   */
  async goToPots(options: NavigationOptions = {}): Promise<NavigationResult> {
    return this.navigateToPage('pots', this.pages.pots, options);
  }

  /**
   * Navigate to vaults page
   */
  async goToVaults(options: NavigationOptions = {}): Promise<NavigationResult> {
    return this.navigateToPage('vaults', this.pages.vaults, options);
  }

  /**
   * Navigate to profile page
   */
  async goToProfile(options: NavigationOptions = {}): Promise<NavigationResult> {
    return this.navigateToPage('profile', this.pages.profile, options);
  }

  /**
   * Navigate to settings page
   */
  async goToSettings(options: NavigationOptions = {}): Promise<NavigationResult> {
    return this.navigateToPage('settings', this.pages.settings, options);
  }

  /**
   * Navigate using navbar links
   */
  async navigateViaNavbar(pageName: keyof SeiMoneyPages): Promise<NavigationResult> {
    this.logger.info(`Navigating to ${pageName} via navbar`);

    const startTime = Date.now();

    try {
      // Common navbar selectors for SeiMoney platform
      const navbarSelectors = [
        `[data-testid="nav-${pageName}"]`,
        `[data-testid="${pageName}-nav"]`,
        `nav a[href*="${pageName}"]`,
        `.navbar a[href*="${pageName}"]`,
        `a:has-text("${this.capitalizeFirst(pageName)}")`,
      ];

      let navigationSuccess = false;
      let clickedSelector = '';

      for (const selector of navbarSelectors) {
        if (await this.uiAutomation.isElementVisible(selector, 2000)) {
          await this.uiAutomation.clickElement(selector);
          clickedSelector = selector;
          navigationSuccess = true;
          break;
        }
      }

      if (!navigationSuccess) {
        throw new Error(`Navbar link for ${pageName} not found`);
      }

      // Wait for navigation to complete
      await this.uiAutomation.waitForPageLoad();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      const currentUrl = this.uiAutomation.getCurrentUrl();
      const title = await this.uiAutomation.getPageTitle();

      this.logger.info(`Successfully navigated to ${pageName} via navbar`, {
        selector: clickedSelector,
        url: currentUrl,
        loadTime,
      });

      return {
        success: true,
        url: currentUrl,
        title,
        loadTime,
      };
    } catch (error: any) {
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      this.logger.error(`Failed to navigate to ${pageName} via navbar`, { error });

      return {
        success: false,
        url: this.uiAutomation.getCurrentUrl(),
        title: await this.uiAutomation.getPageTitle().catch(() => ''),
        loadTime,
        error: error.message,
      };
    }
  }

  /**
   * Navigate using browser back button
   */
  async goBack(): Promise<NavigationResult> {
    this.logger.info('Navigating back');

    const startTime = Date.now();

    try {
      const page = this.uiAutomation.getPage();
      if (!page) {
        throw new Error('UI automation not initialized');
      }

      await page.goBack();
      await this.uiAutomation.waitForPageLoad();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      const currentUrl = this.uiAutomation.getCurrentUrl();
      const title = await this.uiAutomation.getPageTitle();

      this.logger.info('Successfully navigated back', { url: currentUrl, loadTime });

      return {
        success: true,
        url: currentUrl,
        title,
        loadTime,
      };
    } catch (error: any) {
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      this.logger.error('Failed to navigate back', { error });

      return {
        success: false,
        url: this.uiAutomation.getCurrentUrl(),
        title: await this.uiAutomation.getPageTitle().catch(() => ''),
        loadTime,
        error: error.message,
      };
    }
  }

  /**
   * Navigate using browser forward button
   */
  async goForward(): Promise<NavigationResult> {
    this.logger.info('Navigating forward');

    const startTime = Date.now();

    try {
      const page = this.uiAutomation.getPage();
      if (!page) {
        throw new Error('UI automation not initialized');
      }

      await page.goForward();
      await this.uiAutomation.waitForPageLoad();

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      const currentUrl = this.uiAutomation.getCurrentUrl();
      const title = await this.uiAutomation.getPageTitle();

      this.logger.info('Successfully navigated forward', { url: currentUrl, loadTime });

      return {
        success: true,
        url: currentUrl,
        title,
        loadTime,
      };
    } catch (error: any) {
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      this.logger.error('Failed to navigate forward', { error });

      return {
        success: false,
        url: this.uiAutomation.getCurrentUrl(),
        title: await this.uiAutomation.getPageTitle().catch(() => ''),
        loadTime,
        error: error.message,
      };
    }
  }

  /**
   * Wait for specific page to load by checking URL and elements
   */
  async waitForPage(pageName: keyof SeiMoneyPages, timeout: number = 10000): Promise<boolean> {
    this.logger.debug(`Waiting for ${pageName} page to load`);

    const startTime = Date.now();

    try {
      // Wait for URL to match
      while (Date.now() - startTime < timeout) {
        const currentUrl = this.uiAutomation.getCurrentUrl();
        if (currentUrl.includes(pageName)) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Wait for page-specific elements to be visible
      const pageElements = this.getPageElements(pageName);
      for (const element of pageElements) {
        await this.uiAutomation.waitForElement(element.selector, { timeout: 5000 });
      }

      this.logger.debug(`${pageName} page loaded successfully`);
      return true;
    } catch (error: any) {
      this.logger.warn(`Timeout waiting for ${pageName} page to load`, { error });
      return false;
    }
  }

  /**
   * Validate current page matches expected page
   */
  async validateCurrentPage(expectedPage: keyof SeiMoneyPages): Promise<boolean> {
    this.logger.debug(`Validating current page is ${expectedPage}`);

    try {
      const currentUrl = this.uiAutomation.getCurrentUrl();
      const title = await this.uiAutomation.getPageTitle();

      // Check URL contains expected page name
      const urlMatches = currentUrl.includes(expectedPage);

      // Check for page-specific elements
      const pageElements = this.getPageElements(expectedPage);
      let elementsFound = 0;

      for (const element of pageElements) {
        if (await this.uiAutomation.isElementVisible(element.selector, 2000)) {
          elementsFound++;
        }
      }

      const elementsMatch = elementsFound >= Math.ceil(pageElements.length / 2); // At least half should be visible

      const isValid = urlMatches && elementsMatch;

      this.logger.debug(`Page validation result for ${expectedPage}`, {
        urlMatches,
        elementsMatch,
        elementsFound,
        totalElements: pageElements.length,
        currentUrl,
        title,
        isValid,
      });

      return isValid;
    } catch (error: any) {
      this.logger.error(`Failed to validate current page`, { error });
      return false;
    }
  }

  /**
   * Get current page name based on URL
   */
  getCurrentPageName(): keyof SeiMoneyPages | 'unknown' {
    const currentUrl = this.uiAutomation.getCurrentUrl();

    for (const pageName of Object.keys(this.pages)) {
      if (currentUrl.includes(pageName)) {
        return pageName as keyof SeiMoneyPages;
      }
    }

    return 'unknown';
  }

  /**
   * Navigate to a specific page with validation
   */
  private async navigateToPage(
    pageName: string,
    url: string,
    options: NavigationOptions = {}
  ): Promise<NavigationResult> {
    this.logger.info(`Navigating to ${pageName} page`, { url });

    const startTime = Date.now();

    try {
      await this.uiAutomation.navigateTo(url, options);

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      const currentUrl = this.uiAutomation.getCurrentUrl();
      const title = await this.uiAutomation.getPageTitle();

      this.logger.info(`Successfully navigated to ${pageName}`, {
        url: currentUrl,
        title,
        loadTime,
      });

      return {
        success: true,
        url: currentUrl,
        title,
        loadTime,
      };
    } catch (error: any) {
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      this.logger.error(`Failed to navigate to ${pageName}`, { error });

      return {
        success: false,
        url: this.uiAutomation.getCurrentUrl(),
        title: await this.uiAutomation.getPageTitle().catch(() => ''),
        loadTime,
        error: error.message,
      };
    }
  }

  /**
   * Get expected elements for each page
   */
  private getPageElements(pageName: keyof SeiMoneyPages): Array<{ selector: string; name: string }> {
    const elementMap: Record<keyof SeiMoneyPages, Array<{ selector: string; name: string }>> = {
      dashboard: [
        { selector: '[data-testid="dashboard-title"], h1:has-text("Dashboard")', name: 'Dashboard Title' },
        { selector: '[data-testid="portfolio-total"], .portfolio-total', name: 'Portfolio Total' },
        { selector: '[data-testid="refresh-button"], button:has-text("Refresh")', name: 'Refresh Button' },
      ],
      payments: [
        { selector: '[data-testid="payments-title"], h1:has-text("Payments")', name: 'Payments Title' },
        { selector: '[data-testid="create-transfer-button"], button:has-text("Create Transfer")', name: 'Create Transfer Button' },
        { selector: '[data-testid="my-transfers"], .my-transfers', name: 'My Transfers Section' },
      ],
      groups: [
        { selector: '[data-testid="groups-title"], h1:has-text("Groups")', name: 'Groups Title' },
        { selector: '[data-testid="create-group-button"], button:has-text("Create Group")', name: 'Create Group Button' },
        { selector: '[data-testid="groups-list"], .groups-list', name: 'Groups List' },
      ],
      pots: [
        { selector: '[data-testid="pots-title"], h1:has-text("Pots")', name: 'Pots Title' },
        { selector: '[data-testid="create-pot-button"], button:has-text("Create Pot")', name: 'Create Pot Button' },
        { selector: '[data-testid="pots-list"], .pots-list', name: 'Pots List' },
      ],
      vaults: [
        { selector: '[data-testid="vaults-title"], h1:has-text("Vaults")', name: 'Vaults Title' },
        { selector: '[data-testid="create-vault-button"], button:has-text("Create Vault")', name: 'Create Vault Button' },
        { selector: '[data-testid="vaults-list"], .vaults-list', name: 'Vaults List' },
      ],
      profile: [
        { selector: '[data-testid="profile-title"], h1:has-text("Profile")', name: 'Profile Title' },
        { selector: '[data-testid="wallet-address"], .wallet-address', name: 'Wallet Address' },
        { selector: '[data-testid="profile-form"], form', name: 'Profile Form' },
      ],
      settings: [
        { selector: '[data-testid="settings-title"], h1:has-text("Settings")', name: 'Settings Title' },
        { selector: '[data-testid="settings-form"], form', name: 'Settings Form' },
        { selector: '[data-testid="save-settings-button"], button:has-text("Save")', name: 'Save Settings Button' },
      ],
    };

    return elementMap[pageName] || [];
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Update base URL for navigation
   */
  updateBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl.replace(/\/$/, '');
    
    this.pages = {
      dashboard: `${this.baseUrl}/dashboard`,
      payments: `${this.baseUrl}/payments`,
      groups: `${this.baseUrl}/groups`,
      pots: `${this.baseUrl}/pots`,
      vaults: `${this.baseUrl}/vaults`,
      profile: `${this.baseUrl}/profile`,
      settings: `${this.baseUrl}/settings`,
    };

    this.logger.info('Base URL updated', { newBaseUrl, pages: this.pages });
  }

  /**
   * Get all available pages
   */
  getAvailablePages(): SeiMoneyPages {
    return { ...this.pages };
  }
}