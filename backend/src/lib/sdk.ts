import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { config } from '../config';
import { logger } from './logger';

export interface SeiMoneySDK {
  payments: PaymentsClient;
  groups: GroupsClient;
  pots: PotsClient;
  vaults: VaultsClient;
  escrow: EscrowClient;
}

export interface PaymentsClient {
  createTransfer(params: CreateTransferParams): Promise<string>;
  claimTransfer(transferId: number, recipient: string): Promise<string>;
  refundTransfer(transferId: number, sender: string): Promise<string>;
  listTransfersBySender(sender: string): Promise<Transfer[]>;
  listTransfersByRecipient(recipient: string): Promise<Transfer[]>;
  getTransfer(id: number): Promise<Transfer>;
}

export interface GroupsClient {
  createGroup(params: CreateGroupParams): Promise<string>;
  addMember(groupId: string, member: string): Promise<string>;
  removeMember(groupId: string, member: string): Promise<string>;
  getGroup(groupId: string): Promise<Group>;
}

export interface PotsClient {
  openPot(params: OpenPotParams): Promise<string>;
  depositPot(potId: number, amount: string): Promise<string>;
  breakPot(potId: number): Promise<string>;
  closePot(potId: number): Promise<string>;
  getPot(id: number): Promise<Pot>;
  listPotsByOwner(owner: string): Promise<Pot[]>;
  listAllPots(): Promise<Pot[]>;
}

export interface VaultsClient {
  createVault(params: CreateVaultParams): Promise<string>;
  deposit(vaultId: string, amount: string): Promise<string>;
  withdraw(vaultId: string, amount: string): Promise<string>;
  harvest(vaultId: string): Promise<string>;
  rebalance(vaultId: string, strategy: string): Promise<string>;
  getVault(vaultId: string): Promise<Vault>;
}

export interface EscrowClient {
  createEscrow(params: CreateEscrowParams): Promise<string>;
  release(escrowId: string, recipient: string): Promise<string>;
  refund(escrowId: string, sender: string): Promise<string>;
  getEscrow(escrowId: string): Promise<Escrow>;
}

// Type definitions matching actual smart contract messages
export interface CreateTransferParams {
  recipient: string;
  amount: string;
  remark?: string;
  expiryTs?: number;
}

export interface Transfer {
  id: number;
  sender: string;
  recipient: string;
  amount: string;
  remark?: string;
  expiryTs?: number;
  status: string;
}

export interface OpenPotParams {
  goal: string; // Amount in usei
  label?: string;
}

export interface Pot {
  id: number;
  owner: string;
  goal: string;
  current: string;
  label?: string;
  createdAt: number;
  closed: boolean;
  broken: boolean;
}

export interface CreateGroupParams {
  name: string;
  description?: string;
  members: string[];
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt: number;
}

export interface CreateVaultParams {
  name: string;
  description?: string;
  strategy: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface Vault {
  id: string;
  name: string;
  description?: string;
  strategy: string;
  riskLevel: string;
  totalDeposits: string;
  totalValue: string;
  apr: string;
  status: 'active' | 'paused' | 'closed';
  createdAt: number;
}

export interface CreateEscrowParams {
  recipient: string;
  amount: string;
  expiry: number;
  conditions?: string;
}

export interface Escrow {
  id: string;
  sender: string;
  recipient: string;
  amount: string;
  expiry: number;
  conditions?: string;
  status: 'pending' | 'released' | 'refunded' | 'expired';
  createdAt: number;
}

let sdkInstance: SeiMoneySDK | null = null;

export async function getSdk(): Promise<SeiMoneySDK> {
  if (sdkInstance) {
    return sdkInstance;
  }

  const client = await CosmWasmClient.connect(config.rpcUrl);
  
  sdkInstance = {
    payments: new PaymentsClientImpl(client),
    groups: new GroupsClientImpl(client),
    pots: new PotsClientImpl(client),
    vaults: new VaultsClientImpl(client),
    escrow: new EscrowClientImpl(client),
  };

  return sdkInstance;
}

class PaymentsClientImpl implements PaymentsClient {
  constructor(private client: CosmWasmClient) {}

  async createTransfer(_params: CreateTransferParams): Promise<string> {
    // Implementation using CosmWasm client
    // This would need to be implemented with proper signing
    throw new Error('Not implemented - requires wallet integration');
  }

  async claimTransfer(_transferId: number, _recipient: string): Promise<string> {
    // This would need to be implemented with proper signing
    throw new Error('Not implemented - requires wallet integration');
  }

