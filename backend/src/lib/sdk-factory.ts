import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { SeiMoneySDKEnhanced, getEnhancedSdk, createSigningClient } from './sdk-enhanced';
import { SeiMoneySDK, getSdk } from './sdk-simple';
import { logger } from './logger';

/**
 * SDK Factory - provides both read-only and enhanced SDKs
 */
export class SDKFactory {
  private static readOnlySDK: SeiMoneySDK | null = null;
  private static enhancedSDK: SeiMoneySDKEnhanced | null = null;

  /**
   * Get read-only SDK for queries
   */
  static async getReadOnlySDK(): Promise<SeiMoneySDK> {
    if (!this.readOnlySDK) {
      this.readOnlySDK = await getSdk();
      logger.info('Read-only SDK initialized');
    }
    return this.readOnlySDK;
  }

  /**
   * Get enhanced SDK with write capabilities
   */
  static async getEnhancedSDK(signingClient?: SigningCosmWasmClient): Promise<SeiMoneySDKEnhanced> {
    if (!this.enhancedSDK) {
      this.enhancedSDK = await getEnhancedSdk(signingClient);
      logger.info('Enhanced SDK initialized');
    }
    return this.enhancedSDK;
  }

  /**
   * Create signing client from mnemonic (for testing/development)
   */
  static async createTestSigningClient(mnemonic?: string): Promise<SigningCosmWasmClient> {
    const testMnemonic = mnemonic || process.env['DEV_WALLET_MNEMONIC'] || 
      'test test test test test test test test test test test junk';
    
    return createSigningClient(testMnemonic);
  }

  /**
   * Get enhanced SDK with test signing client (for development)
   */
  static async getTestEnhancedSDK(): Promise<SeiMoneySDKEnhanced> {
    const signingClient = await this.createTestSigningClient();
    return this.getEnhancedSDK(signingClient);
  }

  /**
   * Reset all SDK instances (useful for testing)
   */
  static reset(): void {
    this.readOnlySDK = null;
    this.enhancedSDK = null;
    logger.info('SDK instances reset');
  }

  /**
   * Health check for all SDK instances
   */
  static async healthCheck(): Promise<{
    readOnlySDK: boolean;
    enhancedSDK: boolean;
    contractsHealth?: any;
  }> {
    const result = {
      readOnlySDK: false,
      enhancedSDK: false,
      contractsHealth: undefined,
    };

    try {
      const readOnlySDK = await this.getReadOnlySDK();
      const health = await readOnlySDK.healthCheck();
      result.readOnlySDK = health.healthy;
      result.contractsHealth = health.contracts;
    } catch (error) {
      logger.error('Read-only SDK health check failed:', error);
    }

    try {
      const enhancedSDK = await this.getEnhancedSDK();
      const health = await enhancedSDK.healthCheck();
      result.enhancedSDK = health.healthy;
    } catch (error) {
      logger.error('Enhanced SDK health check failed:', error);
    }

    return result;
  }
}

// Export convenience functions
export const getReadOnlySDK = () => SDKFactory.getReadOnlySDK();
export const getEnhancedSDKInstance = (signingClient?: SigningCosmWasmClient) => 
  SDKFactory.getEnhancedSDK(signingClient);
export const getTestEnhancedSDK = () => SDKFactory.getTestEnhancedSDK();