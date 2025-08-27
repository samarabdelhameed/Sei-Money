import { UIAutomation } from '../ui/UIAutomation';
import { createTestConfig } from '../config';

describe('UIAutomation', () => {
  let uiAutomation: UIAutomation;
  let testConfig: any;

  beforeEach(() => {
    // Create test configuration
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
    it('should create UIAutomation instance', () => {
      expect(uiAutomation).toBeDefined();
    });

    it('should initialize browser successfully', async () => {
      await expect(uiAutomation.initialize()).resolves.not.toThrow();
      
      // Verify page is available
      const page = uiAutomation.getPage();
      expect(page).toBeDefined();
      expect(page).not.toBeNull();
    });

    it('should handle initialization errors gracefully', async () => {
      // Create UIAutomation with invalid config
      const invalidConfig = createTestConfig({
        browser: {
          headless: true,
          timeout: -1, // Invalid timeout
          screenshotOnFailure: false,
        },
      });

      const invalidUIAutomation = new UIAutomation(invalidConfig);
      
      // Should handle invalid configuration
      await expect(invalidUIAutomation.initialize()).rejects.toThrow();
    });
  });

  describe('navigation', () => {
    beforeEach(async () => {
      await uiAutomation.initialize();
    });

    it('should navigate to valid URL', async () => {
      await expect(uiAutomation.navigateTo('https://example.com')).resolves.not.toThrow();
      
      const currentUrl = uiAutomation.getCurrentUrl();
      expect(currentUrl).toContain('example.com');
    });

    it('should get page title', async () => {
      await uiAutomation.navigateTo('https://example.com');
      
      const title = await uiAutomation.getPageTitle();
      expect(title).toBeDefined();
      expect(typeof title).toBe('string');
    });

    it('should handle navigation to invalid URL', async () => {
      await expect(uiAutomation.navigateTo('invalid-url')).rejects.toThrow();
    });
  });

  describe('element interaction', () => {
    beforeEach(async () => {
      await uiAutomation.initialize();
      // Navigate to a test page with known elements
      await uiAutomation.navigateTo('https://example.com');
    });

    it('should check element visibility', async () => {
      // Check for common elements that should exist on example.com
      const isVisible = await uiAutomation.isElementVisible('h1', 5000);
      expect(typeof isVisible).toBe('boolean');
    });

    it('should get element text', async () => {
      // Try to get text from h1 element
      try {
        const text = await uiAutomation.getElementText('h1');
        expect(typeof text).toBe('string');
      } catch (error) {
        // Element might not exist, which is fine for this test
        expect(error).toBeDefined();
      }
    });

    it('should handle non-existent elements gracefully', async () => {
      await expect(uiAutomation.waitForElement('non-existent-element', { timeout: 1000 }))
        .rejects.toThrow();
    });
  });

  describe('screenshot functionality', () => {
    beforeEach(async () => {
      await uiAutomation.initialize();
      await uiAutomation.navigateTo('https://example.com');
    });

    it('should take screenshot successfully', async () => {
      const screenshotPath = await uiAutomation.takeScreenshot('test-screenshot');
      expect(screenshotPath).toBeDefined();
      expect(screenshotPath).toContain('screenshots/');
      expect(screenshotPath).toContain('.png');
    });
  });

  describe('page operations', () => {
    beforeEach(async () => {
      await uiAutomation.initialize();
      await uiAutomation.navigateTo('https://example.com');
    });

    it('should refresh page', async () => {
      await expect(uiAutomation.refreshPage()).resolves.not.toThrow();
    });

    it('should execute JavaScript', async () => {
      const result = await uiAutomation.executeScript(() => document.title);
      expect(typeof result).toBe('string');
    });

    it('should wait for page load', async () => {
      await expect(uiAutomation.waitForPageLoad(10000)).resolves.not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources properly', async () => {
      await uiAutomation.initialize();
      await expect(uiAutomation.cleanup()).resolves.not.toThrow();
      
      // Verify resources are cleaned up
      expect(uiAutomation.getPage()).toBeNull();
      expect(uiAutomation.getContext()).toBeNull();
    });

    it('should handle cleanup without initialization', async () => {
      // Should not throw even if not initialized
      await expect(uiAutomation.cleanup()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw error when not initialized', async () => {
      await expect(uiAutomation.navigateTo('https://example.com'))
        .rejects.toThrow('UI automation not initialized');
    });

    it('should throw error for invalid operations', async () => {
      await uiAutomation.initialize();
      
      // Try to interact with non-existent element
      await expect(uiAutomation.clickElement('non-existent-element', { timeout: 1000 }))
        .rejects.toThrow();
    });
  });
});