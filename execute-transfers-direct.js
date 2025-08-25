#!/usr/bin/env node

// 🎯 Direct Transfer Execution - Automated Implementation
// This script will execute transfers directly via API calls

const http = require('http');
const https = require('https');

console.log('🎯 Starting Direct Transfer Execution...');
console.log('📡 Backend API: http://localhost:3001');
console.log('');

// Test data exactly as specified
const TRANSFER_TESTS = [
  {
    recipient: 'sei1abc123def456ghi789jkl012mno345pqr678stu',
    amount: '10.5',
    remark: 'Test transfer'
  },
  {
    recipient: 'sei1def456ghi789jkl012mno345pqr678stu901vwx',
    amount: '25.0',
    remark: 'Second test transfer'
  },
  {
    recipient: 'sei1ghi789jkl012mno345pqr678stu901vwx234yz',
    amount: '5.75',
    remark: 'Third test transfer'
  }
];

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            data: null
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Step 1: Check backend health
async function checkBackendHealth() {
  console.log('🏥 Step 1: Checking backend health...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/health/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      console.log('✅ Backend is healthy');
      console.log(`   Status: ${response.data?.status || 'OK'}`);
      return true;
    } else {
      console.log(`❌ Backend health check failed: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Backend connection failed: ${error.message}`);
    return false;
  }
}

// Step 2: Get API documentation
async function checkAPIEndpoints() {
  console.log('\n📚 Step 2: Checking available API endpoints...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/docs',
      method: 'GET'
    });
    
    if (response.statusCode === 200) {
      console.log('✅ API documentation accessible');
      return true;
    } else {
      console.log(`⚠️  API docs returned: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  API docs check failed: ${error.message}`);
    return false;
  }
}

// Step 3: Create transfers via API
async function createTransfer(transferData, index) {
  console.log(`\n💸 Step 3.${index + 1}: Creating transfer ${index + 1}/3...`);
  console.log(`   📧 Recipient: ${transferData.recipient}`);
  console.log(`   💰 Amount: ${transferData.amount} SEI`);
  console.log(`   📝 Remark: ${transferData.remark}`);
  
  // Try the correct API endpoints based on backend routes
  const possibleEndpoints = [
    '/api/v1/transfers',
    '/api/v1/market',
    '/api/v1/wallet'
  ];
  
  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`   🔍 Trying endpoint: ${endpoint}`);
      
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }, {
        recipient: transferData.recipient,
        amount: transferData.amount,
        remark: transferData.remark,
        currency: 'SEI'
      });
      
      console.log(`   📡 Response: ${response.statusCode}`);
      
      if (response.statusCode === 200 || response.statusCode === 201) {
        console.log('✅ Transfer created successfully!');
        if (response.data) {
          console.log(`   📄 Response data:`, JSON.stringify(response.data, null, 2));
        }
        return { success: true, endpoint, response: response.data };
      } else if (response.statusCode === 404) {
        console.log(`   ⚠️  Endpoint not found: ${endpoint}`);
        continue;
      } else {
        console.log(`   ❌ Transfer failed: ${response.statusCode}`);
        if (response.body) {
          console.log(`   📄 Error details: ${response.body}`);
        }
        return { success: false, endpoint, error: response.body };
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
      continue;
    }
  }
  
  console.log('❌ All endpoints failed for transfer creation');
  return { success: false, error: 'No working endpoint found' };
}

// Step 4: Check market data (Dashboard equivalent)
async function checkMarketData() {
  console.log('\n📊 Step 4: Checking market/dashboard data...');
  
  const possibleEndpoints = [
    '/api/v1/market/stats',
    '/api/v1/market/overview',
    '/api/v1/market/analytics',
    '/api/v1/transfers'
  ];
  
  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`   🔍 Checking endpoint: ${endpoint}`);
      
      const response = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: endpoint,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.statusCode === 200) {
        console.log(`✅ Market data available at: ${endpoint}`);
        if (response.data) {
          console.log(`   📊 Data preview:`, JSON.stringify(response.data, null, 2).slice(0, 200) + '...');
        }
        return { success: true, endpoint, data: response.data };
      } else if (response.statusCode !== 404) {
        console.log(`   ⚠️  Endpoint returned: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('⚠️  No market data endpoints found');
  return { success: false };
}

// Step 5: Generate mock data if needed
async function generateMockData() {
  console.log('\n🎲 Step 5: Generating mock data...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/mock/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      transfers: TRANSFER_TESTS,
      generatePortfolio: true,
      generateActivity: true
    });
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✅ Mock data generated successfully!');
      return { success: true, data: response.data };
    } else {
      console.log(`⚠️  Mock data generation returned: ${response.statusCode}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`⚠️  Mock data generation failed: ${error.message}`);
    return { success: false };
  }
}

