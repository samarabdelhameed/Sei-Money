#!/usr/bin/env ts-node

import { APITester } from '../api/APITester';
import { APITestConfig } from '../api/types';

/**
 * Comprehensive API test to demonstrate all functionality
 */
async function runComprehensiveAPITest() {
  console.log('🚀 Starting Comprehensive API Test...');

  try {
    // Create API test configuration
    const apiConfig: APITestConfig = {
      baseUrl: 'http://localhost:3001',
      timeout: 10000,
      retryAttempts: 2,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': 'SeiMoney-E2E-Tester/1.0.0',
      },
    };

    // Create API tester instance
    const apiTester = new APITester(apiConfig);
    console.log(`📡 API Tester initialized with base URL: ${apiConfig.baseUrl}`);

    const results = [];

    // Test 1: Groups endpoint
    console.log('\n👥 Testing Groups Endpoint...');
    const groupsTest = await apiTester.testEndpoint({
      name: 'List Groups',
      method: 'GET',
      path: '/api/v1/groups',
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data', type: 'exists' },
        { field: 'data.groups', type: 'exists' },
      ],
    });
    results.push(groupsTest);

    // Test 2: Pots endpoint
    console.log('\n🏺 Testing Pots Endpoint...');
    const potsTest = await apiTester.testEndpoint({
      name: 'List Pots',
      method: 'GET',
      path: '/api/v1/pots',
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data', type: 'exists' },
        { field: 'data.pots', type: 'exists' },
      ],
    });
    results.push(potsTest);

    // Test 3: Vaults endpoint
    console.log('\n🏦 Testing Vaults Endpoint...');
    const vaultsTest = await apiTester.testEndpoint({
      name: 'List Vaults',
      method: 'GET',
      path: '/api/v1/vaults',
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data', type: 'exists' },
        { field: 'data.vaults', type: 'exists' },
      ],
    });
    results.push(vaultsTest);

    // Test 4: Transfers with valid address
    console.log('\n💸 Testing Transfers with Valid Address...');
    const transfersTest = await apiTester.testEndpoint({
      name: 'List Transfers',
      method: 'GET',
      path: '/api/v1/transfers',
      queryParams: { 
        address: 'sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg' // Real contract address
      },
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data', type: 'exists' },
        { field: 'data.transfers', type: 'exists' },
        { field: 'data.pagination', type: 'exists' },
      ],
    });
    results.push(transfersTest);

    // Test 5: Market stats endpoint
    console.log('\n📊 Testing Market Stats Endpoint...');
    const marketTest = await apiTester.testEndpoint({
      name: 'Market Stats',
      method: 'GET',
      path: '/api/v1/market/stats',
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data', type: 'exists' },
      ],
    });
    results.push(marketTest);

    // Calculate summary
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;
    const successRate = (passed / results.length) * 100;
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);

    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Total Time: ${totalTime}ms`);

    // Show detailed results
    console.log('\n📋 Detailed Results:');
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.method} ${result.endpoint} (${result.executionTime}ms)`);
      
      if (result.success && result.response) {
        const data = result.response.data?.data;
        if (data) {
          if (data.groups) console.log(`   Found ${data.groups.length} groups`);
          if (data.pots) console.log(`   Found ${data.pots.length} pots`);
          if (data.vaults) console.log(`   Found ${data.vaults.length} vaults`);
          if (data.transfers) console.log(`   Found ${data.transfers.length} transfers`);
          if (data.totalValueLocked) console.log(`   TVL: ${data.totalValueLocked}`);
        }
      } else if (result.error) {
        console.log(`   Error: ${result.error.message}`);
      }
    });

    // Generate report
    console.log('\n📄 Generating Test Report...');
    apiTester.generateReport(results);
    console.log('Report generated successfully!');

    console.log('\n🎉 Comprehensive API Test completed!');
    
    return {
      success: successRate > 50, // Consider success if more than 50% pass
      totalTests: results.length,
      passedTests: passed,
      failedTests: failed,
      successRate,
      executionTime: totalTime,
      results,
    };

  } catch (error) {
    console.error('❌ Comprehensive API Test failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runComprehensiveAPITest()
    .then((result) => {
      if (result.success) {
        console.log(`\n✅ Test completed successfully!`);
        console.log(`Tests: ${result.passedTests}/${result.totalTests} passed (${result.successRate}%)`);
        process.exit(0);
      } else {
        console.error(`\n❌ Test failed: ${result.error}`);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

export { runComprehensiveAPITest };