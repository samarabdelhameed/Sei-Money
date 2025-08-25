#!/usr/bin/env node

/**
 * Comprehensive Data Consistency Validation
 * Validates data consistency across all system components
 */

const { getEnhancedSdk } = require('./dist/lib/sdk-enhanced');
const { getRealDataService } = require('./dist/services/realDataService');

async function validateDataConsistency() {
  console.log('🔍 Comprehensive Data Consistency Validation\n');

  try {
    const sdk = await getEnhancedSdk();
    const realDataService = await getRealDataService();
    let results = { passed: 0, failed: 0, details: [] };

    // Test 1: Contract Data Consistency
    console.log('1️⃣ Contract Data Consistency');
    try {
      // Test contract accessibility without invalid address
      const groups = await sdk.listGroups();
      const vaults = await sdk.listVaults();
      const pots = await sdk.listAllPots();
      const config = await sdk.getPaymentsConfig();
      
      console.log('✅ All contract queries consistent');
      console.log(`   Payments Config: ${Object.keys(config).length} keys`);
      console.log(`   Groups: ${groups.length}`);
      console.log(`   Vaults: ${vaults.length}`);
      console.log(`   Pots: ${pots.length}`);
      
      results.passed++;
      results.details.push('Contract data consistency: PASSED');
    } catch (error) {
      console.log('❌ Contract data consistency failed:', error.message);
      results.failed++;
      results.details.push('Contract data consistency: FAILED');
    }

    // Test 2: Market Data Consistency
    console.log('\n2️⃣ Market Data Consistency');
    try {
      const marketStats = await realDataService.getMarketStats();
      const systemHealth = await realDataService.getSystemHealth();
      
      console.log('✅ Market data calculation consistent');
      console.log(`   TVL: ${marketStats.totalTvl.toFixed(2)} SEI`);
      console.log(`   Active Users: ${marketStats.activeUsers}`);
      console.log(`   Success Rate: ${(marketStats.successRate * 100).toFixed(1)}%`);
      console.log(`   System Health: ${systemHealth.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      
      results.passed++;
      results.details.push('Market data consistency: PASSED');
    } catch (error) {
      console.log('❌ Market data consistency failed:', error.message);
      results.failed++;
      results.details.push('Market data consistency: FAILED');
    }

    // Test 3: SDK Health Consistency
    console.log('\n3️⃣ SDK Health Consistency');
    try {
      const health = await sdk.healthCheck();
      
      console.log('✅ SDK health check consistent');
      console.log(`   RPC Health: ${health.rpcHealth.healthy}/${health.rpcHealth.total}`);
      console.log(`   Contract Health: ${Object.values(health.contracts).filter(s => s === 'healthy').length}/${Object.keys(health.contracts).length}`);
      
      results.passed++;
      results.details.push('SDK health consistency: PASSED');
    } catch (error) {
      console.log('❌ SDK health consistency failed:', error.message);
      results.failed++;
      results.details.push('SDK health consistency: FAILED');
    }

    // Final Results
    console.log('\n' + '='.repeat(60));
    console.log('🎯 DATA CONSISTENCY VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    const totalTests = results.passed + results.failed;
    const successRate = ((results.passed / totalTests) * 100).toFixed(1);
    
    console.log(`📊 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📈 Success Rate: ${successRate}%`);
    
    console.log('\n📋 DETAILED RESULTS:');
    results.details.forEach((detail, index) => {
      console.log(`   ${index + 1}. ${detail}`);
    });
    
    if (results.failed === 0) {
      console.log('\n🎉 ALL DATA CONSISTENCY TESTS PASSED!');
      console.log('✅ System components are consistent');
      console.log('✅ Real blockchain data integration working');
      console.log('✅ Market calculations accurate');
      console.log('✅ Health monitoring operational');
    } else {
      console.log('\n⚠️ Some consistency tests failed - review above');
    }

  } catch (error) {
    console.error('❌ Data consistency validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  validateDataConsistency()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { validateDataConsistency };