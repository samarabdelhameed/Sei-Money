import { loadConfig, validateEnvironment, createTestConfig } from '../config';

describe('Configuration', () => {
  describe('loadConfig', () => {
    it('should load configuration with default values', () => {
      // Set minimal required environment variables
      process.env.FRONTEND_URL = 'http://localhost:3000';
      process.env.BACKEND_URL = 'http://localhost:8000';
      process.env.BLOCKCHAIN_NETWORK = 'sei-testnet';
      process.env.BLOCKCHAIN_RPC_URL = 'https://rpc.sei-apis.com';
      process.env.CONTRACT_ADDRESS = 'sei1234567890abcdef';
      process.env.TEST_WALLET_ADDRESS = 'sei1test123456789';
      process.env.TEST_WALLET_PRIVATE_KEY = 'test_private_key';
      process.env.TEST_WALLET_MNEMONIC = 'test mnemonic phrase';

      const config = loadConfig();

      expect(config).toBeDefined();
      expect(config.environment.frontendUrl).toBe('http://localhost:3000');
      expect(config.environment.backendUrl).toBe('http://localhost:8000');
      expect(config.browser.headless).toBe(true); // From .env file
      expect(config.validation.retryAttempts).toBe(3);
      expect(config.logging.level).toBe('info');
    });

    it('should throw error when required environment variables are missing', () => {
      // Save original values
      const originalFrontend = process.env.FRONTEND_URL;
      const originalBackend = process.env.BACKEND_URL;
      const originalContract = process.env.CONTRACT_ADDRESS;
      
      try {
        // Clear environment variables
        delete process.env.FRONTEND_URL;
        delete process.env.BACKEND_URL;
        delete process.env.CONTRACT_ADDRESS;

        expect(() => loadConfig()).toThrow('Configuration validation failed');
      } finally {
        // Restore original values
        if (originalFrontend) process.env.FRONTEND_URL = originalFrontend;
        if (originalBackend) process.env.BACKEND_URL = originalBackend;
        if (originalContract) process.env.CONTRACT_ADDRESS = originalContract;
      }
    });
  });

  describe('validateEnvironment', () => {
    it('should return validation results', () => {
      // Set required environment variables
      process.env.FRONTEND_URL = 'http://localhost:3000';
      process.env.BACKEND_URL = 'http://localhost:8000';
      process.env.BLOCKCHAIN_NETWORK = 'sei-testnet';
      process.env.BLOCKCHAIN_RPC_URL = 'https://rpc.sei-apis.com';
      process.env.CONTRACT_ADDRESS = 'sei1234567890abcdef';
      process.env.TEST_WALLET_ADDRESS = 'sei1test123456789';
      process.env.TEST_WALLET_PRIVATE_KEY = 'test_private_key';
      process.env.TEST_WALLET_MNEMONIC = 'test mnemonic phrase';

      const result = validateEnvironment();

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.missingVars).toHaveLength(0);
    });

    it('should identify missing environment variables', () => {
      // Clear some required variables
      delete process.env.FRONTEND_URL;
      delete process.env.BACKEND_URL;

      const result = validateEnvironment();

      expect(result.isValid).toBe(false);
      expect(result.missingVars).toContain('FRONTEND_URL');
      expect(result.missingVars).toContain('BACKEND_URL');
    });
  });

  describe('createTestConfig', () => {
    it('should create test config with overrides', () => {
      // Set base environment
      process.env.FRONTEND_URL = 'http://localhost:3000';
      process.env.BACKEND_URL = 'http://localhost:8000';
      process.env.BLOCKCHAIN_NETWORK = 'sei-testnet';
      process.env.BLOCKCHAIN_RPC_URL = 'https://rpc.sei-apis.com';
      process.env.CONTRACT_ADDRESS = 'sei1234567890abcdef';
      process.env.TEST_WALLET_ADDRESS = 'sei1test123456789';
      process.env.TEST_WALLET_PRIVATE_KEY = 'test_private_key';
      process.env.TEST_WALLET_MNEMONIC = 'test mnemonic phrase';

      const overrides = {
        browser: {
          headless: true,
          timeout: 60000,
          screenshotOnFailure: false,
        },
        logging: {
          level: 'debug' as const,
        },
      };

      const config = createTestConfig(overrides);

      expect(config.browser.headless).toBe(true);
      expect(config.browser.timeout).toBe(60000);
      expect(config.browser.screenshotOnFailure).toBe(false);
      expect(config.logging.level).toBe('debug');
      
      // Ensure base config is preserved
      expect(config.environment.frontendUrl).toBe('http://localhost:3000');
    });
  });
});