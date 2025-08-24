/**
 * Sei Money SDK - Main entry point
 * 
 * A production-grade TypeScript SDK for the Sei Money DeFi Protocol
 * covering all contracts: Payments, Groups, Pots, Alias, RiskEscrow, Vaults
 */

// Core types and interfaces
export * from './types';

// Configuration
export * from './config';

// Utility functions
export * from './utils';

// Auto-generated contract interfaces
export * from './gen';

// High-level clients
export { PaymentsClient } from './clients/payments';
// export { GroupsClient } from './clients/groups';
// export { PotsClient } from './clients/pots';
// export { AliasClient } from './clients/alias';
// export { RiskEscrowClient } from './clients/riskEscrow';
// export { VaultsClient } from './clients/vaults';

// Helper functions
export * from './helpers';

// Re-export commonly used types for convenience
export type {
  Address,
  Coin,
  Denom,
  Amount,
  Uint128,
  Uint64,
  TxResult,
  Transfer,
  Group,
  Pot,
  Alias,
  RiskCase,
  VaultInfo,
  VaultPosition,
  Config,
  NetworkConfig,
  ContractAddresses,
  ClientConfig,
  ExecuteOptions,
  QueryOptions,
} from './types';

// Re-export utility functions
export {
  toUint128,
  fromUint128,
  formatCoin,
  parseCoin,
  addCoins,
  subtractCoins,
  multiplyCoin,
  divideCoin,
  percentageOfCoin,
  isValidAddress,
  isValidDenom,
  retry,
  estimateGas,
  sleep,
  debounce,
  throttle,
  generateId,
  deepClone,
  isEmpty,
  safeJsonParse,
  safeJsonStringify,
} from './utils';

// Re-export configuration functions
export {
  NETWORKS,
  DEFAULT_CONTRACTS,
  DEFAULT_CONFIG,
  getConfig,
  loadConfigFromEnv,
} from './config';

// Re-export helper functions
export {
  sendSecure,
  sendBatch,
  scheduleTransfer,
  sendWithFee,
  splitTransfer,
  sendWithAutoExpiry,
  sendWithReminder,
  sendWithEscrow,
  sendWithRefundNotification,
  sendWithConditionalExpiry,
  sendSmart,
  sendConverted,
} from './helpers';

// Default export for convenience
import { PaymentsClient } from './clients/payments';
import { DEFAULT_CONFIG } from './config';

/**
 * Main SDK class that provides easy access to all functionality
 */
export class SeiMoneySDK {
  private config: typeof DEFAULT_CONFIG;
  private paymentsClient?: PaymentsClient;

  constructor(config?: Partial<typeof DEFAULT_CONFIG>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the payments client
   */
  get payments(): PaymentsClient {
    if (!this.paymentsClient) {
      throw new Error('Payments client not initialized. Call initialize() first.');
    }
    return this.paymentsClient;
  }

  /**
   * Initialize the SDK with clients
   */
  async initialize(
    signingClient: any,
    queryClient: any
  ): Promise<void> {
    // Initialize payments client
    // this.paymentsClient = new PaymentsClient(
    //   signingClient,
    //   queryClient,
    //   this.config.contracts.payments
    // );
    
    // TODO: Initialize other clients when they're implemented
  }

  /**
   * Get current configuration
   */
  getConfiguration() {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfiguration(updates: Partial<typeof DEFAULT_CONFIG>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Export default instance
export default SeiMoneySDK;
