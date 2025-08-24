import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { config } from '../config';
import { logger } from './logger';

// Simple SDK for read operations only
export class SeiMoneySDK {
  private client: CosmWasmClient;

  constructor(client: CosmWasmClient) {
    this.client = client;
  }

  // Payments - Read Operations
  async getTransfer(id: number): Promise<any> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.payments, {
        get_transfer: { id },
      });
      return result.transfer;
    } catch (error) {
      logger.error(`Failed to get transfer ${id}:`, error);
      throw error;
    }
  }

  async listTransfersBySender(sender: string): Promise<any[]> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.payments, {
        list_by_sender: { sender },
      });
      return result.transfers || [];
    } catch (error) {
      logger.error('Error listing transfers by sender:', error);
      return [];
    }
  }

  async listTransfersByRecipient(recipient: string): Promise<any[]> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.payments, {
        list_by_recipient: { recipient },
      });
      return result.transfers || [];
    } catch (error) {
      logger.error('Error listing transfers by recipient:', error);
      return [];
    }
  }

  async getPaymentsConfig(): Promise<any> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.payments, {
        config: {},
      });
      return result;
    } catch (error) {
      logger.error('Error getting payments config:', error);
      throw error;
    }
  }

  // Groups - Read Operations
  async getGroup(groupId: string): Promise<any> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.groups, {
        get_pool: { pool_id: groupId },
      });
      return result.pool;
    } catch (error) {
      logger.error(`Failed to get group ${groupId}:`, error);
      throw error;
    }
  }

  async listGroups(): Promise<any[]> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.groups, {
        list_pools: {},
      });
      return result.pools || [];
    } catch (error) {
      logger.error('Error listing groups:', error);
      return [];
    }
  }

  async getGroupsConfig(): Promise<any> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.groups, {
        config: {},
      });
      return result;
    } catch (error) {
      logger.error('Error getting groups config:', error);
      throw error;
    }
  }

  // Pots - Read Operations
  async getPot(id: number): Promise<any> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.pots, {
        get_pot: { id },
      });
      return result.pot;
    } catch (error) {
      logger.error(`Failed to get pot ${id}:`, error);
      throw error;
    }
  }

  async listPotsByOwner(owner: string): Promise<any[]> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.pots, {
        list_by_owner: { owner },
      });
      return result.pots || [];
    } catch (error) {
      logger.error('Error listing pots by owner:', error);
      return [];
    }
  }

  async listAllPots(): Promise<any[]> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.pots, {
        list_all_pots: {},
      });
      return result.pots || [];
    } catch (error) {
      logger.error('Error listing all pots:', error);
      return [];
    }
  }

  // Vaults - Read Operations
  async getVault(vaultId: string): Promise<any> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.vaults, {
        get_vault: { vault_id: vaultId },
      });
      return result.vault;
    } catch (error) {
      logger.error(`Failed to get vault ${vaultId}:`, error);
      throw error;
    }
  }

  async listVaults(): Promise<any[]> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.vaults, {
        list_vaults: {},
      });
      return result.vaults || [];
    } catch (error) {
      logger.error('Error listing vaults:', error);
      return [];
    }
  }

  // Escrow - Read Operations
  async getEscrow(escrowId: string): Promise<any> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.escrow, {
        get_case: { case_id: escrowId },
      });
      return result.case;
    } catch (error) {
      logger.error(`Failed to get escrow ${escrowId}:`, error);
      throw error;
    }
  }

  async listEscrows(): Promise<any[]> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.escrow, {
        list_cases: {},
      });
      return result.cases || [];
    } catch (error) {
      logger.error('Error listing escrows:', error);
      return [];
    }
  }

  async getEscrowConfig(): Promise<any> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.escrow, {
        config: {},
      });
      return result;
    } catch (error) {
      logger.error('Error getting escrow config:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; contracts: Record<string, string> }> {
    const contracts: Record<string, string> = {};
    let healthy = true;

    try {
      // Test payments contract
      await this.client.queryContractSmart(config.contracts.payments, { config: {} });
      contracts.payments = 'healthy';
    } catch (error) {
      contracts.payments = 'error';
      healthy = false;
    }

    try {
      // Test groups contract
      await this.client.queryContractSmart(config.contracts.groups, { config: {} });
      contracts.groups = 'healthy';
    } catch (error) {
      contracts.groups = 'error';
      healthy = false;
    }

    try {
      // Test pots contract
      await this.client.queryContractSmart(config.contracts.pots, { list_all_pots: {} });
      contracts.pots = 'healthy';
    } catch (error) {
      contracts.pots = 'error';
      healthy = false;
    }

    try {
      // Test vaults contract
      await this.client.queryContractSmart(config.contracts.vaults, { list_vaults: {} });
      contracts.vaults = 'healthy';
    } catch (error) {
      contracts.vaults = 'error';
      healthy = false;
    }

    try {
      // Test escrow contract
      await this.client.queryContractSmart(config.contracts.escrow, { config: {} });
      contracts.escrow = 'healthy';
    } catch (error) {
      contracts.escrow = 'error';
      healthy = false;
    }

    return { healthy, contracts };
  }
}

// Singleton instance
let sdkInstance: SeiMoneySDK | null = null;

export async function getSdk(): Promise<SeiMoneySDK> {
  if (sdkInstance) {
    return sdkInstance;
  }

  try {
    const client = await CosmWasmClient.connect(config.rpcUrl);
    sdkInstance = new SeiMoneySDK(client);
    logger.info('SDK initialized successfully');
    return sdkInstance;
  } catch (error) {
    logger.error('Failed to initialize SDK:', error);
    throw error;
  }
}