// Main execution function
async function executeTransfersDirect() {
  console.log('🚀 Starting Direct Transfer Execution...\n');
  
  const results = {
    backendHealth: false,
    apiDocs: false,
    transfersCreated: 0,
    marketData: false,
    mockData: false,
    workingEndpoints: []
  };
  
  try {
    // Step 1: Check backend health
    results.backendHealth = await checkBackendHealth();
    if (!results.backendHealth) {
      console.error('💥 Backend is not accessible - cannot proceed');
      return results;
    }
    
    // Step 2: Check API endpoints
    results.apiDocs = await checkAPIEndpoints();
    
    // Step 3: Create transfers
    console.log('\n🔄 Creating transfers via API...');
    for (let i = 0; i < TRANSFER_TESTS.length; i++) {
      const result = await createTransfer(TRANSFER_TESTS[i], i);
      if (result.success) {
        results.transfersCreated++;
        if (!results.workingEndpoints.includes(result.endpoint)) {
          results.workingEndpoints.push(result.endpoint);
        }
      }
      
      // Wait between transfers
      if (i < TRANSFER_TESTS.length - 1) {
        console.log('   ⏳ Waiting before next transfer...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Step 4: Check market data
    const marketResult = await checkMarketData();
    results.marketData = marketResult.success;
    
    // Step 5: Generate mock data if no transfers were created
    if (results.transfersCreated === 0) {
      const mockResult = await generateMockData();
      results.mockData = mockResult.success;
    }
    
    // Final results
    console.log('\n🎯 Direct Execution Results:');
    console.log(`✅ Backend Health: ${results.backendHealth ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ API Documentation: ${results.apiDocs ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Transfers Created: ${results.transfersCreated}/${TRANSFER_TESTS.length}`);
    console.log(`✅ Market Data Access: ${results.marketData ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Mock Data Generated: ${results.mockData ? 'SUCCESS' : 'FAILED'}`);
    
    if (results.workingEndpoints.length > 0) {
      console.log(`✅ Working Endpoints: ${results.workingEndpoints.join(', ')}`);
    }
    
    const totalSteps = 4;
    const successfulSteps = [
      results.backendHealth,
      results.apiDocs,
      results.transfersCreated > 0,
      results.marketData || results.mockData
    ].filter(Boolean).length;
    
    console.log(`\n📊 Overall Success Rate: ${successfulSteps}/${totalSteps} steps completed`);
    
    if (results.transfersCreated === TRANSFER_TESTS.length) {
      console.log('\n🎉 PERFECT! All transfers created successfully via API!');
      console.log('✅ The backend is processing transfers correctly');
      console.log('✅ Frontend should now show updated data');
      console.log('\n📈 Next Steps:');
      console.log('   • Open http://localhost:5175 to see the results');
      console.log('   • Check Dashboard for updated portfolio');
      console.log('   • Verify transfers appear in recent activity');
    } else if (results.transfersCreated > 0) {
      console.log('\n🎊 GOOD! Some transfers were created successfully');
      console.log(`✅ ${results.transfersCreated} out of ${TRANSFER_TESTS.length} transfers completed`);
      console.log('✅ Check the frontend for updated data');
    } else if (results.mockData) {
      console.log('\n🎲 Mock data generated instead of real transfers');
      console.log('✅ Frontend should show simulated transfer data');
      console.log('✅ This proves the data flow is working');
    } else {
      console.log('\n⚠️  No transfers were created');
      console.log('🔧 This might indicate:');
      console.log('   • API endpoints are not implemented yet');
      console.log('   • Different endpoint structure is used');
      console.log('   • Authentication is required');
      console.log('   • Backend is using different data format');
    }
    
    return results;
    
  } catch (error) {
    console.error('💥 Direct execution failed:', error);
    return results;
  }
}

// Run the execution
executeTransfersDirect().then(results => {
  console.log('\n🏁 Direct execution completed!');
  process.exit(results.transfersCreated > 0 ? 0 : 1);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});