#!/usr/bin/env node

const { spawn } = require('child_process');
const fetch = require('node-fetch');

// Test data
const testData = {
  riskTest: {
    from: "sei1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890",
    to: "sei1def456ghi789jkl012mno345pqr678stu901vwx234yz567890abc123",
    amount: { denom: "usei", amount: "50000000" },
    action: "transfer",
    context: { txPerHour: "25", txPerDay: "150" }
  },
  
  scheduleTest: {
    action: "harvest",
    targetId: 123,
    urgency: "normal",
    gasCeiling: 100000
  },
  
  rebalanceTest: {
    vaultId: 456,
    signals: {
      prices: { SEI: 0.45, USDC: 1.0, ATOM: 8.2 },
      apr: { Staking: 0.12, Lending: 0.08, LP: 0.15, PerpsHedge: 0.18 },
      risk: 35
    },
    model: "rl"
  },
  
  mcpTests: {
    watchWallet: { address: "sei1abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890" },
    trackMemeCoin: { denom: "factory/sei1.../DOGE", timeframe: "24h" },
    trackNftLifetime: { collection: "sei-punks", includeMetadata: true },
    rebalanceWhatIf: {
      signals: {
        prices: { SEI: 0.45, USDC: 1.0 },
        apr: { Staking: 0.12, Lending: 0.08, LP: 0.15 },
        risk: 40
      },
      model: "bandit"
    }
  }
};

async function testAgent(port, endpoint, data, name) {
  try {
    console.log(`\n🧪 Testing ${name} on port ${port}...`);
    
    const response = await fetch(`http://localhost:${port}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`✅ ${name} Response:`, JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ ${name} Error:`, error.message);
    return false;
  }
}

async function testHealthCheck(port, name) {
  try {
    const response = await fetch(`http://localhost:${port}/health`);
    const result = await response.json();
    console.log(`💚 ${name} Health:`, result);
    return true;
  } catch (error) {
    console.error(`💔 ${name} Health Check Failed:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting MCP Agents Test Suite...\n');
  
  // Wait a bit for servers to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const tests = [
    // Health checks first
    () => testHealthCheck(7001, 'Risk Agent'),
    () => testHealthCheck(7002, 'Scheduler Agent'),
    () => testHealthCheck(7003, 'Rebalancer Agent'),
    () => testHealthCheck(7100, 'MCP Server'),
    
    // Functional tests
    () => testAgent(7001, '/risk/score', testData.riskTest, 'Risk Scoring'),
    () => testAgent(7002, '/schedule/plan', testData.scheduleTest, 'Schedule Planning'),
    () => testAgent(7003, '/rebalance/plan', testData.rebalanceTest, 'Rebalance Planning'),
    
    // MCP Tools tests
    () => testAgent(7100, '/mcp/tools/watchWallet', testData.mcpTests.watchWallet, 'MCP Watch Wallet'),
    () => testAgent(7100, '/mcp/tools/trackMemeCoin', testData.mcpTests.trackMemeCoin, 'MCP Track MemeCoin'),
    () => testAgent(7100, '/mcp/tools/trackNftLifetime', testData.mcpTests.trackNftLifetime, 'MCP Track NFT'),
    () => testAgent(7100, '/mcp/tools/rebalanceWhatIf', testData.mcpTests.rebalanceWhatIf, 'MCP Rebalance What-If'),
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test();
    if (result) passed++;
    else failed++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! MCP Agents are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.');
  }
}

runTests().catch(console.error);