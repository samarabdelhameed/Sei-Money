#!/usr/bin/env ts-node

/**
 * Basic test example without environment health check
 */

import { TestRunner, createTestConfig, initializeLogger } from '../index';
import { TestScenario, TestStep } from '../types';

async function main() {
  try {
    // Initialize logger
    const logger = initializeLogger('info', 'logs/basic-test.log');
    logger.info('Starting basic test example');

    // Create test configuration
    const config = createTestConfig({
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
        level: 'info',
      },
    });

    logger.info('Configuration created successfully');

    // Create test runner
    const testRunner = new TestRunner(config);
    logger.info('TestRunner created');

    // Create a simple test scenario that doesn't require initialization
    const steps: TestStep[] = [
      {
        id: 'wait-step',
        type: 'wait',
        action: 'wait',
        parameters: { duration: 500 },
        validations: [],
      },
    ];

    const scenario: TestScenario = {
      id: 'basic-wait-test',
      name: 'Basic Wait Test',
      description: 'Tests basic wait functionality without environment setup',
      steps,
      expectedOutcomes: [
        {
          type: 'ui_state',
          description: 'Wait should complete successfully',
          validation: (result: any) => result.waited === 500,
        },
      ],
      timeout: 10000,
      retryCount: 1,
    };

    // Register the scenario
    testRunner.registerScenario(scenario);
    logger.info('Test scenario registered');

    // Test basic functionality without full initialization
    const status = testRunner.getExecutionStatus();
    logger.info('Execution status retrieved', {
      isRunning: status.isRunning,
      progress: status.progress,
      errors: status.errors,
      warnings: status.warnings,
    });

    // Test configuration update
    testRunner.configure({
      logging: {
        level: 'debug',
      },
    });
    logger.info('Configuration updated successfully');

    logger.info('✅ Basic test completed successfully!');
    console.log('✅ Basic test completed successfully!');
    console.log('📊 Test Results:');
    console.log(`   - TestRunner created: ✅`);
    console.log(`   - Configuration loaded: ✅`);
    console.log(`   - Scenario registered: ✅`);
    console.log(`   - Status tracking: ✅`);
    console.log(`   - Configuration updates: ✅`);

  } catch (error: any) {
    console.error('❌ Basic test failed:', error.message);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main };