  async refundTransfer(_transferId: number, _sender: string): Promise<string> {
    // This would need to be implemented with proper signing
    throw new Error('Not implemented - requires wallet integration');
  }

  async getTransfer(id: number): Promise<Transfer> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.payments, {
        get_transfer: { id },
      });
      return result.transfer;
    } catch (error) {
      throw new Error(`Failed to get transfer ${id}: ${error}`);
    }
  }

  async listTransfersBySender(sender: string): Promise<Transfer[]> {
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

  async listTransfersByRecipient(recipient: string): Promise<Transfer[]> {
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
}

class PotsClientImpl implements PotsClient {
  constructor(private client: CosmWasmClient) {}

  async openPot(_params: OpenPotParams): Promise<string> {
    // This would need to be implemented with proper signing
    throw new Error('Not implemented - requires wallet integration');
  }

  async depositPot(_potId: number, _amount: string): Promise<string> {
    // This would need to be implemented with proper signing
    throw new Error('Not implemented - requires wallet integration');
  }

  async breakPot(_potId: number): Promise<string> {
    // This would need to be implemented with proper signing
    throw new Error('Not implemented - requires wallet integration');
  }

  async closePot(_potId: number): Promise<string> {
    // This would need to be implemented with proper signing
    throw new Error('Not implemented - requires wallet integration');
  }

  async getPot(id: number): Promise<Pot> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.pots, {
        get_pot: { id },
      });
      return result.pot;
    } catch (error) {
      throw new Error(`Failed to get pot ${id}: ${error}`);
    }
  }

  async listPotsByOwner(owner: string): Promise<Pot[]> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.pots, {
        list_pots_by_owner: { owner },
      });
      return result.pots || [];
    } catch (error) {
      logger.error('Error listing pots by owner:', error);
      return [];
    }
  }

  async listAllPots(): Promise<Pot[]> {
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
}

class GroupsClientImpl implements GroupsClient {
  constructor(private client: CosmWasmClient) {}

  async createGroup(_params: CreateGroupParams): Promise<string> {
    throw new Error('Not implemented - requires wallet integration');
  }

  async addMember(_groupId: string, _member: string): Promise<string> {
    throw new Error('Not implemented - requires wallet integration');
  }

  async removeMember(_groupId: string, _member: string): Promise<string> {
    throw new Error('Not implemented - requires wallet integration');
  }

  async getGroup(groupId: string): Promise<Group> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.groups, {
        get_group: { group_id: groupId },
      });
      return result.group;
    } catch (error) {
      throw new Error(`Failed to get group ${groupId}: ${error}`);
    }
  }
}

class VaultsClientImpl implements VaultsClient {
  constructor(private client: CosmWasmClient) {}

  async createVault(_params: CreateVaultParams): Promise<string> {
    throw new Error('Not implemented - requires wallet integration');
  }

  async deposit(_vaultId: string, _amount: string): Promise<string> {
    throw new Error('Not implemented - requires wallet integration');
  }

  async withdraw(_vaultId: string, _amount: string): Promise<string> {
    throw new Error('Not implemented - requires wallet integration');
  }

  async harvest(_vaultId: string): Promise<string> {
    throw new Error('Not implemented - requires wallet integration');
  }

  async rebalance(_vaultId: string, _strategy: string): Promise<string> {
    throw new Error('Not implemented - requires wallet integration');
  }

  async getVault(vaultId: string): Promise<Vault> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.vaults, {
        get_vault: { vault_id: vaultId },
      });
      return result.vault;
    } catch (error) {
      throw new Error(`Failed to get vault ${vaultId}: ${error}`);
    }
  }
}

class EscrowClientImpl implements EscrowClient {
  constructor(private client: CosmWasmClient) {}

  async createEscrow(_params: CreateEscrowParams): Promise<string> {
    throw new Error('Not implemented - requires wallet integration');
  }

  async release(_escrowId: string, _recipient: string): Promise<string> {
    throw new Error('Not implemented - requires wallet integration');
  }

  async refund(_escrowId: string, _sender: string): Promise<string> {
    throw new Error('Not implemented - requires wallet integration');
  }

  async getEscrow(escrowId: string): Promise<Escrow> {
    try {
      const result = await this.client.queryContractSmart(config.contracts.escrow, {
        get_escrow: { escrow_id: escrowId },
      });
      return result.escrow;
    } catch (error) {
      throw new Error(`Failed to get escrow ${escrowId}: ${error}`);
    }
  }
}
