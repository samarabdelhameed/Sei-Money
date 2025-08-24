const { CosmWasmClient } = require('@cosmjs/cosmwasm-stargate');

// Configuration - Updated with working RPC endpoints
const config = {
  rpcUrl: 'https://sei-testnet-rpc.polkachu.com',
  contracts: {
    payments: 'sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg',
    groups: 'sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt',
    pots: 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj',
    vaults: 'sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h',
    escrow: 'sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj',
  }
};

async function testSDK() {
  console.log('🚀 Testing SeiMoney SDK Integration...\n');

  try {
    // Connect to Sei Network
    console.log('📡 Connecting to Sei Network...');
    console.log('   RPC URL:', config.rpcUrl);
    const client = await CosmWasmClient.connect(config.rpcUrl);
    console.log('✅ Connected successfully!\n');

    // Test 1: Payments Contract - Using correct query messages
    console.log('💰 Testing Payments Contract...');
    try {
      // Test config query
      const paymentsConfig = await client.queryContractSmart(config.contracts.payments, {
        config: {}
      });
      console.log('✅ Payments contract config query successful');
      console.log('   Config:', JSON.stringify(paymentsConfig, null, 2));
    } catch (error) {
      console.log('❌ Payments contract config query failed:', error.message);
    }

    try {
      // Test list_by_sender query
      const paymentsList = await client.queryContractSmart(config.contracts.payments, {
        list_by_sender: { sender: 'sei174zezekzgevcnkrdax3grty7ewzuj20y6vm9nk' }
      });
      console.log('✅ Payments contract list_by_sender query successful');
      console.log('   Transfers:', JSON.stringify(paymentsList, null, 2));
    } catch (error) {
      console.log('❌ Payments contract list_by_sender query failed:', error.message);
    }
    console.log('');

    // Test 2: Groups Contract - Using correct query messages
    console.log('👥 Testing Groups Contract...');
    try {
      // Test config query
      const groupsConfig = await client.queryContractSmart(config.contracts.groups, {
        config: {}
      });
      console.log('✅ Groups contract config query successful');
      console.log('   Config:', JSON.stringify(groupsConfig, null, 2));
    } catch (error) {
      console.log('❌ Groups contract config query failed:', error.message);
    }

    try {
      // Test list_pools query
      const groupsPools = await client.queryContractSmart(config.contracts.groups, {
        list_pools: {}
      });
      console.log('✅ Groups contract list_pools query successful');
      console.log('   Pools:', JSON.stringify(groupsPools, null, 2));
    } catch (error) {
      console.log('❌ Groups contract list_pools query failed:', error.message);
    }
    console.log('');

    // Test 3: Pots Contract - Already working
    console.log('🏺 Testing Pots Contract...');
    try {
      const potsInfo = await client.queryContractSmart(config.contracts.pots, {
        list_all_pots: {}
      });
      console.log('✅ Pots contract query successful');
      console.log('   Response:', JSON.stringify(potsInfo, null, 2));
    } catch (error) {
      console.log('❌ Pots contract query failed:', error.message);
    }
    console.log('');

    // Test 4: Vaults Contract - Already working
    console.log('🏦 Testing Vaults Contract...');
    try {
      const vaultsInfo = await client.queryContractSmart(config.contracts.vaults, {
        list_vaults: {}
      });
      console.log('✅ Vaults contract query successful');
      console.log('   Response:', JSON.stringify(vaultsInfo, null, 2));
    } catch (error) {
      console.log('❌ Vaults contract query failed:', error.message);
    }
    console.log('');

    // Test 5: Escrow Contract - Using correct query messages
    console.log('🛡️ Testing Escrow Contract...');
    try {
      // Test config query
      const escrowConfig = await client.queryContractSmart(config.contracts.escrow, {
        config: {}
      });
      console.log('✅ Escrow contract config query successful');
      console.log('   Config:', JSON.stringify(escrowConfig, null, 2));
    } catch (error) {
      console.log('❌ Escrow contract config query failed:', error.message);
    }

    try {
      // Test list_cases query
      const escrowCases = await client.queryContractSmart(config.contracts.escrow, {
        list_cases: {}
      });
      console.log('✅ Escrow contract list_cases query successful');
      console.log('   Cases:', JSON.stringify(escrowCases, null, 2));
    } catch (error) {
      console.log('❌ Escrow contract list_cases query failed:', error.message);
    }
    console.log('');

    // Test 6: Network Info
    console.log('🌐 Testing Network Info...');
    try {
      const chainId = await client.getChainId();
      const height = await client.getHeight();
      console.log('✅ Network info retrieved');
      console.log('   Chain ID:', chainId);
      console.log('   Block Height:', height);
    } catch (error) {
      console.log('❌ Network info failed:', error.message);
    }
    console.log('');

    console.log('🎉 SDK Integration Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSDK().catch(console.error);
