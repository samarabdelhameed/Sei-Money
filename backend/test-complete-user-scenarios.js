#!/usr/bin/env node

/**
 * Complete User Test Scenarios - Real Data Integration
 * Tests full user workflows with real funds and contract interactions
 * 
 * This script tests:
 * - Transfer creation, claim, and refund workflows
 * - Group pool creation, contribution, and distribution
 * - Vault deposit, withdrawal, and rebalancing
 * - Savings pot creation, deposits, and goal tracking
 */

const { getEnhancedSdk, CONTRACTS, NETWORK_CONFIG } = require('./dist/lib/sdk-enhanced');
const { getRealDataService } = require('./dist/services/realDataService');
const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');

// Test configuration
const TEST_CONFIG = {
  // Test wallet mnemonics (use testnet wallets with small amounts)
  SENDER_MNEMONIC: process.env.TEST_SENDER_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  RECIPIENT_MNEMONIC: process.env.TEST_RECIPIENT_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon',
  
  // Test amounts (in microsei - 1 SEI = 1,000,000 usei)
  TRANSFER_AMOUNT: '1000000', // 1 SEI
  VAULT_DEPOSIT: '5000000',   // 5 SEI
  GROUP_CONTRIBUTION: '2000000', // 2 SEI
  POT_DEPOSIT: '3000000',     // 3 SEI
  
  // Test timeouts
  TRANSACTION_TIMEOUT: 30000, // 30 seconds
  CONFIRMATION_TIMEOUT: 60000, // 60 seconds
};

class UserTestScenarios {
  constructor() {
    this.sdk = null;
    this.signingClient = null;
    this.senderWallet = null;
    this.recipientWallet = null;
    this.senderAddress = null;
    this.recipientAddress = null;
    this.realDataService = null;
    this.testResults = {
      transfers: { passed: 0, failed: 0, details: [] },
      groups: { passed: 0, failed: 0, details: [] },
      vaults: { passed: 0, failed: 0, details: [] },
      pots: { passed: 0, failed: 0, details: [] },
    };
  }

