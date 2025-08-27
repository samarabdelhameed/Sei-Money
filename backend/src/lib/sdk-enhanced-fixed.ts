import { CosmWasmClient, SigningCosmWasmClient, ExecuteResult } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { Coin } from '@cosmjs/amino';
import { logger } from './logger';
import { BlockchainErrorHandler, UserFriendlyError } from './blockchain-error-handler';
import { networkFallbackService } from '../services/networkFallbackService';

// Real contract addresses from Sei testnet
export const CONTRACTS = {
  PAYMENTS: "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg",
  GROUPS: "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt",
  POTS: "sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj",
  ALIAS: "sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4",
  RISK_ESCROW: "sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj",
  VAULTS: "sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h",
} as const;

export const NETWORK_CONFIG = {
  CHAIN_ID: "atlantic-2",
  RPC_URL: "https://rpc.atlantic-2.seinetwork.io:443",
  EVM_RPC: "https://evm-rpc-testnet.sei-apis.com",
  EXPLORER: "https://seitrace.com",
  DENOM: "usei",
} as const;

// Enhanced error types for blockchain interactions
export interface BlockchainError extends Error {
  code?: string;
  codespace?: string;
  txHash?: string;
  gasUsed?: string;
  gasWanted?: string;
  userFriendly?: UserFriendlyError;
}

// Enhanced connection management using network fallback service
class EnhancedConnectionManager {
  async getClient(): Promise<CosmWasmClient> {
    try {
      return await networkFallbackService.createClient();
    } catch (error) {
      BlockchainErrorHandler.logError(error, 'getClient');
      throw this.enhanceError(error);
    }
  }

  async executeWithFallback<T>(
    operation: (client: CosmWasmClient) => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await networkFallbackService.executeWithFallback(operation, context);
    } catch (error) {
      BlockchainErrorHandler.logError(error, context);
      throw this.enhanceError(error);
    }
  }

  private enhanceError(error: any): BlockchainError {
    const userFriendlyError = BlockchainErrorHandler.categorizeError(error);
    const enhancedError = new Error(userFriendlyError.message) as BlockchainError;
    
    enhancedError.code = userFriendlyError.code;
    enhancedError.userFriendly = userFriendlyError;
    enhancedError.codespace = error?.codespace;
    enhancedError.txHash = error?.txHash;
    enhancedError.gasUsed = error?.gasUsed;
    enhancedError.gasWanted = error?.gasWanted;
    
    return enhancedError;
  }

  async healthCheck(): Promise<{ healthy: number; total: number }> {
    const status = networkFallbackService.getNetworkStatus();
    return {
      healthy: status.healthyCount,
      total: status.endpoints.length
    };
  }
}

// Enhanced retry handler using the blockchain error handler
class EnhancedRetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3
  ): Promise<T> {
    return BlockchainErrorHandler.withRetry(operation, {
      maxRetries,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    });
  }
}

// Enhanced SDK with real contract integration and comprehensive error handling
export class SeiMoneySDKEnhanced {
  private connectionManager: EnhancedConnectionManager;
  private signingClient?: SigningCosmWasmClient;

  constructor() {
    this.connectionManager = new EnhancedConnectionManager();
  }

  // Initialize with optional signing client for write operations
  async initialize(signingClient?: SigningCosmWasmClient): Promise<void> {
    try {
      this.signingClient = signingClient;
      
      // Test connection with error handling
      const client = await this.connectionManager.getClient();
      const height = await client.getHeight();
      logger.info(`SDK initialized successfully. Current block height: ${height}`);
    } catch (error) {
      BlockchainErrorHandler.logError(error, 'SDK initialization');
      throw error;
    }
  }

  // Real wallet balance queries with enhanced error handling
  async getWalletBalance(address: string): Promise<Coin[]> {
    return this.connectionManager.executeWithFallback(async (client) => {
      // Get balance for the main denom (usei)
      const balance = await client.getBalance(address, NETWORK_CONFIG.DENOM);
      return balance.amount === '0' ? [] : [balance];
    }, `getWalletBalance(${address})`);
  }

  async getWalletBalanceByDenom(address: string, denom: string): Promise<Coin | null> {
    try {
      const balances = await this.getWalletBalance(address);
      return balances.find(coin => coin.denom === denom) || null;
    } catch (error) {
      BlockchainErrorHandler.logError(error, 'getWalletBalanceByDenom', { address, denom });
      throw error;
    }
  }

