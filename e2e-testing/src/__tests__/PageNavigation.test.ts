import { PageNavigation } from '../ui/PageNavigation';
import { UIAutomation } from '../ui/UIAutomation';
import { createTestConfig } from '../config';

describe('PageNavigation', () => {
  let pageNavigation: PageNavigation;
  let uiAutomation: UIAutomation;
  let testConfig: any;

  beforeEach(() => {
    testConfig = createTestConfig({
      environment: {
        frontendUrl: 'http://localhost:3000',
        backendUrl: 'http://localhost:8000',
        blockchainNetwork: 'sei-testnet',
        blockchainRpcUrl: 'https://rpc.sei-apis.com',
        contractAddress: 'sei1234567890abcdef',
        testWalletAddress: 'sei1test123456789',
        testWalletPrivateKey: 'test_private_key',
        testWalletMnemonic: 'test mnemonic phrase',
      },
      browser: {
        headless: true,
        timeout: 30000,
        screenshotOnFailure: false,
      },
      logging: {
        level: 'debug',
      },
    });

    uiAutomation = new UIAutomation(testConfig);
    pageNavigation = new PageNavigation(uiAutomation, 'http://localhost:3000');
  });

  afterEach(async () => {
    if (uiAutomation) {
      try {
        await uiAutomation.cleanup();
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('initialization', () => {
    it('should create PageNavigation instance', () => {
      expect(pageNavigation).toBeDefined();
    });

    it('should initialize with correct base URL and pages', () => {
      const pages = pageNavigation.getAvailablePages();
      
      expect(pages.dashboard).toBe('http://localhost:3000/dashboard');
      expect(pages.payments).toBe('http://localhost:3000/payments');
      expect(pages.groups).toBe('http://localhost:3000/groups');
      expect(pages.pots).toBe('http://localhost:3000/pots');
      expect(pages.vaults).toBe('http://localhost:3000/vaults');
      expect(pages.profile).toBe('http://localhost:3000/profile');
      expect(pages.settings).toBe('http://localhost:3000/settings');
    });

    it('should handle base URL with trailing slash', () => {
      const navWithSlash = new PageNavigation(uiAutomation, 'http://localhost:3000/');
      const pages = navWithSlash.getAvailablePages();
      
      expect(pages.dashboard).toBe('http://localhost:3000/dashboard');
      expect(pages.payments).toBe('http://localhost:3000/payments');
    });
  });

  describe('page URL generation', () => {
    it('should generate correct page URLs', () => {
      const pages = pageNavigation.getAvailablePages();
      
      expect(Object.keys(pages)).toEqual([
        'dashboard',
        'payments',
        'groups',
        'pots',
        'vaults',
        'profile',
        'settings',
      ]);

      // Check all URLs are properly formatted
      Object.values(pages).forEach(url => {
        expect(url).toMatch(/^http:\/\/localhost:3000\/\w+$/);
      });
    });

    it('should update base URL correctly', () => {
      pageNavigation.updateBaseUrl('https://seimoney.app');
      const pages = pageNavigation.getAvailablePages();
      
      expect(pages.dashboard).toBe('https://seimoney.app/dashboard');
      expect(pages.payments).toBe('https://seimoney.app/payments');
      expect(pages.groups).toBe('https://seimoney.app/groups');
    });
  });

  describe('navigation methods', () => {
    beforeEach(async () => {
      await uiAutomation.initialize();
    });

    it('should have navigation methods for all pages', () => {
      expect(typeof pageNavigation.goToDashboard).toBe('function');
      expect(typeof pageNavigation.goToPayments).toBe('function');
      expect(typeof pageNavigation.goToGroups).toBe('function');
      expect(typeof pageNavigation.goToPots).toBe('function');
      expect(typeof pageNavigation.goToVaults).toBe('function');
      expect(typeof pageNavigation.goToProfile).toBe('function');
      expect(typeof pageNavigation.goToSettings).toBe('function');
    });

    it('should handle navigation to dashboard', async () => {
      // This will fail because localhost:3000 is not running, but tests the method structure
      const result = await pageNavigation.goToDashboard();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.url).toBe('string');
      expect(typeof result.title).toBe('string');
      expect(typeof result.loadTime).toBe('number');
      
      // Should fail because server is not running
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle navigation to payments page', async () => {
      const result = await pageNavigation.goToPayments();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.loadTime).toBe('number');
      
      // Should fail because server is not running
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle browser back navigation', async () => {
      // Navigate to a test page first
      await uiAutomation.navigateTo('https://example.com');
      
      const result = await pageNavigation.goBack();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.loadTime).toBe('number');
    });

    it('should handle browser forward navigation', async () => {
      // Navigate to a test page first
      await uiAutomation.navigateTo('https://example.com');
      
      const result = await pageNavigation.goForward();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.loadTime).toBe('number');
    });
  });

  describe('page validation', () => {
    beforeEach(async () => {
      await uiAutomation.initialize();
    });

    it('should get current page name', () => {
      // Mock current URL
      jest.spyOn(uiAutomation, 'getCurrentUrl').mockReturnValue('http://localhost:3000/dashboard');
      
      const pageName = pageNavigation.getCurrentPageName();
      expect(pageName).toBe('dashboard');
    });

    it('should return unknown for unrecognized URLs', () => {
      jest.spyOn(uiAutomation, 'getCurrentUrl').mockReturnValue('http://localhost:3000/unknown-page');
      
      const pageName = pageNavigation.getCurrentPageName();
      expect(pageName).toBe('unknown');
    });

    it('should validate current page', async () => {
      // Mock current URL and page title
      jest.spyOn(uiAutomation, 'getCurrentUrl').mockReturnValue('http://localhost:3000/dashboard');
      jest.spyOn(uiAutomation, 'getPageTitle').mockResolvedValue('Dashboard - SeiMoney');
      jest.spyOn(uiAutomation, 'isElementVisible').mockResolvedValue(false);
      
      const isValid = await pageNavigation.validateCurrentPage('dashboard');
      expect(typeof isValid).toBe('boolean');
    });

    it('should wait for page to load', async () => {
      // Mock current URL
      jest.spyOn(uiAutomation, 'getCurrentUrl').mockReturnValue('http://localhost:3000/payments');
      jest.spyOn(uiAutomation, 'waitForElement').mockRejectedValue(new Error('Element not found'));
      
      const loaded = await pageNavigation.waitForPage('payments', 1000);
      expect(typeof loaded).toBe('boolean');
    });
  });

  describe('navbar navigation', () => {
    beforeEach(async () => {
      await uiAutomation.initialize();
      await uiAutomation.navigateTo('https://example.com');
    });

    it('should attempt navbar navigation', async () => {
      jest.spyOn(uiAutomation, 'isElementVisible').mockResolvedValue(false);
      
      const result = await pageNavigation.navigateViaNavbar('dashboard');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.loadTime).toBe('number');
      
      // Should fail because navbar elements don't exist on example.com
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle successful navbar navigation', async () => {
      // Mock successful element interaction
      jest.spyOn(uiAutomation, 'isElementVisible').mockResolvedValue(true);
      jest.spyOn(uiAutomation, 'clickElement').mockResolvedValue();
      jest.spyOn(uiAutomation, 'waitForPageLoad').mockResolvedValue();
      jest.spyOn(uiAutomation, 'getCurrentUrl').mockReturnValue('http://localhost:3000/payments');
      jest.spyOn(uiAutomation, 'getPageTitle').mockResolvedValue('Payments - SeiMoney');
      
      const result = await pageNavigation.navigateViaNavbar('payments');
      
      expect(result.success).toBe(true);
      expect(result.url).toBe('http://localhost:3000/payments');
      expect(result.title).toBe('Payments - SeiMoney');
    });
  });

  describe('error handling', () => {
    it('should handle navigation errors gracefully', async () => {
      await uiAutomation.initialize();
      
      // Test navigation to invalid URL
      const result = await pageNavigation.goToDashboard();
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.loadTime).toBe('number');
    });

    it('should handle UI automation errors', async () => {
      // Don't initialize UI automation to trigger errors
      try {
        const result = await pageNavigation.goBack();
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      } catch (error) {
        // This is expected when UI automation is not initialized
        expect(error).toBeDefined();
      }
    });
  });

  describe('configuration', () => {
    it('should allow base URL updates', () => {
      const newBaseUrl = 'https://production.seimoney.app';
      pageNavigation.updateBaseUrl(newBaseUrl);
      
      const pages = pageNavigation.getAvailablePages();
      expect(pages.dashboard).toBe(`${newBaseUrl}/dashboard`);
      expect(pages.payments).toBe(`${newBaseUrl}/payments`);
    });

    it('should handle base URL with trailing slash in updates', () => {
      pageNavigation.updateBaseUrl('https://seimoney.app/');
      
      const pages = pageNavigation.getAvailablePages();
      expect(pages.dashboard).toBe('https://seimoney.app/dashboard');
    });
  });
});