#!/usr/bin/env ts-node

import { APITester } from '../api/APITester';
import { APITestConfig } from '../api/types';
import { getConfig } from '../config';
import { initializeLogger, getLogger } from '../utils/logger';

/**
 * Demo script to test API functionality with real data
 * This script demonstrates how to use the API testing infrastructure
 */
async function runAPITestingDemo() {
  // Initialize logging
  initializeLogger('info');
  
  const logger = getLogger();
  logger.info('🚀 Starting API Testing Demo...');

  try {
    // Load configuration
    const config = await getConfig();
    
    // Create API test configuration
    const apiConfig: APITestConfig = {
      baseUrl: config.environment.backendUrl,
      timeout: 10000,
      retryAttempts: 3,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': 'SeiMoney-E2E-Tester/1.0.0',
      },
    };

    // Create API tester instance
    const apiTester = new APITester(apiConfig);
    logger.info(`📡 API Tester initialized with base URL: ${apiConfig.baseUrl}`);

    // Test 1: Health Check
    logger.info('\n🏥 Testing Health Endpoints...');
    const healthResults = await apiTester.testHealth();
    const healthPassed = healthResults.filter(r => r.success).length;
    logger.info(`Health Tests: ${healthPassed}/${healthResults.length} passed`);

    // Test 2: User Endpoints
    logger.info('\n👤 Testing User Endpoints...');
    const userResults = await apiTester.testUser();
    const userPassed = userResults.filter(r => r.success).length;
    logger.info(`User Tests: ${userPassed}/${userResults.length} passed`);

    // Test 3: Get Transfers (should work without authentication for listing)
    logger.info('\n💸 Testing Transfers Endpoints...');
    try {
      const transfersResult = await apiTester.getTransfers();
      if (transfersResult.success) {
        logger.info('✅ Successfully retrieved transfers list');
        logger.info(`Response time: ${transfersResult.response?.responseTime}ms`);
        
        // Log some data about the transfers
        const transfersData = transfersResult.response?.data?.data;
        if (transfersData && transfersData.transfers) {
          logger.info(`Found ${transfersData.transfers.length} transfers`);
          if (transfersData.transfers.length > 0) {
            logger.info(`Sample transfer: ${JSON.stringify(transfersData.transfers[0], null, 2)}`);
          }
        }
      } else {
        logger.warn('❌ Failed to retrieve transfers list');
        if (transfersResult.error) {
          logger.warn(`Error: ${transfersResult.error.message}`);
        }
      }
    } catch (error) {
      logger.error('Error testing transfers:', error);
    }

    // Test 4: Test Groups Endpoints
    logger.info('\n👥 Testing Groups Endpoints...');
    try {
      const groupsTest = await apiTester.testEndpoint({
        name: 'List Groups',
        method: 'GET',
        path: '/api/groups',
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'equals', value: true },
          { field: 'data', type: 'exists' },
        ],
      });

      if (groupsTest.success) {
        logger.info('✅ Successfully retrieved groups list');
        logger.info(`Response time: ${groupsTest.response?.responseTime}ms`);
        
        const groupsData = groupsTest.response?.data?.data;
        if (groupsData && groupsData.groups) {
          logger.info(`Found ${groupsData.groups.length} groups`);
        }
      } else {
        logger.warn('❌ Failed to retrieve groups list');
      }
    } catch (error) {
      logger.error('Error testing groups:', error);
    }

    // Test 5: Test Pots Endpoints
    logger.info('\n🏺 Testing Pots Endpoints...');
    try {
      const potsTest = await apiTester.testEndpoint({
        name: 'List Pots',
        method: 'GET',
        path: '/api/pots',
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'equals', value: true },
          { field: 'data', type: 'exists' },
        ],
      });

      if (potsTest.success) {
        logger.info('✅ Successfully retrieved pots list');
        logger.info(`Response time: ${potsTest.response?.responseTime}ms`);
        
        const potsData = potsTest.response?.data?.data;
        if (potsData && potsData.pots) {
          logger.info(`Found ${potsData.pots.length} pots`);
        }
      } else {
        logger.warn('❌ Failed to retrieve pots list');
      }
    } catch (error) {
      logger.error('Error testing pots:', error);
    }

    // Test 6: Test Vaults Endpoints
    logger.info('\n🏦 Testing Vaults Endpoints...');
    try {
      const vaultsTest = await apiTester.testEndpoint({
        name: 'List Vaults',
        method: 'GET',
        path: '/api/vaults',
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'equals', value: true },
          { field: 'data', type: 'exists' },
        ],
      });

      if (vaultsTest.success) {
        logger.info('✅ Successfully retrieved vaults list');
        logger.info(`Response time: ${vaultsTest.response?.responseTime}ms`);
        
        const vaultsData = vaultsTest.response?.data?.data;
        if (vaultsData && vaultsData.vaults) {
          logger.info(`Found ${vaultsData.vaults.length} vaults`);
        }
      } else {
        logger.warn('❌ Failed to retrieve vaults list');
      }
    } catch (error) {
      logger.error('Error testing vaults:', error);
    }

    // Test 7: Test Real-time Endpoints
    logger.info('\n⚡ Testing Real-time Endpoints...');
    try {
      const realtimeTest = await apiTester.testEndpoint({
        name: 'Real-time Status',
        method: 'GET',
        path: '/api/realtime/status',
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'equals', value: true },
        ],
      });

      if (realtimeTest.success) {
        logger.info('✅ Successfully retrieved real-time status');
        logger.info(`Response time: ${realtimeTest.response?.responseTime}ms`);
      } else {
        logger.warn('❌ Failed to retrieve real-time status');
      }
    } catch (error) {
      logger.error('Error testing real-time endpoints:', error);
    }

    // Test 8: Run comprehensive test suite
    logger.info('\n🧪 Running Comprehensive Test Suite...');
    const { results, summary } = await apiTester.runFullTestSuite();
    
    logger.info('\n📊 Final Test Summary:');
    logger.info(`Total Tests: ${summary.total}`);
    logger.info(`Passed: ${summary.passed}`);
    logger.info(`Failed: ${summary.failed}`);
    logger.info(`Success Rate: ${summary.successRate}%`);
    logger.info(`Total Time: ${summary.totalTime}ms`);

    // Generate and save report
    const report = apiTester.generateReport(results);
    logger.info('\n📄 Test Report Generated:');
    logger.info(report);

    // Test specific endpoint with custom validation
    logger.info('\n🔍 Testing Custom Endpoint Validation...');
    try {
      const customTest = await apiTester.testEndpoint({
        name: 'Market Stats Health Check',
        method: 'GET',
        path: '/api/health/market-stats',
        expectedStatus: 200,
        validations: [
          { field: 'ok', type: 'equals', value: true },
          { field: 'data', type: 'exists' },
          { field: 'data.totalValueLocked', type: 'exists' },
          { field: 'data.totalUsers', type: 'exists' },
          { field: 'data.totalTransactions', type: 'exists' },
        ],
      });

      if (customTest.success) {
        logger.info('✅ Market stats validation passed');
        const marketData = customTest.response?.data?.data;
        if (marketData) {
          logger.info(`TVL: ${marketData.totalValueLocked}`);
          logger.info(`Users: ${marketData.totalUsers}`);
          logger.info(`Transactions: ${marketData.totalTransactions}`);
        }
      } else {
        logger.warn('❌ Market stats validation failed');
        const failedValidations = customTest.validations.filter(v => !v.passed);
        failedValidations.forEach(v => {
          logger.warn(`  - ${v.field}: ${v.message}`);
        });
      }
    } catch (error) {
      logger.error('Error testing market stats:', error);
    }

    logger.info('\n🎉 API Testing Demo completed successfully!');
    
    // Return summary for external use
    return {
      success: true,
      totalTests: summary.total,
      passedTests: summary.passed,
      failedTests: summary.failed,
      successRate: summary.successRate,
      executionTime: summary.totalTime,
    };

  } catch (error) {
    logger.error('❌ API Testing Demo failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runAPITestingDemo()
    .then((result) => {
      if (result.success) {
        console.log(`\n✅ Demo completed successfully!`);
        console.log(`Tests: ${result.passedTests}/${result.totalTests} passed (${result.successRate}%)`);
        process.exit(0);
      } else {
        console.error(`\n❌ Demo failed: ${result.error}`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

export { runAPITestingDemo };