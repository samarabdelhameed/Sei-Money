/**
 * SeiMoney SDK integration for Discord Bot
 * (Same as Telegram Bot SDK with Discord-specific adaptations)
 */

import { SigningCosmWasmClient, CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { Coin } from '@cosmjs/amino';
import { BotConfig, TransactionResult } from '../types';

export class SeiMoneyBotSDK {
  private config: BotConfig;
  private signingClient?: SigningCosmWasmClient;
  private queryClient?: CosmWasmClient;
  private wallet?: DirectSecp256k1HdWallet;

  constructor(config: BotConfig) {
    this.config = config;
  }

  /**
   * Initialize SDK with wallet
   */
  async initialize(mnemonic: string): Promise<void> {
    try {
      // Create wallet from mnemonic
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: 'sei'
      });

      // Get signing client
      const [account] = await this.wallet.getAccounts();
      this.signingClient = await SigningCosmWasmClient.connectWithSigner(
        this.config.rpcUrl,
        this.wallet
      );

      // Get query client
      this.queryClient = await CosmWasmClient.connect(this.config.rpcUrl);

      console.log(`✅ Discord SDK initialized for address: ${account.address}`);
    } catch (error) {
      console.error('❌ Failed to initialize Discord SDK:', error);
      throw error;
    }
  }

  /**
   * Get user's balance
   */
  async getBalance(address: string, denom: string = 'usei'): Promise<string> {
    if (!this.queryClient) {
      throw new Error('Query client not initialized');
    }

    try {
      const balance = await this.queryClient.getBalance(address, denom);
      return balance.amount;
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Create transfer using Payments contract
   */
  async createTransfer(
    recipient: string,
    amount: string,
    denom: string = 'usei',
    remark?: string,
    expiry?: number
  ): Promise<TransactionResult> {
    if (!this.signingClient || !this.wallet) {
      throw new Error('Signing client not initialized');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      
      const msg = {
        create_transfer: {
          recipient,
          amount: { amount, denom },
          remark,
          expiry_ts: expiry || Math.floor(Date.now() / 1000) + 3600 // 1 hour default
        }
      };

      const result = await this.signingClient.execute(
        account.address,
        this.config.contracts.payments,
        msg,
        'auto'
      );

      return {
        success: true,
        txHash: result.transactionHash,
        message: `✅ Transfer created successfully!\nTxHash: ${result.transactionHash}`
      };
    } catch (error) {
      console.error('❌ Failed to create transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Failed to create transfer'
      };
    }
  }

  /**
   * Claim transfer using Payments contract
   */
  async claimTransfer(transferId: number): Promise<TransactionResult> {
    if (!this.signingClient || !this.wallet) {
      throw new Error('Signing client not initialized');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      
      const msg = {
        claim_transfer: { id: transferId }
      };

      const result = await this.signingClient.execute(
        account.address,
        this.config.contracts.payments,
        msg,
        'auto'
      );

      return {
        success: true,
        txHash: result.transactionHash,
        message: `🎉 Transfer #${transferId} claimed successfully!\nTxHash: ${result.transactionHash}`
      };
    } catch (error) {
      console.error('❌ Failed to claim transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Failed to claim transfer'
      };
    }
  }

  /**
   * Refund transfer using Payments contract
   */
  async refundTransfer(transferId: number): Promise<TransactionResult> {
    if (!this.signingClient || !this.wallet) {
      throw new Error('Signing client not initialized');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      
      const msg = {
        refund_transfer: { id: transferId }
      };

      const result = await this.signingClient.execute(
        account.address,
        this.config.contracts.payments,
        msg,
        'auto'
      );

      return {
        success: true,
        txHash: result.transactionHash,
        message: `💸 Transfer #${transferId} refunded successfully!\nTxHash: ${result.transactionHash}`
      };
    } catch (error) {
      console.error('❌ Failed to refund transfer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Failed to refund transfer'
      };
    }
  }

  /**
   * Create pool using Groups contract
   */
  async createPool(
    target: string,
    denom: string = 'usei',
    memo?: string,
    expiry?: number
  ): Promise<TransactionResult> {
    if (!this.signingClient || !this.wallet) {
      throw new Error('Signing client not initialized');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      
      const msg = {
        create_pool: {
          target: { amount: target, denom },
          memo,
          expiry_ts: expiry || Math.floor(Date.now() / 1000) + 86400 // 24 hours default
        }
      };

      const result = await this.signingClient.execute(
        account.address,
        this.config.contracts.groups,
        msg,
        'auto'
      );

      return {
        success: true,
        txHash: result.transactionHash,
        message: `👥 Pool created successfully!\nTxHash: ${result.transactionHash}`
      };
    } catch (error) {
      console.error('❌ Failed to create pool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Failed to create pool'
      };
    }
  }

  /**
   * Contribute to pool using Groups contract
   */
  async contributeToPool(
    poolId: number,
    amount: string,
    denom: string = 'usei'
  ): Promise<TransactionResult> {
    if (!this.signingClient || !this.wallet) {
      throw new Error('Signing client not initialized');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      
      const msg = {
        contribute: {
          pool_id: poolId,
          amount: { amount, denom }
        }
      };

      const result = await this.signingClient.execute(
        account.address,
        this.config.contracts.groups,
        msg,
        'auto'
      );

      return {
        success: true,
        txHash: result.transactionHash,
        message: `💰 Contributed ${amount} ${denom} to pool #${poolId}!\nTxHash: ${result.transactionHash}`
      };
    } catch (error) {
      console.error('❌ Failed to contribute to pool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Failed to contribute to pool'
      };
    }
  }

  /**
   * Open pot using Pots contract
   */
  async openPot(
    goal: string,
    denom: string = 'usei',
    label?: string
  ): Promise<TransactionResult> {
    if (!this.signingClient || !this.wallet) {
      throw new Error('Signing client not initialized');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      
      const msg = {
        open_pot: {
          goal: { amount: goal, denom },
          label
        }
      };

      const result = await this.signingClient.execute(
        account.address,
        this.config.contracts.pots,
        msg,
        'auto'
      );

      return {
        success: true,
        txHash: result.transactionHash,
        message: `🏺 Pot opened successfully!\nTxHash: ${result.transactionHash}`
      };
    } catch (error) {
      console.error('❌ Failed to open pot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Failed to open pot'
      };
    }
  }

  /**
   * Create vault using Vaults contract
   */
  async createVault(
    label: string,
    denom: string = 'usei',
    strategy: string = 'staking',
    feeBps: number = 100 // 1% default
  ): Promise<TransactionResult> {
    if (!this.signingClient || !this.wallet) {
      throw new Error('Signing client not initialized');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      
      const msg = {
        create_vault: {
          label,
          denom,
          strategy: { name: strategy },
          fee_bps: feeBps
        }
      };

      const result = await this.signingClient.execute(
        account.address,
        this.config.contracts.vaults,
        msg,
        'auto'
      );

      return {
        success: true,
        txHash: result.transactionHash,
        message: `🏦 Vault "${label}" created successfully!\nTxHash: ${result.transactionHash}`
      };
    } catch (error) {
      console.error('❌ Failed to create vault:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Failed to create vault'
      };
    }
  }

  /**
   * Get transfer details
   */
  async getTransfer(transferId: number): Promise<any> {
    if (!this.queryClient) {
      throw new Error('Query client not initialized');
    }

    try {
      const result = await this.queryClient.queryContractSmart(
        this.config.contracts.payments,
        { get_transfer: { id: transferId } }
      );
      return result;
    } catch (error) {
      console.error('❌ Failed to get transfer:', error);
      throw error;
    }
  }

  /**
   * Get user's transfers
   */
  async getUserTransfers(address: string): Promise<any> {
    if (!this.queryClient) {
      throw new Error('Query client not initialized');
    }

    try {
      const result = await this.queryClient.queryContractSmart(
        this.config.contracts.payments,
        { list_by_sender: { sender: address } }
      );
      return result;
    } catch (error) {
      console.error('❌ Failed to get user transfers:', error);
      throw error;
    }
  }
}