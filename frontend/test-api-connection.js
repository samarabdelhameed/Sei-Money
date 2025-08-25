// Test API Connection - Run in browser console

console.log('🔍 Testing API Connection...');

async function testApiConnection() {
  const API_BASE_URL = 'http://localhost:3001';
  
  console.log('Testing endpoints:');
  
  const endpoints = [
    '/health/health',
    '/api/v1/market/overview',
    '/api/v1/transfers',
    '/api/v1/groups',
    '/api/v1/pots',
    '/api/v1/vaults'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        console.log(`   Response:`, data);
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status}`);
        const text = await response.text();
        console.log(`   Error:`, text);
      }
      
    } catch (error) {
      console.log(`💥 ${endpoint} - Network Error:`, error.message);
    }
  }
}

// Test specific market data endpoint
async function testMarketData() {
  console.log('\n🎯 Testing Market Data specifically...');
  
  try {
    const response = await fetch('http://localhost:3001/api/v1/market/overview', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Market data received:', data);
    } else {
      const text = await response.text();
      console.log('❌ Market data error:', text);
    }
    
  } catch (error) {
    console.log('💥 Market data network error:', error);
  }
}

// Test with different CORS settings
async function testCorsSettings() {
  console.log('\n🌐 Testing different CORS settings...');
  
  const corsOptions = [
    { mode: 'cors', credentials: 'include' },
    { mode: 'cors', credentials: 'omit' },
    { mode: 'no-cors' },
    { mode: 'same-origin' }
  ];
  
  for (const options of corsOptions) {
    try {
      console.log(`\nTesting with:`, options);
      
      const response = await fetch('http://localhost:3001/health/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        ...options
      });
      
      console.log(`✅ Status: ${response.status}`);
      
      if (response.ok && options.mode !== 'no-cors') {
        const data = await response.json();
        console.log(`   Data:`, data);
      }
      
    } catch (error) {
      console.log(`❌ Error with ${JSON.stringify(options)}:`, error.message);
    }
  }
}

// Run tests
console.log('🚀 Starting API connection tests...');

testApiConnection()
  .then(() => testMarketData())
  .then(() => testCorsSettings())
  .then(() => {
    console.log('\n🏁 API connection tests completed!');
  })
  .catch(error => {
    console.error('💥 Test runner failed:', error);
  });