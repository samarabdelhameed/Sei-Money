import { CosmWasmClient, SigningCosmWasmClient, ExecuteResult } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { Coin } from '@cosmjs/amino';
import { config } from '../config';
import { logger } from './logger';

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
}

export class BlockchainErrorHandler {
  static handleContractError(error: any): BlockchainError {
    const enhancedError = new Error() as BlockchainError;
    
    if (error.message?.includes('insufficient funds')) {
      enhancedError.message = 'Insufficient balance to complete transaction';
      enhancedError.code = 'INSUFFICIENT_FUNDS';
    } else if (error.message?.includes('transfer not found')) {
      enhancedError.message = 'Transfer not found';
      enhancedError.code = 'TRANSFER_NOT_FOUND';
    } else if (error.message?.includes('expired')) {
      enhancedError.message = 'Transfer has expired';
      enhancedError.code = 'TRANSFER_EXPIRED';
    } else if (error.message?.includes('unauthorized')) {
      enhancedError.message = 'Unauthorized to perform this action';
      enhancedError.code = 'UNAUTHORIZED';
    } else if (error.message?.includes('timeout')) {
      enhancedError.message = 'Transaction timed out';
      enhancedError.code = 'TIMEOUT';
    } else {
      enhancedError.message = error.message || 'Unknown blockchain error';
      enhancedError.code = 'UNKNOWN_ERROR';
    }
    
    enhancedError.codespace = error.codespace;
    enhancedError.txHash = error.txHash;
    enhancedError.gasUsed = error.gasUsed;
    enhancedError.gasWanted = error.gasWanted;
    
    return enhancedError;
  }
}

// Connection pool for RPC clients
class ConnectionPool {
  private clients: CosmWasmClient[] = [];
  private currentIndex = 0;
  private readonly maxConnections = 3;
  private readonly rpcUrls = [
    NETWORK_CONFIG.RPC_URL,
    "https://rpc.atlantic-2.seinetwork.io",
    "https://sei-testnet-rpc.polkachu.com"
  ];

