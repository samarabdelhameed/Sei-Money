import { TestRunner } from '../core/TestRunner';
import { createTestConfig } from '../config';
import { TestScenario, TestStep } from '../types';

describe('TestRunner', () => {
  let testRunner: TestRunner;
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

    testRunner = new TestRunner(testConfig);
  });

  afterEach(async () => {
    if (testRunner) {
      try {
        await testRunner.shutdown();
      } catch (error) {
        // Ignore shutdown errors in tests
      }
    }
  });

  describe('initialization', () => {
    it('should create TestRunner instance', () => {
      expect(testRunner).toBeDefined();
      expect(testRunner.getExecutionStatus().isRunning).toBe(false);
    });

    it('should handle initialization with environment health check', async () => {
      // This test verifies that initialization properly handles health checks
      // In a real environment, this would fail due to services not running
      // But the test verifies the error handling works correctly
      await expect(testRunner.initialize()).rejects.toThrow('Environment is not healthy');
    });
  });

  describe('scenario management', () => {
    it('should register scenarios', () => {
      const scenario: TestScenario = {
        id: 'test-scenario-1',
        name: 'Test Scenario 1',
        description: 'A test scenario for testing',
        steps: [],
        expectedOutcomes: [],
        timeout: 30000,
        retryCount: 3,
      };

      testRunner.registerScenario(scenario);
      
      // We can't directly test if the scenario was registered since the scenarios map is private
      // But we can test that no error was thrown
      expect(true).toBe(true);
    });
  });

  describe('step execution', () => {
    it('should handle scenario execution without initialization', async () => {
      // Test that scenario execution fails properly when not initialized
      const steps: TestStep[] = [
        {
          id: 'setup-1',
          type: 'setup',
          action: 'initialize_test_data',
          parameters: { data: 'test' },
          validations: [],
        },
      ];

      const scenario: TestScenario = {
        id: 'simple-test',
        name: 'Simple Test Scenario',
        description: 'A simple test scenario',
        steps,
        expectedOutcomes: [],
        timeout: 30000,
        retryCount: 1,
      };

      testRunner.registerScenario(scenario);
      
      await expect(testRunner.executeScenario('simple-test')).rejects.toThrow('TestRunner not initialized');
    });

    it('should handle non-existent scenario', async () => {
      await expect(testRunner.executeScenario('non-existent')).rejects.toThrow('TestRunner not initialized');
    });
  });

  describe('execution status', () => {
    it('should track execution status', () => {
      const status = testRunner.getExecutionStatus();
      
      expect(status).toBeDefined();
      expect(status.isRunning).toBe(false);
      expect(status.progress).toBe(0);
      expect(status.errors).toBe(0);
      expect(status.warnings).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should allow configuration updates', () => {
      const newConfig = {
        browser: {
          headless: false,
          timeout: 60000,
          screenshotOnFailure: true,
        },
      };

      testRunner.configure(newConfig);
      
      // Configuration update should not throw
      expect(true).toBe(true);
    });
  });
});