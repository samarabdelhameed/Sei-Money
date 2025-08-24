/**
 * Example usage of Sei Money SDK
 */

import { 
  SeiMoneySDK, 
  NETWORKS, 
  DEFAULT_CONFIG,
  sendSecure,
  sendBatch,
  sendWithFee,
  splitTransfer,
  scheduleTransfer,
  sendWithEscrow
} from './index';

// Example 1: Basic SDK initialization
async function basicExample() {
  console.log('🚀 Initializing Sei Money SDK...');
  
  const sdk = new SeiMoneySDK({
    network: NETWORKS.TESTNET,
    contracts: {
      payments: 'sei1paymentscontract...',
      groups: 'sei1groupscontract...',
      pots: 'sei1potscontract...',
      alias: 'sei1aliascontract...',
      riskEscrow: 'sei1riskescrowcontract...',
      vaults: 'sei1vaultscontract...',
    }
  });
  
  console.log('✅ SDK initialized with configuration:', sdk.getConfiguration());
  
  return sdk;
}

// Example 2: Using helper functions
async function helperFunctionsExample() {
  console.log('🔧 Using helper functions...');
  
  // Mock payments client for demonstration
  const mockPaymentsClient = {
    createTransfer: async (recipient: string, amount: any, remark?: string, expiry?: number) => ({
      txHash: '0x' + Math.random().toString(36).substring(2),
      success: true,
      height: Math.floor(Math.random() * 10000),
      gasUsed: Math.floor(Math.random() * 100000),
    })
  } as any;
  
  const recipient = 'sei1recipientaddress...';
  const amount = { denom: 'usei', amount: '1000000' }; // 1 SEI
  
  try {
    // Send with automatic retry
    const secureResult = await sendSecure(mockPaymentsClient, recipient, amount, 'Secure transfer');
    console.log('✅ Secure transfer result:', secureResult);
    
    // Send with fee calculation
    const feeResult = await sendWithFee(mockPaymentsClient, recipient, amount, 2.5, 'With 2.5% fee');
    console.log('✅ Fee transfer result:', feeResult);
    
    // Split amount among multiple recipients
    const recipients = ['addr1', 'addr2', 'addr3'];
    const totalAmount = { denom: 'usei', amount: '3000000' }; // 3 SEI
    const splitResults = await splitTransfer(mockPaymentsClient, recipients, totalAmount);
    console.log('✅ Split transfer results:', splitResults);
    
    // Schedule transfer for later
    const scheduledResult = await scheduleTransfer(mockPaymentsClient, recipient, amount, 3600, '1 hour delay');
    console.log('✅ Scheduled transfer result:', scheduledResult);
    
    // Send with escrow behavior
    const escrowResult = await sendWithEscrow(mockPaymentsClient, recipient, amount, 30, '30-day escrow');
    console.log('✅ Escrow transfer result:', escrowResult);
    
  } catch (error) {
    console.error('❌ Error in helper functions:', error);
  }
}