  // Real contract state queries - Payments with enhanced error handling
  async getTransfer(id: number): Promise<any> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.PAYMENTS, {
        get_transfer: { id },
      });
      return result.transfer;
    }, `getTransfer(${id})`);
  }

  async listTransfersBySender(sender: string): Promise<any[]> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.PAYMENTS, {
        list_by_sender: { sender },
      });
      return result.transfers || [];
    }, `listTransfersBySender(${sender})`);
  }

  async listTransfersByRecipient(recipient: string): Promise<any[]> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.PAYMENTS, {
        list_by_recipient: { recipient },
      });
      return result.transfers || [];
    }, `listTransfersByRecipient(${recipient})`);
  }

  async getPaymentsConfig(): Promise<any> {
    return this.connectionManager.executeWithFallback(async (client) => {
      return client.queryContractSmart(CONTRACTS.PAYMENTS, {
        config: {},
      });
    }, 'getPaymentsConfig');
  }

  // Real contract state queries - Groups with enhanced error handling
  async getGroup(groupId: string): Promise<any> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.GROUPS, {
        get_pool: { pool_id: groupId },
      });
      return result.pool;
    }, `getGroup(${groupId})`);
  }

  async listGroups(): Promise<any[]> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.GROUPS, {
        list_pools: {},
      });
      return result.pools || [];
    }, 'listGroups');
  }

  // Real contract state queries - Pots with enhanced error handling
  async getPot(id: number): Promise<any> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.POTS, {
        get_pot: { id },
      });
      return result.pot;
    }, `getPot(${id})`);
  }

  async listPotsByOwner(owner: string): Promise<any[]> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.POTS, {
        list_pots_by_owner: { owner },
      });
      return result.pots || [];
    }, `listPotsByOwner(${owner})`);
  }

  async listAllPots(): Promise<any[]> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.POTS, {
        list_all_pots: {},
      });
      return result.pots || [];
    }, 'listAllPots');
  }

  // Real contract state queries - Vaults with enhanced error handling
  async getVault(vaultId: string): Promise<any> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.VAULTS, {
        get_vault: { id: vaultId },
      });
      return result.vault;
    }, `getVault(${vaultId})`);
  }

  async listVaults(): Promise<any[]> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.VAULTS, {
        list_vaults: {},
      });
      return result.vaults || [];
    }, 'listVaults');
  }

  async getUserVaultPosition(vaultId: string, address: string): Promise<any> {
    return this.connectionManager.executeWithFallback(async (client) => {
      try {
        const result = await client.queryContractSmart(CONTRACTS.VAULTS, {
          get_user_position: { vault_id: vaultId, address },
        });
        return result.position;
      } catch (error) {
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('not found')) {
          return null;
        }
        throw error;
      }
    }, `getUserVaultPosition(${vaultId}, ${address})`);
  }

  async getUserVaultPositions(address: string): Promise<any[]> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.VAULTS, {
        list_user_positions: { address },
      });
      return result.positions || [];
    }, `getUserVaultPositions(${address})`);
  }

  async getVaultPerformance(vaultId: string): Promise<any> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.VAULTS, {
        get_performance: { vault_id: vaultId },
      });
      return result.performance;
    }, `getVaultPerformance(${vaultId})`);
  }

  async getVaultConfig(): Promise<any> {
    return this.connectionManager.executeWithFallback(async (client) => {
      return client.queryContractSmart(CONTRACTS.VAULTS, {
        config: {},
      });
    }, 'getVaultConfig');
  }

  // Real contract state queries - Escrow with enhanced error handling
  async getEscrow(escrowId: string): Promise<any> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.RISK_ESCROW, {
        get_case: { case_id: escrowId },
      });
      return result.case;
    }, `getEscrow(${escrowId})`);
  }

  async listEscrows(): Promise<any[]> {
    return this.connectionManager.executeWithFallback(async (client) => {
      const result = await client.queryContractSmart(CONTRACTS.RISK_ESCROW, {
        list_cases: {},
      });
      return result.cases || [];
    }, 'listEscrows');
  }

  // Real contract state queries - Alias with enhanced error handling
  async resolveAlias(alias: string): Promise<string | null> {
    return this.connectionManager.executeWithFallback(async (client) => {
      try {
        const result = await client.queryContractSmart(CONTRACTS.ALIAS, {
          resolve: { alias },
        });
        return result.address;
      } catch (error) {
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('not found')) {
          return null;
        }
        throw error;
      }
    }, `resolveAlias(${alias})`);
  }

  async getAddressAlias(address: string): Promise<string | null> {
    return this.connectionManager.executeWithFallback(async (client) => {
      try {
        const result = await client.queryContractSmart(CONTRACTS.ALIAS, {
          get_alias: { address },
        });
        return result.alias;
      } catch (error) {
        if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('not found')) {
          return null;
        }
        throw error;
      }
    }, `getAddressAlias(${address})`);
  }

  // Write operations (require signing client) with enhanced error handling
  async createTransfer(sender: string, data: {
    recipient: string;
    amount: Coin;
    expiry_ts?: number;
    remark?: string;
  }): Promise<ExecuteResult> {
    if (!this.signingClient) {
      const error = new Error('Signing client not initialized. Cannot perform write operations.');
      BlockchainErrorHandler.logError(error, 'createTransfer - no signing client');
      throw error;
    }

    try {
      return await EnhancedRetryHandler.withRetry(async () => {
        const msg = {
          create_transfer: {
            recipient: data.recipient,
            amount: data.amount,
            expiry_ts: data.expiry_ts,
            remark: data.remark,
          }
        };

        return this.signingClient!.execute(sender, CONTRACTS.PAYMENTS, msg, 'auto');
      }, `createTransfer(${sender} -> ${data.recipient})`);
    } catch (error) {
      BlockchainErrorHandler.logError(error, 'createTransfer', { sender, recipient: data.recipient, amount: data.amount });
      throw error;
    }
  }

  async claimTransfer(recipient: string, transferId: number): Promise<ExecuteResult> {
    if (!this.signingClient) {
      const error = new Error('Signing client not initialized. Cannot perform write operations.');
      BlockchainErrorHandler.logError(error, 'claimTransfer - no signing client');
      throw error;
    }

    try {
      return await EnhancedRetryHandler.withRetry(async () => {
        const msg = {
          claim_transfer: { id: transferId }
        };

        return this.signingClient!.execute(recipient, CONTRACTS.PAYMENTS, msg, 'auto');
      }, `claimTransfer(${recipient}, ${transferId})`);
    } catch (error) {
      BlockchainErrorHandler.logError(error, 'claimTransfer', { recipient, transferId });
      throw error;
    }
  }

  async refundTransfer(sender: string, transferId: number): Promise<ExecuteResult> {
    if (!this.signingClient) {
      const error = new Error('Signing client not initialized. Cannot perform write operations.');
      BlockchainErrorHandler.logError(error, 'refundTransfer - no signing client');
      throw error;
    }

    try {
      return await EnhancedRetryHandler.withRetry(async () => {
        const msg = {
          refund_transfer: { id: transferId }
        };

        return this.signingClient!.execute(sender, CONTRACTS.PAYMENTS, msg, 'auto');
      }, `refundTransfer(${sender}, ${transferId})`);
    } catch (error) {
      BlockchainErrorHandler.logError(error, 'refundTransfer', { sender, transferId });
      throw error;
    }
  }

  // Vault write operations with enhanced error handling
  async createVault(creator: string, data: {
    label: string;
    strategy: string;
    fee_bps: number;
    min_deposit?: string;
    max_deposit?: string;
  }): Promise<ExecuteResult> {
    if (!this.signingClient) {
      const error = new Error('Signing client not initialized. Cannot perform write operations.');
      BlockchainErrorHandler.logError(error, 'createVault - no signing client');
      throw error;
    }

    try {
      return await EnhancedRetryHandler.withRetry(async () => {
        const msg = {
          create_vault: {
            label: data.label,
            strategy: data.strategy,
            fee_bps: data.fee_bps,
            min_deposit: data.min_deposit,
            max_deposit: data.max_deposit,
          }
        };

        return this.signingClient!.execute(creator, CONTRACTS.VAULTS, msg, 'auto');
      }, `createVault(${creator})`);
    } catch (error) {
      BlockchainErrorHandler.logError(error, 'createVault', { creator, data });
      throw error;
    }
  }

  async depositToVault(depositor: string, vaultId: string, amount: Coin): Promise<ExecuteResult> {
    if (!this.signingClient) {
      const error = new Error('Signing client not initialized. Cannot perform write operations.');
      BlockchainErrorHandler.logError(error, 'depositToVault - no signing client');
      throw error;
    }

    try {
      return await EnhancedRetryHandler.withRetry(async () => {
        const msg = {
          deposit: { vault_id: vaultId }
        };

        return this.signingClient!.execute(depositor, CONTRACTS.VAULTS, msg, 'auto', undefined, [amount]);
      }, `depositToVault(${depositor}, ${vaultId})`);
    } catch (error) {
      BlockchainErrorHandler.logError(error, 'depositToVault', { depositor, vaultId, amount });
      throw error;
    }
  }

  async withdrawFromVault(withdrawer: string, vaultId: string, shares: string): Promise<ExecuteResult> {
    if (!this.signingClient) {
      const error = new Error('Signing client not initialized. Cannot perform write operations.');
      BlockchainErrorHandler.logError(error, 'withdrawFromVault - no signing client');
      throw error;
    }

    try {
      return await EnhancedRetryHandler.withRetry(async () => {
        const msg = {
          withdraw: { vault_id: vaultId, shares }
        };

        return this.signingClient!.execute(withdrawer, CONTRACTS.VAULTS, msg, 'auto');
      }, `withdrawFromVault(${withdrawer}, ${vaultId})`);
    } catch (error) {
      BlockchainErrorHandler.logError(error, 'withdrawFromVault', { withdrawer, vaultId, shares });
      throw error;
    }
  }

  async harvestVault(harvester: string, vaultId: string): Promise<ExecuteResult> {
    if (!this.signingClient) {
      const error = new Error('Signing client not initialized. Cannot perform write operations.');
      BlockchainErrorHandler.logError(error, 'harvestVault - no signing client');
      throw error;
    }

    try {
      return await EnhancedRetryHandler.withRetry(async () => {
        const msg = {
          harvest: { vault_id: vaultId }
        };

        return this.signingClient!.execute(harvester, CONTRACTS.VAULTS, msg, 'auto');
      }, `harvestVault(${harvester}, ${vaultId})`);
    } catch (error) {
      BlockchainErrorHandler.logError(error, 'harvestVault', { harvester, vaultId });
      throw error;
    }
  }

  // Health check for all contracts
  async healthCheck(): Promise<{ 
    healthy: boolean; 
    contracts: Record<string, string>;
    rpcHealth: { healthy: number; total: number };
  }> {
    const contracts: Record<string, string> = {};
    let healthy = true;

    // Test each contract
    const contractTests = [
      { name: 'payments', address: CONTRACTS.PAYMENTS, query: { config: {} } },
      { name: 'groups', address: CONTRACTS.GROUPS, query: { config: {} } },
      { name: 'pots', address: CONTRACTS.POTS, query: { list_all_pots: {} } },
      { name: 'vaults', address: CONTRACTS.VAULTS, query: { list_vaults: {} } },
      { name: 'escrow', address: CONTRACTS.RISK_ESCROW, query: { config: {} } },
      { name: 'alias', address: CONTRACTS.ALIAS, query: { config: {} } },
    ];

    for (const test of contractTests) {
      try {
        await this.connectionManager.executeWithFallback(async (client) => {
          return client.queryContractSmart(test.address, test.query);
        }, `healthCheck-${test.name}`);
        contracts[test.name] = 'healthy';
      } catch (error) {
        const userFriendlyError = BlockchainErrorHandler.categorizeError(error);
        contracts[test.name] = `error: ${userFriendlyError.message}`;
        healthy = false;
      }
    }

    const rpcHealth = await this.connectionManager.healthCheck();

    return { healthy, contracts, rpcHealth };
  }

  // Get comprehensive user data
  async getUserData(address: string): Promise<{
    balance: Coin[];
    transfers: { sent: any[]; received: any[] };
    pots: any[];
    alias?: string;
  }> {
    const [balance, sentTransfers, receivedTransfers, pots, alias] = await Promise.allSettled([
      this.getWalletBalance(address),
      this.listTransfersBySender(address),
      this.listTransfersByRecipient(address),
      this.listPotsByOwner(address),
      this.getAddressAlias(address),
    ]);

    return {
      balance: balance.status === 'fulfilled' ? balance.value : [],
      transfers: {
        sent: sentTransfers.status === 'fulfilled' ? sentTransfers.value : [],
        received: receivedTransfers.status === 'fulfilled' ? receivedTransfers.value : [],
      },
      pots: pots.status === 'fulfilled' ? pots.value : [],
      alias: alias.status === 'fulfilled' && alias.value ? alias.value : undefined,
    };
  }
}

// Singleton instance
let sdkInstance: SeiMoneySDKEnhanced | null = null;

export async function getEnhancedSdk(signingClient?: SigningCosmWasmClient): Promise<SeiMoneySDKEnhanced> {
  if (!sdkInstance) {
    sdkInstance = new SeiMoneySDKEnhanced();
    await sdkInstance.initialize(signingClient);
  }
  
  return sdkInstance;
}

// Helper function to create signing client from mnemonic (for testing)
export async function createSigningClient(mnemonic: string): Promise<SigningCosmWasmClient> {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'sei' });
  return SigningCosmWasmClient.connectWithSigner(NETWORK_CONFIG.RPC_URL, wallet);
}