#!/usr/bin/env ts-node

/**
 * Basic usage example of the E2E testing framework
 */

import { TestRunner, getConfig, initializeLogger } from '../index';
import { TestScenario, TestStep } from '../types';

async function main() {
  try {
    // Initialize logger
    const logger = initializeLogger('info', 'logs/example.log');
    logger.info('Starting E2E testing framework example');

    // Load configuration
    const config = getConfig();
    logger.info('Configuration loaded successfully');

    // Create test runner
    const testRunner = new TestRunner(config);
    
    // Initialize the test runner
    await testRunner.initialize();
    logger.info('TestRunner initialized');

    // Create a simple test scenario
    const steps: TestStep[] = [
      {
        id: 'setup-environment',
        type: 'setup',
        action: 'initialize_test_data',
        parameters: {
          testData: {
            transfers: [],
            groups: [],
            pots: [],
            vaults: [],
          },
        },
        validations: [],
      },
      {
        id: 'wait-for-initialization',
        type: 'wait',
        action: 'wait',
        parameters: { duration: 1000 },
        validations: [],
      },
      {
        id: 'validate-environment',
        type: 'validation',
        action: 'validate_environment_ready',
        parameters: {},
        validations: [],
      },
      {
        id: 'cleanup-environment',
        type: 'cleanup',
        action: 'cleanup_test_data',
        parameters: {},
        validations: [],
      },
    ];

    const scenario: TestScenario = {
      id: 'basic-environment-test',
      name: 'Basic Environment Test',
      description: 'Tests basic environment setup and cleanup',
      steps,
      expectedOutcomes: [
        {
          type: 'ui_state',
          description: 'Environment should be ready for testing',
          validation: (result: any) => result.success === true,
        },
      ],
      timeout: 60000,
      retryCount: 2,
    };

    // Register and execute the scenario
    testRunner.registerScenario(scenario);
    logger.info('Test scenario registered');

    const result = await testRunner.executeScenario('basic-environment-test');
    
    // Log results
    logger.info('Test execution completed', {
      scenarioId: result.scenarioId,
      success: result.success,
      executionTime: result.executionTime,
      steps: result.steps.length,
      errors: result.errors.length,
      warnings: result.warnings.length,
    });

    if (result.success) {
      logger.info('✅ Test scenario passed successfully!');
      console.log('✅ Test scenario passed successfully!');
    } else {
      logger.error('❌ Test scenario failed');
      console.log('❌ Test scenario failed');
      
      // Log errors
      result.errors.forEach((error, index) => {
        logger.error(`Error ${index + 1}:`, error);
        console.log(`Error ${index + 1}:`, error.message);
      });
    }

    // Shutdown test runner
    await testRunner.shutdown();
    logger.info('TestRunner shutdown completed');

  } catch (error: any) {
    console.error('Example execution failed:', error.message);
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