  async initialize() {
    console.log('🚀 Initializing Complete User Test Scenarios\n');

    try {
      // Initialize wallets
      console.log('1️⃣ Setting up test wallets...');
      this.senderWallet = await DirectSecp256k1HdWallet.fromMnemonic(
        TEST_CONFIG.SENDER_MNEMONIC,
        { prefix: 'sei' }
      );
      this.recipientWallet = await DirectSecp256k1HdWallet.fromMnemonic(
        TEST_CONFIG.RECIPIENT_MNEMONIC,
        { prefix: 'sei' }
      );

      const senderAccounts = await this.senderWallet.getAccounts();
      const recipientAccounts = await this.recipientWallet.getAccounts();
      
      this.senderAddress = senderAccounts[0].address;
      this.recipientAddress = recipientAccounts[0].address;

      console.log(`✅ Sender wallet: ${this.senderAddress}`);
      console.log(`✅ Recipient wallet: ${this.recipientAddress}\n`);

      // Initialize SDK and services
      console.log('2️⃣ Initializing SDK and services...');
      this.sdk = await getEnhancedSdk();
      
      // Create signing client for transactions
      this.signingClient = await SigningCosmWasmClient.connectWithSigner(
        NETWORK_CONFIG.RPC_URL,
        this.senderWallet
      );

      this.realDataService = await getRealDataService();
      console.log('✅ SDK and services initialized\n');

      // Check wallet balances
      console.log('3️⃣ Checking wallet balances...');
      await this.checkWalletBalances();

    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  async checkWalletBalances() {
    try {
      const senderBalance = await this.sdk.getWalletBalance(this.senderAddress);
      const recipientBalance = await this.sdk.getWalletBalance(this.recipientAddress);

      console.log('Sender balance:');
      senderBalance.forEach(coin => {
        console.log(`  ${coin.amount} ${coin.denom}`);
      });

      console.log('Recipient balance:');
      recipientBalance.forEach(coin => {
        console.log(`  ${coin.amount} ${coin.denom}`);
      });

      // Check if sender has enough balance for tests
      const seiBalance = senderBalance.find(coin => coin.denom === 'usei');
      const requiredAmount = parseInt(TEST_CONFIG.TRANSFER_AMOUNT) + 
                           parseInt(TEST_CONFIG.VAULT_DEPOSIT) + 
                           parseInt(TEST_CONFIG.GROUP_CONTRIBUTION) + 
                           parseInt(TEST_CONFIG.POT_DEPOSIT);

      if (!seiBalance || parseInt(seiBalance.amount) < requiredAmount) {
        console.log('⚠️  Warning: Sender wallet may not have sufficient balance for all tests');
        console.log(`  Required: ${requiredAmount} usei`);
        console.log(`  Available: ${seiBalance ? seiBalance.amount : '0'} usei`);
      } else {
        console.log('✅ Sufficient balance available for tests');
      }
      console.log();

    } catch (error) {
      console.error('❌ Balance check failed:', error);
      throw error;
    }
  }

  async runTransferScenarios() {
    console.log('🔄 Testing Transfer Workflows\n');

    try {
      // Scenario 1: Create Transfer
      console.log('📤 Scenario 1: Create Transfer');
      const transferResult = await this.testCreateTransfer();
      
      if (transferResult.success) {
        this.testResults.transfers.passed++;
        console.log('✅ Transfer creation: PASSED\n');

        // Scenario 2: Claim Transfer
        console.log('📥 Scenario 2: Claim Transfer');
        const claimResult = await this.testClaimTransfer(transferResult.transferId);
        
        if (claimResult.success) {
          this.testResults.transfers.passed++;
          console.log('✅ Transfer claim: PASSED\n');
        } else {
          this.testResults.transfers.failed++;
          console.log('❌ Transfer claim: FAILED\n');
        }

        // Scenario 3: Create and Refund Transfer
        console.log('🔄 Scenario 3: Create and Refund Transfer');
        const refundResult = await this.testRefundTransfer();
        
        if (refundResult.success) {
          this.testResults.transfers.passed++;
          console.log('✅ Transfer refund: PASSED\n');
        } else {
          this.testResults.transfers.failed++;
          console.log('❌ Transfer refund: FAILED\n');
        }

      } else {
        this.testResults.transfers.failed++;
        console.log('❌ Transfer creation: FAILED\n');
      }

    } catch (error) {
      console.error('❌ Transfer scenarios failed:', error);
      this.testResults.transfers.failed++;
    }
  }

  async testCreateTransfer() {
    try {
      const transferData = {
        recipient: this.recipientAddress,
        amount: { amount: TEST_CONFIG.TRANSFER_AMOUNT, denom: 'usei' },
        expiry_ts: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        remark: 'Test transfer - Complete user scenario'
      };

      console.log('  Creating transfer...');
      const result = await this.signingClient.execute(
        this.senderAddress,
        CONTRACTS.PAYMENTS,
        { create_transfer: transferData },
        'auto'
      );

      console.log(`  ✅ Transaction hash: ${result.transactionHash}`);
      console.log(`  ✅ Block height: ${result.height}`);

      // Extract transfer ID from events
      const transferEvent = result.events.find(e => e.type === 'wasm');
      const transferId = transferEvent?.attributes.find(a => a.key === 'transfer_id')?.value;

      if (transferId) {
        console.log(`  ✅ Transfer ID: ${transferId}`);
        
        // Verify transfer exists in contract
        const transfer = await this.sdk.getTransfer(parseInt(transferId));
        console.log(`  ✅ Transfer verified on-chain: ${transfer.status}`);
        
        return { success: true, transferId: parseInt(transferId), txHash: result.transactionHash };
      } else {
        throw new Error('Transfer ID not found in transaction events');
      }

    } catch (error) {
      console.error('  ❌ Create transfer failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testClaimTransfer(transferId) {
    try {
      console.log(`  Claiming transfer ID: ${transferId}`);
      
      // Switch to recipient wallet for claiming
      const recipientSigningClient = await SigningCosmWasmClient.connectWithSigner(
        NETWORK_CONFIG.RPC_URL,
        this.recipientWallet
      );

      const result = await recipientSigningClient.execute(
        this.recipientAddress,
        CONTRACTS.PAYMENTS,
        { claim_transfer: { id: transferId } },
        'auto'
      );

      console.log(`  ✅ Claim transaction hash: ${result.transactionHash}`);
      
      // Verify transfer status changed
      const transfer = await this.sdk.getTransfer(transferId);
      console.log(`  ✅ Transfer status after claim: ${transfer.status}`);
      
      if (transfer.status === 'claimed') {
        return { success: true, txHash: result.transactionHash };
      } else {
        throw new Error(`Expected status 'claimed', got '${transfer.status}'`);
      }

    } catch (error) {
      console.error('  ❌ Claim transfer failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testRefundTransfer() {
    try {
      // Create a transfer first
      const transferData = {
        recipient: this.recipientAddress,
        amount: { amount: TEST_CONFIG.TRANSFER_AMOUNT, denom: 'usei' },
        expiry_ts: Math.floor(Date.now() / 1000) + 60, // 1 minute from now
        remark: 'Test refund transfer'
      };

      console.log('  Creating transfer for refund test...');
      const createResult = await this.signingClient.execute(
        this.senderAddress,
        CONTRACTS.PAYMENTS,
        { create_transfer: transferData },
        'auto'
      );

      const transferEvent = createResult.events.find(e => e.type === 'wasm');
      const transferId = parseInt(transferEvent?.attributes.find(a => a.key === 'transfer_id')?.value);

      console.log(`  ✅ Created transfer ID: ${transferId}`);

      // Wait a moment then refund
      console.log('  Waiting before refund...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('  Refunding transfer...');
      const refundResult = await this.signingClient.execute(
        this.senderAddress,
        CONTRACTS.PAYMENTS,
        { refund_transfer: { id: transferId } },
        'auto'
      );

      console.log(`  ✅ Refund transaction hash: ${refundResult.transactionHash}`);
      
      // Verify transfer status
      const transfer = await this.sdk.getTransfer(transferId);
      console.log(`  ✅ Transfer status after refund: ${transfer.status}`);
      
      if (transfer.status === 'refunded') {
        return { success: true, txHash: refundResult.transactionHash };
      } else {
        throw new Error(`Expected status 'refunded', got '${transfer.status}'`);
      }

    } catch (error) {
      console.error('  ❌ Refund transfer failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async runGroupScenarios() {
    console.log('👥 Testing Group Pool Workflows\n');

    try {
      // Scenario 1: Create Group Pool
      console.log('🏗️  Scenario 1: Create Group Pool');
      const groupResult = await this.testCreateGroup();
      
      if (groupResult.success) {
        this.testResults.groups.passed++;
        console.log('✅ Group creation: PASSED\n');

        // Scenario 2: Contribute to Group
        console.log('💰 Scenario 2: Contribute to Group');
        const contributeResult = await this.testContributeToGroup(groupResult.groupId);
        
        if (contributeResult.success) {
          this.testResults.groups.passed++;
          console.log('✅ Group contribution: PASSED\n');

          // Scenario 3: Check Group Progress
          console.log('📊 Scenario 3: Check Group Progress');
          const progressResult = await this.testGroupProgress(groupResult.groupId);
          
          if (progressResult.success) {
            this.testResults.groups.passed++;
            console.log('✅ Group progress tracking: PASSED\n');
          } else {
            this.testResults.groups.failed++;
            console.log('❌ Group progress tracking: FAILED\n');
          }

        } else {
          this.testResults.groups.failed++;
          console.log('❌ Group contribution: FAILED\n');
        }

      } else {
        this.testResults.groups.failed++;
        console.log('❌ Group creation: FAILED\n');
      }

    } catch (error) {
      console.error('❌ Group scenarios failed:', error);
      this.testResults.groups.failed++;
    }
  }

  async testCreateGroup() {
    try {
      const groupData = {
        name: `Test Group ${Date.now()}`,
        target: { amount: '10000000', denom: 'usei' }, // 10 SEI target
        max_participants: 5,
        expiry_ts: Math.floor(Date.now() / 1000) + 86400, // 24 hours
        description: 'Test group for complete user scenarios'
      };

      console.log('  Creating group pool...');
      const result = await this.signingClient.execute(
        this.senderAddress,
        CONTRACTS.GROUPS,
        { create_group: groupData },
        'auto'
      );

      console.log(`  ✅ Transaction hash: ${result.transactionHash}`);

      // Extract group ID from events
      const groupEvent = result.events.find(e => e.type === 'wasm');
      const groupId = groupEvent?.attributes.find(a => a.key === 'group_id')?.value;

      if (groupId) {
        console.log(`  ✅ Group ID: ${groupId}`);
        
        // Verify group exists
        const group = await this.sdk.getGroup(parseInt(groupId));
        console.log(`  ✅ Group verified on-chain: ${group.name}`);
        
        return { success: true, groupId: parseInt(groupId), txHash: result.transactionHash };
      } else {
        throw new Error('Group ID not found in transaction events');
      }

    } catch (error) {
      console.error('  ❌ Create group failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testContributeToGroup(groupId) {
    try {
      console.log(`  Contributing to group ID: ${groupId}`);
      
      const contributionData = {
        group_id: groupId,
        amount: { amount: TEST_CONFIG.GROUP_CONTRIBUTION, denom: 'usei' }
      };

      const result = await this.signingClient.execute(
        this.senderAddress,
        CONTRACTS.GROUPS,
        { contribute: contributionData },
        'auto'
      );

      console.log(`  ✅ Contribution transaction hash: ${result.transactionHash}`);
      
      // Verify contribution recorded
      const group = await this.sdk.getGroup(groupId);
      console.log(`  ✅ Group current amount: ${group.current_amount} ${group.target.denom}`);
      console.log(`  ✅ Participants: ${group.participants.length}`);
      
      return { success: true, txHash: result.transactionHash };

    } catch (error) {
      console.error('  ❌ Group contribution failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testGroupProgress(groupId) {
    try {
      console.log(`  Checking progress for group ID: ${groupId}`);
      
      const group = await this.sdk.getGroup(groupId);
      const progress = (parseInt(group.current_amount) / parseInt(group.target.amount)) * 100;
      
      console.log(`  ✅ Group progress: ${progress.toFixed(2)}%`);
      console.log(`  ✅ Current: ${group.current_amount} ${group.target.denom}`);
      console.log(`  ✅ Target: ${group.target.amount} ${group.target.denom}`);
      console.log(`  ✅ Participants: ${group.participants.length}`);
      
      // Check if user is in participants list
      const userParticipant = group.participants.find(p => p.address === this.senderAddress);
      if (userParticipant) {
        console.log(`  ✅ User contribution: ${userParticipant.amount} ${group.target.denom}`);
      }
      
      return { success: true, progress, group };

    } catch (error) {
      console.error('  ❌ Group progress check failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async runVaultScenarios() {
    console.log('🏦 Testing Vault Workflows\n');

    try {
      // Get available vaults
      const vaults = await this.sdk.listVaults();
      if (vaults.length === 0) {
        console.log('⚠️  No vaults available for testing');
        return;
      }

      const testVault = vaults[0];
      console.log(`Using vault: ${testVault.label} (ID: ${testVault.id})`);

      // Scenario 1: Deposit to Vault
      console.log('💰 Scenario 1: Deposit to Vault');
      const depositResult = await this.testVaultDeposit(testVault.id);
      
      if (depositResult.success) {
        this.testResults.vaults.passed++;
        console.log('✅ Vault deposit: PASSED\n');

        // Scenario 2: Check Vault Position
        console.log('📊 Scenario 2: Check Vault Position');
        const positionResult = await this.testVaultPosition(testVault.id);
        
        if (positionResult.success) {
          this.testResults.vaults.passed++;
          console.log('✅ Vault position tracking: PASSED\n');

          // Scenario 3: Withdraw from Vault
          console.log('💸 Scenario 3: Withdraw from Vault');
          const withdrawResult = await this.testVaultWithdraw(testVault.id, positionResult.shares);
          
          if (withdrawResult.success) {
            this.testResults.vaults.passed++;
            console.log('✅ Vault withdrawal: PASSED\n');
          } else {
            this.testResults.vaults.failed++;
            console.log('❌ Vault withdrawal: FAILED\n');
          }

        } else {
          this.testResults.vaults.failed++;
          console.log('❌ Vault position tracking: FAILED\n');
        }

      } else {
        this.testResults.vaults.failed++;
        console.log('❌ Vault deposit: FAILED\n');
      }

    } catch (error) {
      console.error('❌ Vault scenarios failed:', error);
      this.testResults.vaults.failed++;
    }
  }

  async testVaultDeposit(vaultId) {
    try {
      console.log(`  Depositing to vault ID: ${vaultId}`);
      
      const depositData = {
        vault_id: vaultId,
        amount: { amount: TEST_CONFIG.VAULT_DEPOSIT, denom: 'usei' }
      };

      const result = await this.signingClient.execute(
        this.senderAddress,
        CONTRACTS.VAULTS,
        { deposit: depositData },
        'auto'
      );

      console.log(`  ✅ Deposit transaction hash: ${result.transactionHash}`);
      
      return { success: true, txHash: result.transactionHash };

    } catch (error) {
      console.error('  ❌ Vault deposit failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testVaultPosition(vaultId) {
    try {
      console.log(`  Checking vault position for vault ID: ${vaultId}`);
      
      const position = await this.sdk.getUserVaultPosition(this.senderAddress, vaultId);
      
      console.log(`  ✅ User shares: ${position.shares}`);
      console.log(`  ✅ Share value: ${position.value} SEI`);
      console.log(`  ✅ Percentage of vault: ${position.percentage.toFixed(4)}%`);
      
      return { success: true, shares: position.shares, value: position.value };

    } catch (error) {
      console.error('  ❌ Vault position check failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testVaultWithdraw(vaultId, shares) {
    try {
      console.log(`  Withdrawing ${shares} shares from vault ID: ${vaultId}`);
      
      const withdrawData = {
        vault_id: vaultId,
        shares: Math.floor(shares / 2).toString() // Withdraw half the shares
      };

      const result = await this.signingClient.execute(
        this.senderAddress,
        CONTRACTS.VAULTS,
        { withdraw: withdrawData },
        'auto'
      );

      console.log(`  ✅ Withdrawal transaction hash: ${result.transactionHash}`);
      
      return { success: true, txHash: result.transactionHash };

    } catch (error) {
      console.error('  ❌ Vault withdrawal failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async runPotScenarios() {
    console.log('🏺 Testing Savings Pot Workflows\n');

    try {
      // Scenario 1: Create Savings Pot
      console.log('🎯 Scenario 1: Create Savings Pot');
      const potResult = await this.testCreatePot();
      
      if (potResult.success) {
        this.testResults.pots.passed++;
        console.log('✅ Pot creation: PASSED\n');

        // Scenario 2: Deposit to Pot
        console.log('💰 Scenario 2: Deposit to Pot');
        const depositResult = await this.testPotDeposit(potResult.potId);
        
        if (depositResult.success) {
          this.testResults.pots.passed++;
          console.log('✅ Pot deposit: PASSED\n');

          // Scenario 3: Check Goal Progress
          console.log('📊 Scenario 3: Check Goal Progress');
          const progressResult = await this.testPotProgress(potResult.potId);
          
          if (progressResult.success) {
            this.testResults.pots.passed++;
            console.log('✅ Pot progress tracking: PASSED\n');
          } else {
            this.testResults.pots.failed++;
            console.log('❌ Pot progress tracking: FAILED\n');
          }

        } else {
          this.testResults.pots.failed++;
          console.log('❌ Pot deposit: FAILED\n');
        }

      } else {
        this.testResults.pots.failed++;
        console.log('❌ Pot creation: FAILED\n');
      }

    } catch (error) {
      console.error('❌ Pot scenarios failed:', error);
      this.testResults.pots.failed++;
    }
  }

  async testCreatePot() {
    try {
      const potData = {
        label: `Test Savings Pot ${Date.now()}`,
        target: { amount: '20000000', denom: 'usei' }, // 20 SEI goal
        deadline_ts: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
        description: 'Test savings pot for complete user scenarios'
      };

      console.log('  Creating savings pot...');
      const result = await this.signingClient.execute(
        this.senderAddress,
        CONTRACTS.POTS,
        { create_pot: potData },
        'auto'
      );

      console.log(`  ✅ Transaction hash: ${result.transactionHash}`);

      // Extract pot ID from events
      const potEvent = result.events.find(e => e.type === 'wasm');
      const potId = potEvent?.attributes.find(a => a.key === 'pot_id')?.value;

      if (potId) {
        console.log(`  ✅ Pot ID: ${potId}`);
        
        // Verify pot exists
        const pot = await this.sdk.getPot(parseInt(potId));
        console.log(`  ✅ Pot verified on-chain: ${pot.label}`);
        
        return { success: true, potId: parseInt(potId), txHash: result.transactionHash };
      } else {
        throw new Error('Pot ID not found in transaction events');
      }

    } catch (error) {
      console.error('  ❌ Create pot failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testPotDeposit(potId) {
    try {
      console.log(`  Depositing to pot ID: ${potId}`);
      
      const depositData = {
        pot_id: potId,
        amount: { amount: TEST_CONFIG.POT_DEPOSIT, denom: 'usei' }
      };

      const result = await this.signingClient.execute(
        this.senderAddress,
        CONTRACTS.POTS,
        { deposit: depositData },
        'auto'
      );

      console.log(`  ✅ Deposit transaction hash: ${result.transactionHash}`);
      
      return { success: true, txHash: result.transactionHash };

    } catch (error) {
      console.error('  ❌ Pot deposit failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testPotProgress(potId) {
    try {
      console.log(`  Checking progress for pot ID: ${potId}`);
      
      const pot = await this.sdk.getPot(potId);
      const progress = (parseInt(pot.current_amount) / parseInt(pot.target.amount)) * 100;
      
      console.log(`  ✅ Pot progress: ${progress.toFixed(2)}%`);
      console.log(`  ✅ Current: ${pot.current_amount} ${pot.target.denom}`);
      console.log(`  ✅ Target: ${pot.target.amount} ${pot.target.denom}`);
      console.log(`  ✅ Owner: ${pot.owner}`);
      
      return { success: true, progress, pot };

    } catch (error) {
      console.error('  ❌ Pot progress check failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async generateTestReport() {
    console.log('📊 Complete User Test Scenarios - Final Report\n');
    console.log('=' .repeat(60));
    
    const totalTests = Object.values(this.testResults).reduce((sum, category) => 
      sum + category.passed + category.failed, 0);
    const totalPassed = Object.values(this.testResults).reduce((sum, category) => 
      sum + category.passed, 0);
    const totalFailed = Object.values(this.testResults).reduce((sum, category) => 
      sum + category.failed, 0);

    console.log(`📈 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${totalPassed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   📊 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%\n`);

    console.log('📋 DETAILED RESULTS BY CATEGORY:\n');

    // Transfer Tests
    console.log('🔄 Transfer Workflows:');
    console.log(`   ✅ Passed: ${this.testResults.transfers.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.transfers.failed}`);
    console.log(`   📊 Success Rate: ${this.testResults.transfers.passed + this.testResults.transfers.failed > 0 ? 
      ((this.testResults.transfers.passed / (this.testResults.transfers.passed + this.testResults.transfers.failed)) * 100).toFixed(1) : 0}%\n`);

    // Group Tests
    console.log('👥 Group Pool Workflows:');
    console.log(`   ✅ Passed: ${this.testResults.groups.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.groups.failed}`);
    console.log(`   📊 Success Rate: ${this.testResults.groups.passed + this.testResults.groups.failed > 0 ? 
      ((this.testResults.groups.passed / (this.testResults.groups.passed + this.testResults.groups.failed)) * 100).toFixed(1) : 0}%\n`);

    // Vault Tests
    console.log('🏦 Vault Workflows:');
    console.log(`   ✅ Passed: ${this.testResults.vaults.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.vaults.failed}`);
    console.log(`   📊 Success Rate: ${this.testResults.vaults.passed + this.testResults.vaults.failed > 0 ? 
      ((this.testResults.vaults.passed / (this.testResults.vaults.passed + this.testResults.vaults.failed)) * 100).toFixed(1) : 0}%\n`);

    // Pot Tests
    console.log('🏺 Savings Pot Workflows:');
    console.log(`   ✅ Passed: ${this.testResults.pots.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.pots.failed}`);
    console.log(`   📊 Success Rate: ${this.testResults.pots.passed + this.testResults.pots.failed > 0 ? 
      ((this.testResults.pots.passed / (this.testResults.pots.passed + this.testResults.pots.failed)) * 100).toFixed(1) : 0}%\n`);

    console.log('=' .repeat(60));
    
    if (totalFailed === 0) {
      console.log('🎉 ALL TESTS PASSED! The real data integration is working perfectly.');
      console.log('✅ Users can successfully execute complete workflows with real funds.');
    } else {
      console.log(`⚠️  ${totalFailed} test(s) failed. Please review the errors above.`);
      console.log('🔧 Some workflows may need additional debugging or fixes.');
    }
    
    console.log('\n📝 Test completed at:', new Date().toISOString());
  }

  async runAllScenarios() {
    try {
      await this.initialize();
      
      console.log('🚀 Starting Complete User Test Scenarios\n');
      console.log('This will test real contract interactions with actual funds.');
      console.log('Please ensure test wallets have sufficient balance.\n');

      // Run all test scenarios
      await this.runTransferScenarios();
      await this.runGroupScenarios();
      await this.runVaultScenarios();
      await this.runPotScenarios();

      // Generate final report
      await this.generateTestReport();

    } catch (error) {
      console.error('❌ Complete user scenarios failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const testScenarios = new UserTestScenarios();
  
  try {
    await testScenarios.runAllScenarios();
    console.log('\n✅ Complete user test scenarios finished successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Complete user test scenarios failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { UserTestScenarios };