#!/usr/bin/env node

/**
 * Comprehensive Data Consistency Validation
 * Tests data consistency across all system components:
 * - Frontend displays vs contract state
 * - API responses vs direct contract queries
 * - MCP agent decisions vs real data
 * - Bot operations vs blockchain transactions
 */

const { CosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const axios = require('axios');
const fs = require('fs').promises;

// Configuration
const CONFIG = {
  RPC_URL: 'https://rpc.atlantic-2.seinetwork.io:443',
  API_BASE: 'http://localhost:3001',
  FRONTEND_BASE: 'http://localhost:5173',
  CONTRACTS: {
    PAYMENTS: 'sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg',
    GROUPS: 'sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt',
    POTS: 'sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj',
    VAULTS: 'sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h',
    ALIAS: 'sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4',
    RISK_ESCROW: 'sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj'
  },
  TEST_ADDRESSES: [
    'sei1test1234567890abcdef1234567890abcdef12',
    'sei1test2345678901bcdef12345678901bcdef123'
  ]
};

class DataConsistencyValidator {
  constructor() {
    this.client = null;
    this.results = {
      frontend: [],
      api: [],
      agents: [],
      bots: [],
      summary: {}
    };
  }

  async initialize() {
    console.log('🔧 Initializing Data Consistency Validator...');
    this.client = await CosmWasmClient.connect(CONFIG.RPC_URL);
    console.log('✅ Connected to Sei network');
  }  //
 1. Verify frontend displays match actual contract state
  async validateFrontendConsistency() {
    console.log('\n📱 Validating Frontend Data Consistency...');
    
    try {
      // Test transfers display consistency
      const contractTransfers = await this.getContractTransfers();
      const frontendTransfers = await this.getFrontendTransfers();
      
      const transfersMatch = this.compareTransferData(contractTransfers, frontendTransfers);
      this.results.frontend.push({
        component: 'Transfers',
        consistent: transfersMatch.consistent,
        details: transfersMatch.details
      });

      // Test vaults display consistency
      const contractVaults = await this.getContractVaults();
      const frontendVaults = await this.getFrontendVaults();
      
      const vaultsMatch = this.compareVaultData(contractVaults, frontendVaults);
      this.results.frontend.push({
        component: 'Vaults',
        consistent: vaultsMatch.consistent,
        details: vaultsMatch.details
      });

      // Test groups display consistency
      const contractGroups = await this.getContractGroups();
      const frontendGroups = await this.getFrontendGroups();
      
      const groupsMatch = this.compareGroupData(contractGroups, frontendGroups);
      this.results.frontend.push({
        component: 'Groups',
        consistent: groupsMatch.consistent,
        details: groupsMatch.details
      });

      console.log('✅ Frontend consistency validation completed');
      
    } catch (error) {
      console.error('❌ Frontend validation failed:', error.message);
      this.results.frontend.push({
        component: 'General',
        consistent: false,
        details: `Validation failed: ${error.message}`
      });
    }
  }

  // 2. Test API responses against direct contract queries for accuracy
  async validateAPIConsistency() {
    console.log('\n🔌 Validating API Data Consistency...');
    
    try {
      // Test transfers API vs contract
      const apiTransfers = await this.getAPITransfers();
      const contractTransfers = await this.getContractTransfers();
      
      const transfersAccurate = this.compareAPIvsContract('transfers', apiTransfers, contractTransfers);
      this.results.api.push(transfersAccurate);

      // Test vaults API vs contract
      const apiVaults = await this.getAPIVaults();
      const contractVaults = await this.getContractVaults();
      
      const vaultsAccurate = this.compareAPIvsContract('vaults', apiVaults, contractVaults);
      this.results.api.push(vaultsAccurate);

      // Test market data API vs calculated values
      const apiMarketData = await this.getAPIMarketData();
      const calculatedMarketData = await this.calculateMarketData();
      
      const marketDataAccurate = this.compareMarketData(apiMarketData, calculatedMarketData);
      this.results.api.push(marketDataAccurate);

      console.log('✅ API consistency validation completed');
      
    } catch (error) {
      console.error('❌ API validation failed:', error.message);
      this.results.api.push({
        endpoint: 'General',
        accurate: false,
        details: `Validation failed: ${error.message}`
      });
    }
  }