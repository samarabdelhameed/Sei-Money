#!/usr/bin/env ts-node

import { APITester } from '../api/APITester';
import { APITestConfig } from '../api/types';

/**
 * Simple API test to verify the infrastructure works
 */
async function runSimpleAPITest() {
  console.log('🚀 Starting Simple API Test...');

  try {
    // Create API test configuration
    const apiConfig: APITestConfig = {
      baseUrl: 'http://localhost:3001',
      timeout: 5000,
      retryAttempts: 1,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
    };

    // Create API tester instance
    const apiTester = new APITester(apiConfig);
    console.log(`📡 API Tester initialized with base URL: ${apiConfig.baseUrl}`);

    // Test groups endpoint (should work without authentication)
    console.log('\n👥 Testing Groups Endpoint...');
    const healthTest = await apiTester.testEndpoint({
      name: 'List Groups',
      method: 'GET',
      path: '/api/v1/groups',
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data', type: 'exists' },
      ],
    });

    if (healthTest.success) {
      console.log('✅ Groups endpoint passed!');
      console.log(`Response time: ${healthTest.response?.responseTime}ms`);
      const groupsData = healthTest.response?.data?.data;
      if (groupsData && groupsData.groups) {
        console.log(`Found ${groupsData.groups.length} groups`);
      }
    } else {
      console.log('❌ Groups endpoint failed!');
      if (healthTest.error) {
        console.log(`Error: ${healthTest.error.message}`);
      }
    }

    // Test transfers endpoint with address parameter
    console.log('\n💸 Testing Transfers Endpoint...');
    const transfersTest = await apiTester.testEndpoint({
      name: 'List Transfers',
      method: 'GET',
      path: '/api/v1/transfers',
      queryParams: { address: 'sei1test123456789' },
      expectedStatus: 200,
      validations: [
        { field: 'ok', type: 'equals', value: true },
        { field: 'data', type: 'exists' },
      ],
    });

    if (transfersTest.success) {
      console.log('✅ Transfers endpoint passed!');
      console.log(`Response time: ${transfersTest.response?.responseTime}ms`);
      const transfersData = transfersTest.response?.data?.data;
      if (transfersData && transfersData.transfers) {
        console.log(`Found ${transfersData.transfers.length} transfers`);
      }
    } else {
      console.log('❌ Transfers endpoint failed!');
      if (transfersTest.error) {
        console.log(`Error: ${transfersTest.error.message}`);
      }
    }

    console.log('\n🎉 Simple API Test completed!');
    
    return {
      success: healthTest.success || transfersTest.success,
      groupsPassed: healthTest.success,
      transfersPassed: transfersTest.success,
    };

  } catch (error) {
    console.error('❌ Simple API Test failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runSimpleAPITest()
    .then((result) => {
      if (result.success) {
        console.log(`\n✅ Test completed successfully!`);
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

export { runSimpleAPITest };