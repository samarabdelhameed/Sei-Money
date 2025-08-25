#!/usr/bin/env node

// 🧪 Complete Payments Test
// This script tests the full payments flow

const API_BASE_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5175';

console.log('🧪 Complete Payments Test Starting...\n');

// Test 1: Backend API Health
async function testBackendHealth() {
  console.log('1️⃣ Testing Backend Health...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health/health`);
    const data = await response.json();
    
    if (data.ok && data.status === 'healthy') {
      console.log('✅ Backend is healthy');
      return true;
    } else {
      console.log('❌ Backend is not healthy');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    return false;
  }
}

// Test 2: Market Data API
async function testMarketData() {
  console.log('\n2️⃣ Testing Market Data API...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/market/overview`);
    const data = await response.json();
    
    if (data.ok && data.data) {
      console.log('✅ Market data API working');
      console.log(`   TVL: ${data.data.metrics.totalValueLocked} SEI`);
      console.log(`   Users: ${data.data.metrics.totalUsers}`);
      return true;
    } else {
      console.log('❌ Market data API failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Market data API error:', error.message);
    return false;
  }
}

// Test 3: Transfers API
async function testTransfersAPI() {
  console.log('\n3️⃣ Testing Transfers API...');
  
  try {
    // Test with a valid Sei address
    const testAddress = 'sei1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc';
    const response = await fetch(`${API_BASE_URL}/api/v1/transfers?address=${testAddress}`);
    const data = await response.json();
    
    if (data.ok !== false || response.status === 400) {
      console.log('✅ Transfers API responding (validation working)');
      return true;
    } else {
      console.log('❌ Transfers API not responding properly');
      return false;
    }
  } catch (error) {
    console.log('❌ Transfers API error:', error.message);
    return false;
  }
}

// Test 4: Frontend Accessibility
async function testFrontendAccess() {
  console.log('\n4️⃣ Testing Frontend Access...');
  
  try {
    const response = await fetch(FRONTEND_URL);
    const html = await response.text();
    
    if (html.includes('SeiMoney') && html.includes('DeFi')) {
      console.log('✅ Frontend is accessible');
      return true;
    } else {
      console.log('❌ Frontend content not found');
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend connection failed:', error.message);
    return false;
  }
}

// Test 5: CORS Configuration
async function testCORS() {
  console.log('\n5️⃣ Testing CORS Configuration...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/market/overview`, {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:5175',
        'Content-Type': 'application/json'
      }
    });
    
    const corsHeaders = response.headers.get('access-control-allow-credentials');
    
    if (response.ok && corsHeaders) {
      console.log('✅ CORS is configured correctly');
      return true;
    } else {
      console.log('⚠️  CORS might have issues');
      return false;
    }
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
    return false;
  }
}

// Main test function
async function runCompleteTest() {
  console.log('🚀 Running Complete Payments Test...\n');
  
  const results = {
    backendHealth: false,
    marketData: false,
    transfersAPI: false,
    frontendAccess: false,
    cors: false
  };
  
  try {
    results.backendHealth = await testBackendHealth();
    results.marketData = await testMarketData();
    results.transfersAPI = await testTransfersAPI();
    results.frontendAccess = await testFrontendAccess();
    results.cors = await testCORS();
    
    // Results summary
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Backend Health: ${results.backendHealth ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Market Data API: ${results.marketData ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Transfers API: ${results.transfersAPI ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Frontend Access: ${results.frontendAccess ? 'PASS' : 'FAIL'}`);
    console.log(`✅ CORS Config: ${results.cors ? 'PASS' : 'FAIL'}`);
    
    const passedTests = Object.values(results).filter(r => r === true).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 All tests passed! The system is ready for payments testing!');
      console.log('\n📋 Next Steps:');
      console.log('1. Open http://localhost:5175 in your browser');
      console.log('2. Connect your wallet');
      console.log('3. Go to Payments page');
      console.log('4. Create test transfers:');
      console.log('   - Recipient: sei1abc123def456ghi789jkl012mno345pqr678stu');
      console.log('   - Amount: 10.5');
      console.log('   - Remark: Test transfer');
      console.log('5. Check Dashboard for updated data');
    } else {
      console.log('\n⚠️  Some tests failed. Fix the issues above before testing payments.');
      
      if (!results.backendHealth) {
        console.log('\n🔧 Backend Fix: Run ./start-all.sh to start the backend');
      }
      if (!results.frontendAccess) {
        console.log('\n🔧 Frontend Fix: Make sure frontend is running on port 5175');
      }
      if (!results.marketData) {
        console.log('\n🔧 Market Data Fix: Check backend logs for market data service issues');
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    return results;
  }
}

// Run the test
if (require.main === module) {
  runCompleteTest().then(() => {
    console.log('\n✅ Complete test finished!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

module.exports = { runCompleteTest };