  async getClient(): Promise<CosmWasmClient> {
    if (this.clients.length === 0) {
      await this.initializePool();
    }
    
    const client = this.clients[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.clients.length;
    
    return client;
  }

  private async initializePool(): Promise<void> {
    const promises = this.rpcUrls.slice(0, this.maxConnections).map(async (url, index) => {
      try {
        const client = await CosmWasmClient.connect(url);
        logger.info(`Connected to RPC ${index + 1}: ${url}`);
        return client;
      } catch (error) {
        logger.warn(`Failed to connect to RPC ${url}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(promises);
    this.clients = results
      .filter((result): result is PromiseFulfilledResult<CosmWasmClient> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    if (this.clients.length === 0) {
      throw new Error('Failed to connect to any RPC endpoints');
    }

    logger.info(`Connection pool initialized with ${this.clients.length} clients`);
  }

  async healthCheck(): Promise<{ healthy: number; total: number }> {
    let healthy = 0;
    
    for (const client of this.clients) {
      try {
        await client.getHeight();
        healthy++;
      } catch (error) {
        logger.warn('Unhealthy RPC client detected:', error);
      }
    }
    
    return { healthy, total: this.clients.length };
  }
}

// Retry logic with exponential backoff
class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw BlockchainErrorHandler.handleContractError(lastError!);
  }
}

// Enhanced SDK with real contract integration
export class SeiMoneySDKEnhanced {
  private connectionPool: ConnectionPool;
  private signingClient?: SigningCosmWasmClient;

  constructor() {
    this.connectionPool = new ConnectionPool();
  }

  // Initialize with optional signing client for write operations
  async initialize(signingClient?: SigningCosmWasmClient): Promise<void> {
    this.signingClient = signingClient;
    
    // Test connection
    const client = await this.connectionPool.getClient();
    const height = await client.getHeight();
    logger.info(`SDK initialized successfully. Current block height: ${height}`);
  }

  // Real wallet balance queries
  async getWalletBalance(address: string): Promise<Coin[]> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const balance = await client.getBalance(address, 'usei');
      return [balance];
    });
  }

  async getWalletBalanceByDenom(address: string, denom: string): Promise<Coin | null> {
    const balances = await this.getWalletBalance(address);
    return balances.find(coin => coin.denom === denom) || null;
  }

  // Real contract state queries - Payments
  async getTransfer(id: number): Promise<any> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.PAYMENTS, {
        get_transfer: { id },
      });
      return result.transfer;
    });
  }

  async listTransfersBySender(sender: string): Promise<any[]> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.PAYMENTS, {
        list_by_sender: { sender },
      });
      return result.transfers || [];
    });
  }

  async listTransfersByRecipient(recipient: string): Promise<any[]> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.PAYMENTS, {
        list_by_recipient: { recipient },
      });
      return result.transfers || [];
    });
  }

  async getPaymentsConfig(): Promise<any> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      return client.queryContractSmart(CONTRACTS.PAYMENTS, {
        config: {},
      });
    });
  }

  // Real contract state queries - Groups
  async getGroup(groupId: string): Promise<any> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.GROUPS, {
        get_pool: { pool_id: groupId },
      });
      return result.pool;
    });
  }

  async listGroups(): Promise<any[]> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.GROUPS, {
        list_pools: {},
      });
      return result.pools || [];
    });
  }

  // Real contract state queries - Pots
  async getPot(id: number): Promise<any> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.POTS, {
        get_pot: { id },
      });
      return result.pot;
    });
  }

  async listPotsByOwner(owner: string): Promise<any[]> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.POTS, {
        list_by_owner: { owner },
      });
      return result.pots || [];
    });
  }

  async listAllPots(): Promise<any[]> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.POTS, {
        list_all_pots: {},
      });
      return result.pots || [];
    });
  }

  // Real contract state queries - Vaults
  async getVault(vaultId: string): Promise<any> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.VAULTS, {
        get_vault: { vault_id: vaultId },
      });
      return result.vault;
    });
  }

  async listVaults(): Promise<any[]> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.VAULTS, {
        list_vaults: {},
      });
      return result.vaults || [];
    });
  }

  // Real contract state queries - Escrow
  async getEscrow(escrowId: string): Promise<any> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.RISK_ESCROW, {
        get_case: { case_id: escrowId },
      });
      return result.case;
    });
  }

  async listEscrows(): Promise<any[]> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      const result = await client.queryContractSmart(CONTRACTS.RISK_ESCROW, {
        list_cases: {},
      });
      return result.cases || [];
    });
  }

  // Real contract state queries - Alias
  async resolveAlias(alias: string): Promise<string | null> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      try {
        const result = await client.queryContractSmart(CONTRACTS.ALIAS, {
          resolve: { alias },
        });
        return result.address;
      } catch (error) {
        if (error instanceof Error && error.message?.includes('not found')) {
          return null;
        }
        throw error;
      }
    });
  }

  async getAddressAlias(address: string): Promise<string | null> {
    return RetryHandler.withRetry(async () => {
      const client = await this.connectionPool.getClient();
      try {
        const result = await client.queryContractSmart(CONTRACTS.ALIAS, {
          get_alias: { address },
        });
        return result.alias;
      } catch (error) {
        if (error instanceof Error && error.message?.includes('not found')) {
          return null;
        }
        throw error;
      }
    });
  }

  // Write operations (require signing client)
  async createTransfer(sender: string, data: {
    recipient: string;
    amount: Coin;
    expiry_ts?: number;
    remark?: string;
  }): Promise<ExecuteResult> {
    if (!this.signingClient) {
      throw new Error('Signing client not initialized. Cannot perform write operations.');
    }

    return RetryHandler.withRetry(async () => {
      const msg = {
        create_transfer: {
          recipient: data.recipient,
          amount: data.amount,
          expiry_ts: data.expiry_ts,
          remark: data.remark,
        }
      };

      return this.signingClient!.execute(sender, CONTRACTS.PAYMENTS, msg, 'auto');
    });
  }

  async claimTransfer(recipient: string, transferId: number): Promise<ExecuteResult> {
    if (!this.signingClient) {
      throw new Error('Signing client not initialized. Cannot perform write operations.');
    }

    return RetryHandler.withRetry(async () => {
      const msg = {
        claim_transfer: { id: transferId }
      };

      return this.signingClient!.execute(recipient, CONTRACTS.PAYMENTS, msg, 'auto');
    });
  }

  async refundTransfer(sender: string, transferId: number): Promise<ExecuteResult> {
    if (!this.signingClient) {
      throw new Error('Signing client not initialized. Cannot perform write operations.');
    }

    return RetryHandler.withRetry(async () => {
      const msg = {
        refund_transfer: { id: transferId }
      };

      return this.signingClient!.execute(sender, CONTRACTS.PAYMENTS, msg, 'auto');
    });
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
        const client = await this.connectionPool.getClient();
        await client.queryContractSmart(test.address, test.query);
        contracts[test.name] = 'healthy';
      } catch (error) {
        contracts[test.name] = `error: ${error instanceof Error ? error.message : String(error)}`;
        healthy = false;
      }
    }

    const rpcHealth = await this.connectionPool.healthCheck();

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
      alias: alias.status === 'fulfilled' && alias.value !== null ? alias.value : undefined,
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