// Example 3: Batch operations
async function batchOperationsExample() {
  console.log('📦 Batch operations example...');
  
  const mockPaymentsClient = {
    createTransfer: async (recipient: string, amount: any, remark?: string, expiry?: number) => ({
      txHash: '0x' + Math.random().toString(36).substring(2),
      success: true,
      height: Math.floor(Math.random() * 10000),
      gasUsed: Math.floor(Math.random() * 100000),
    })
  } as any;
  
  const transfers = [
    { 
      recipient: 'sei1user1...', 
      amount: { denom: 'usei', amount: '500000' },
      remark: 'Payment 1 of 3'
    },
    { 
      recipient: 'sei1user2...', 
      amount: { denom: 'usei', amount: '500000' },
      remark: 'Payment 2 of 3'
    },
    { 
      recipient: 'sei1user3...', 
      amount: { denom: 'usei', amount: '500000' },
      remark: 'Payment 3 of 3'
    }
  ];
  
  try {
    const results = await sendBatch(mockPaymentsClient, transfers);
    console.log('✅ Batch transfer results:', results);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📊 Batch summary: ${successful} successful, ${failed} failed`);
    
  } catch (error) {
    console.error('❌ Error in batch operations:', error);
  }
}

// Example 4: Configuration management
function configurationExample() {
  console.log('⚙️ Configuration management...');
  
  // Load from environment
  try {
    const envConfig = require('./config').loadConfigFromEnv();
    console.log('✅ Environment configuration loaded:', envConfig);
  } catch (error) {
    console.log('ℹ️ Environment configuration not available, using defaults');
  }
  
  // Use predefined networks
  const testnetConfig = require('./config').getConfig('testnet');
  const mainnetConfig = require('./config').getConfig('mainnet');
  const localConfig = require('./config').getConfig('local');
  
  console.log('🌐 Available network configurations:');
  console.log('  Testnet:', testnetConfig.network.chainId);
  console.log('  Mainnet:', mainnetConfig.network.chainId);
  console.log('  Local:', localConfig.network.chainId);
  
  // Default configuration
  console.log('🔧 Default configuration:', DEFAULT_CONFIG);
}

// Example 5: Error handling
async function errorHandlingExample() {
  console.log('🚨 Error handling example...');
  
  try {
    // Simulate an error
    throw new Error('Simulated error for demonstration');
  } catch (error) {
    if (error instanceof Error) {
      console.log('✅ Caught and handled error:', error.message);
    }
  }
  
  // Custom error types
  try {
    const { SeiMoneyError } = require('./types');
    throw new SeiMoneyError(
      'Custom error message',
      'CUSTOM_ERROR_CODE',
      { detail: 'Additional error details' }
    );
  } catch (error: any) {
    if (error.name === 'SeiMoneyError') {
      console.log('✅ Custom error caught:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
    }
  }
}

// Example 6: Utility functions
function utilityFunctionsExample() {
  console.log('🛠️ Utility functions example...');
  
  const { 
    formatCoin, 
    parseCoin, 
    addCoins, 
    multiplyCoin,
    isValidAddress,
    generateId,
    deepClone
  } = require('./utils');
  
  // Coin formatting
  const coin = { denom: 'usei', amount: '1500000' };
  console.log('💰 Formatted coin:', formatCoin(coin));
  console.log('💰 Formatted coin (3 decimals):', formatCoin(coin, 3));
  
  // Coin parsing
  try {
    const parsedCoin = parseCoin('2.5 usei');
    console.log('🔍 Parsed coin:', parsedCoin);
  } catch (error) {
    console.log('❌ Parse error:', error);
  }
  
  // Coin arithmetic
  const coin1 = { denom: 'usei', amount: '1000000' };
  const coin2 = { denom: 'usei', amount: '500000' };
  const sum = addCoins(coin1, coin2);
  const doubled = multiplyCoin(coin1, 2);
  
  console.log('➕ Sum of coins:', formatCoin(sum));
  console.log('✖️ Doubled coin:', formatCoin(doubled));
  
  // Address validation
  const validAddress = 'sei1abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890';
  const invalidAddress = 'invalid-address';
  
  console.log('✅ Valid address:', isValidAddress(validAddress));
  console.log('❌ Invalid address:', isValidAddress(invalidAddress));
  
  // ID generation
  const id1 = generateId();
  const id2 = generateId();
  console.log('🆔 Generated IDs:', { id1, id2, unique: id1 !== id2 });
  
  // Deep cloning
  const original = { a: 1, b: { c: 2, d: [3, 4] } };
  const cloned = deepClone(original);
  original.b.c = 5;
  original.b.d.push(6);
  
  console.log('📋 Deep clone test:', {
    original: original.b,
    cloned: cloned.b,
    independent: original.b !== cloned.b
  });
}

// Main function to run all examples
async function runExamples() {
  console.log('🎯 Sei Money SDK Examples');
  console.log('========================\n');
  
  try {
    // Run examples
    await basicExample();
    console.log('\n');
    
    await helperFunctionsExample();
    console.log('\n');
    
    await batchOperationsExample();
    console.log('\n');
    
    configurationExample();
    console.log('\n');
    
    await errorHandlingExample();
    console.log('\n');
    
    utilityFunctionsExample();
    console.log('\n');
    
    console.log('🎉 All examples completed successfully!');
    
  } catch (error) {
    console.error('💥 Error running examples:', error);
  }
}

// Export for use in other files
export {
  basicExample,
  helperFunctionsExample,
  batchOperationsExample,
  configurationExample,
  errorHandlingExample,
  utilityFunctionsExample,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}
