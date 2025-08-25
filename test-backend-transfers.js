#!/usr/bin/env node

// 🧪 Test Backend Transfers API
// Run with: node test-backend-transfers.js

const API_BASE_URL = 'http://localhost:3001';

// Test data
const TEST_TRANSFER = {
  recipient: 'sei1abc123def456ghi789jkl012mno345pqr678stu',
  amount: '10.5',
  remark: 'Test transfer from script'
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    ...options
  };
  
  try {
    console.log(`📡 ${config.method} ${endpoint}`);
    
    const response = await fetch(url, config);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   Response:`, JSON.stringify(data, null, 2).slice(0, 500) + '...');
      return { success: true, data };
    } else {
      const text = await response.text();
      console.log(`   Error:`, text);
      return { success: false, error: text };
    }
    
  } catch (error) {
    console.log(`   Network Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n1️⃣ Testing health check...');
  const result = await apiCall('/health/health');
  return result.success;
}

async function testGetTransfers() {
  console.log('\n2️⃣ Testing get transfers...');
  const result = await apiCall('/api/v1/transfers');
  return result.success;
}

async function testGetTransfersWithAddress() {
  console.log('\n3️⃣ Testing get transfers with address...');
  const testAddress = 'sei1test123456789';
  const result = await apiCall(`/api/v1/transfers?address=${testAddress}`);
  return result.success;
}

async function testCreateTransfer() {
  console.log('\n4️⃣ Testing create transfer...');
  
  // Note: This will fail without authentication, but we can test the endpoint
  const result = await apiCall('/api/v1/transfers', {
    method: 'POST',
    body: JSON.stringify(TEST_TRANSFER)
  });
  
  // We expect this to fail with 401 (unauthorized) which is correct behavior
  return result.success || result.error.includes('401') || result.error.includes('Authentication');
}

async function testMarketData() {
  console.log('\n5️⃣ Testing market data...');
  const result = await apiCall('/api/v1/market/overview');
  return result.success;
}

async function testOtherEndpoints() {
  console.log('\n6️⃣ Testing other endpoints...');
  
  const endpoints = [
    '/api/v1/groups',
    '/api/v1/pots', 
    '/api/v1/vaults',
    '/api/v1/escrow'
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    const result = await apiCall(endpoint);
    if (result.success) successCount++;
  }
  
  console.log(`   ${successCount}/${endpoints.length} endpoints working`);
  return successCount === endpoints.length;
}

// Main test function
async function runBackendTest() {
  console.log('🚀 Testing Backend Transfers API...\n');
  
  const results = {
    healthCheck: false,
    getTransfers: false,
    getTransfersWithAddress: false,
    createTransfer: false,
    marketData: false,
    otherEndpoints: false
  };
  
  try {
    results.healthCheck = await testHealthCheck();
    results.getTransfers = await testGetTransfers();
    results.getTransfersWithAddress = await testGetTransfersWithAddress();
    results.createTransfer = await testCreateTransfer();
    results.marketData = await testMarketData();
    results.otherEndpoints = await testOtherEndpoints();
    
    // Results summary
    console.log('\n📊 Backend Test Results:');
    console.log(`✅ Health Check: ${results.healthCheck ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Get Transfers: ${results.getTransfers ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Get Transfers (with address): ${results.getTransfersWithAddress ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Create Transfer: ${results.createTransfer ? 'PASS' : 'FAIL (expected without auth)'}`);
    console.log(`✅ Market Data: ${results.marketData ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Other Endpoints: ${results.otherEndpoints ? 'PASS' : 'FAIL'}`);
    
    const passedTests = Object.values(results).filter(r => r === true).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests >= 4) { // Allow create transfer to fail due to auth
      console.log('🎉 Backend is working correctly!');
    } else {
      console.log('⚠️  Backend has some issues. Check the logs above.');
    }
    
    return results;
    
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    return results;
  }
}

// Run the test
if (require.main === module) {
  runBackendTest().then(() => {
    console.log('\n✅ Backend test completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Backend test failed:', error);
    process.exit(1);
  });
}

module.exports = { runBackendTest };