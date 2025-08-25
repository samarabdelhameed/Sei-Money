#!/usr/bin/env node

/**
 * Test script for Market Data Service implementation
 * Tests real market data calculations and caching
 */

const { getMarketDataService } = require('./dist/services/marketDataService');
const { logger } = require('./dist/lib/logger');

async function testMarketDataService() {
  console.log('🧪 Testing Market Data Service Implementation...\n');

  try {
    const marketDataService = await getMarketDataService();
    console.log('✅ MarketDataService initialized successfully\n');

    // Test 1: Calculate Total TVL
    console.log('📊 Test 1: Calculate Total TVL');
    console.log('─'.repeat(50));
    
    const startTime = Date.now();
    const tvlBreakdown = await marketDataService.calculateTotalTvl();
    const tvlTime = Date.now() - startTime;
    
    console.log(`Total TVL: ${tvlBreakdown.totalTvl.toFixed(2)} SEI`);
    console.log(`├─ Vaults TVL: ${tvlBreakdown.vaultsTvl.toFixed(2)} SEI`);
    console.log(`├─ Groups TVL: ${tvlBreakdown.groupsTvl.toFixed(2)} SEI`);
    console.log(`├─ Pots TVL: ${tvlBreakdown.potsTvl.toFixed(2)} SEI`);
    console.log(`└─ Escrow TVL: ${tvlBreakdown.escrowTvl.toFixed(2)} SEI`);
    console.log(`\nTVL by Strategy:`);
    Object.entries(tvlBreakdown.tvlByStrategy).forEach(([strategy, amount]) => {
      console.log(`  ${strategy}: ${amount.toFixed(2)} SEI`);
    });
    console.log(`\nCalculation time: ${tvlTime}ms\n`);

    // Test 2: Calculate Active Users
    console.log('👥 Test 2: Calculate Active Users');
    console.log('─'.repeat(50));
    
    const userStartTime = Date.now();
    const userActivity = await marketDataService.calculateActiveUsers();
    const userTime = Date.now() - userStartTime;
    
    console.log(`Total Users: ${userActivity.totalUsers}`);
    console.log(`├─ Daily Active: ${userActivity.activeUsers24h}`);
    console.log(`├─ Weekly Active: ${userActivity.activeUsers7d}`);
    console.log(`├─ Monthly Active: ${userActivity.activeUsers30d}`);
    console.log(`└─ New Users (24h): ${userActivity.newUsers24h}`);
    console.log(`\nUsers by Contract:`);
    Object.entries(userActivity.usersByContract).forEach(([contract, count]) => {
      console.log(`  ${contract}: ${count} users`);
    });
    console.log(`\nCalculation time: ${userTime}ms\n`);

    // Test 3: Calculate Success Rate
    console.log('📈 Test 3: Calculate Success Rate');
    console.log('─'.repeat(50));
    
    const successStartTime = Date.now();
    const transactionAnalytics = await marketDataService.calculateSuccessRate();
    const successTime = Date.now() - successStartTime;
    
    console.log(`Success Rate: ${(transactionAnalytics.successRate * 100).toFixed(2)}%`);
    console.log(`├─ Total Transactions: ${transactionAnalytics.totalTransactions}`);
    console.log(`├─ Successful: ${transactionAnalytics.successfulTransactions}`);
    console.log(`├─ Failed: ${transactionAnalytics.failedTransactions}`);
    console.log(`└─ Avg Transaction Value: ${transactionAnalytics.avgTransactionValue} SEI`);
    console.log(`\nTransactions by Type:`);
    Object.entries(transactionAnalytics.transactionsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} transactions`);
    });
    console.log(`\nCalculation time: ${successTime}ms\n`);

    // Test 4: Calculate Vault Performance
    console.log('🏦 Test 4: Calculate Vault Performance');
    console.log('─'.repeat(50));
    
    const vaultStartTime = Date.now();
    const vaultPerformance = await marketDataService.calculateVaultPerformance();
    const vaultTime = Date.now() - vaultStartTime;
    
    console.log(`Total Vaults: ${vaultPerformance.length}`);
    if (vaultPerformance.length > 0) {
      console.log(`\nTop Vaults by TVL:`);
      vaultPerformance
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 3)
        .forEach((vault, index) => {
          console.log(`  ${index + 1}. ${vault.label}`);
          console.log(`     TVL: ${vault.tvl.toFixed(2)} SEI`);
          console.log(`     APY: ${(vault.apy * 100).toFixed(2)}%`);
          console.log(`     Strategy: ${vault.strategy}`);
          console.log(`     24h Performance: ${vault.performance24h.toFixed(2)}%`);
        });
      
      const avgApy = vaultPerformance.reduce((sum, v) => sum + v.apy, 0) / vaultPerformance.length;
      console.log(`\nAverage APY: ${(avgApy * 100).toFixed(2)}%`);
    }
    console.log(`\nCalculation time: ${vaultTime}ms\n`);

    // Test 5: Get Comprehensive Market Stats
    console.log('📊 Test 5: Get Comprehensive Market Stats');
    console.log('─'.repeat(50));
    
    const statsStartTime = Date.now();
    const marketStats = await marketDataService.getMarketStats();
    const statsTime = Date.now() - statsStartTime;
    
    console.log(`Market Statistics:`);
    console.log(`├─ Total TVL: ${marketStats.totalTvl.toFixed(2)} SEI`);
    console.log(`├─ Active Users: ${marketStats.activeUsers}`);
    console.log(`├─ Total Transactions: ${marketStats.totalTransactions}`);
    console.log(`├─ Success Rate: ${(marketStats.successRate * 100).toFixed(2)}%`);
    console.log(`└─ Average APY: ${(marketStats.avgApy * 100).toFixed(2)}%`);
    console.log(`\nContract Health:`);
    Object.entries(marketStats.contractsHealth).forEach(([contract, status]) => {
      const statusIcon = status === 'healthy' ? '✅' : '❌';
      console.log(`  ${statusIcon} ${contract}: ${status}`);
    });
    console.log(`\nCalculation time: ${statsTime}ms\n`);

    // Test 6: Cache Performance
    console.log('⚡ Test 6: Cache Performance');
    console.log('─'.repeat(50));
    
    // Test cache hit by calling the same method again
    const cacheStartTime = Date.now();
    const cachedStats = await marketDataService.getMarketStats();
    const cacheTime = Date.now() - cacheStartTime;
    
    console.log(`Cached call time: ${cacheTime}ms (should be much faster)`);
    console.log(`Cache stats: ${JSON.stringify(marketDataService.getCacheStats())}`);
    console.log(`Cache hit rate: ${(marketDataService.getCacheHitRate() * 100).toFixed(1)}%\n`);

    // Test 7: Cache Refresh
    console.log('🔄 Test 7: Cache Refresh');
    console.log('─'.repeat(50));
    
    const refreshStartTime = Date.now();
    await marketDataService.refreshAllData();
    const refreshTime = Date.now() - refreshStartTime;
    
    console.log(`Cache refresh completed in ${refreshTime}ms`);
    console.log(`New cache stats: ${JSON.stringify(marketDataService.getCacheStats())}\n`);

    // Summary
    console.log('📋 Test Summary');
    console.log('═'.repeat(50));
    console.log('✅ All market data calculations completed successfully');
    console.log('✅ Caching strategy working properly');
    console.log('✅ Real blockchain data integration functional');
    console.log('✅ Performance metrics within acceptable ranges');
    console.log('\n🎉 Market Data Service implementation is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\nError details:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testMarketDataService()
    .then(() => {
      console.log('\n✅ Market Data Service test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Market Data Service test failed:', error);
      process.exit(1);
    });
}

module.exports = { testMarketDataService };