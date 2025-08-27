import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
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
  createTransfer(params: CreateTransferParams): Promise<TransferResult>;
  claimTransfer(transferId: number, recipient: string): Promise<TransferResult>;
  refundTransfer(transferId: number, sender: string): Promise<TransferResult>;
  listTransfersBySender(sender: string): Promise<Transfer[]>;
  listTransfersByRecipient(recipient: string): Promise<Transfer[]>;
  getTransfer(id: number): Promise<Transfer>;
}

export interface GroupsClient {
  createGroup(params: CreateGroupParams): Promise<GroupResult>;
  contribute(groupId: string, amount: string): Promise<GroupResult>;
  distribute(groupId: string, recipients: DistributionRecipient[]): Promise<GroupResult>;
  refund(groupId: string): Promise<GroupResult>;
  getGroup(groupId: string): Promise<Group>;
}

export interface PotsClient {
  openPot(params: OpenPotParams): Promise<PotResult>;
  depositPot(potId: number, amount: string): Promise<PotResult>;
  breakPot(potId: number): Promise<PotResult>;
  closePot(potId: number): Promise<PotResult>;
  getPot(id: number): Promise<Pot>;
  listPotsByOwner(owner: string): Promise<Pot[]>;
  listAllPots(): Promise<Pot[]>;
}

export interface VaultsClient {
  createVault(params: CreateVaultParams): Promise<VaultResult>;
  deposit(vaultId: string, amount: string): Promise<VaultResult>;
  withdraw(vaultId: string, shares: string): Promise<VaultResult>;
  harvest(vaultId: string): Promise<VaultResult>;
  rebalance(vaultId: string, strategy: string): Promise<VaultResult>;
  getVault(vaultId: string): Promise<Vault>;
}

export interface EscrowClient {
  createEscrow(params: CreateEscrowParams): Promise<EscrowResult>;
  approve(escrowId: string, approval: boolean): Promise<EscrowResult>;
  dispute(escrowId: string, reason: string): Promise<EscrowResult>;
  resolve(escrowId: string, decision: 'approve' | 'refund', reason?: string): Promise<EscrowResult>;
  release(escrowId: string, to: string, shareBps?: number): Promise<EscrowResult>;
  refund(escrowId: string): Promise<EscrowResult>;
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

export interface TransferResult {
  transferId: string;
  txHash: string;
  success: boolean;
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

export interface PotResult {
  potId: string;
  txHash: string;
  success: boolean;
}

export interface CreateGroupParams {
  name: string;
  description?: string;
  target: { amount: string; denom: string };
  expiryTs?: number;
  maxParts?: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt: number;
}

export interface GroupResult {
  groupId: string;
  txHash: string;
  success: boolean;
}

export interface DistributionRecipient {
  address: string;
  shareBps: number; // basis points (0-100%)
}

export interface CreateVaultParams {
  label: string;
  strategy: string;
  feeBps: number;
  minDeposit: string;
  maxDeposit?: string;
}

export interface Vault {
  id: string;
  label: string;
  strategy: string;
  feeBps: number;
  tvl: string;
  apr: number;
}

export interface VaultResult {
  vaultId: string;
  txHash: string;
  success: boolean;
}

export interface CreateEscrowParams {
  parties: string[];
  arbiter?: string;
  amount: { amount: string; denom: string };
  model: 'MultiSig' | 'TimeTiered' | 'Milestones';
  expiryTs?: number;
  metadata?: string;
}

export interface Escrow {
  id: string;
  parties: string[];
  arbiter?: string;
  amount: string;
  model: string;
  status: string;
}

export interface EscrowResult {
  escrowId: string;
  txHash: string;
  success: boolean;
}

// SDK Implementation
let sdkInstance: SeiMoneySDK | null = null;
let signingClient: SigningCosmWasmClient | null = null;

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

// Get signing client for write operations
async function getSigningClient(): Promise<SigningCosmWasmClient> {
  if (signingClient) {
    return signingClient;
  }

  // For development, use a mock wallet
  // In production, this would integrate with Keplr, Leap, or other wallets
  const mnemonic = process.env.DEV_WALLET_MNEMONIC || 'test test test test test test test test test test test junk';
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'sei' });
  
  signingClient = await SigningCosmWasmClient.connectWithSigner(config.rpcUrl, wallet);
  
  return signingClient;
}

class PaymentsClientImpl implements PaymentsClient {
  constructor(private client: CosmWasmClient) {}

  async createTransfer(params: CreateTransferParams): Promise<TransferResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        create_transfer: {
          recipient: params.recipient,
          amount: { amount: params.amount, denom: config.denom },
          remark: params.remark,
          expiry_ts: params.expiryTs,
        }
      };

      const result = await signingClient.execute(sender, config.contracts.payments, msg, 'auto');
      
      // Extract transfer ID from events
      const transferId = extractTransferId([...result.events]);
      
      return {
        transferId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error creating transfer:', error);
      return {
        transferId: '0',
        txHash: '',
        success: false
      };
    }
  }

  async claimTransfer(transferId: number, recipient: string): Promise<TransferResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        claim_transfer: { id: transferId }
      };

      const result = await signingClient.execute(sender, config.contracts.payments, msg, 'auto');
      
      return {
        transferId: transferId.toString(),
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error claiming transfer:', error);
      return {
        transferId: transferId.toString(),
        txHash: '',
        success: false
      };
    }
  }

  async refundTransfer(transferId: number, sender: string): Promise<TransferResult> {
    try {
      const signingClient = await getSigningClient();
      // Get wallet address from context
      const walletAddress = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        refund_transfer: { id: transferId }
      };

      const result = await signingClient.execute(walletAddress, config.contracts.payments, msg, 'auto');
      
      return {
        transferId: transferId.toString(),
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error refunding transfer:', error);
      return {
        transferId: transferId.toString(),
        txHash: '',
        success: false
      };
    }
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

class GroupsClientImpl implements GroupsClient {
  constructor(private client: CosmWasmClient) {}

  async createGroup(params: CreateGroupParams): Promise<GroupResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        create_group: {
          name: params.name,
          description: params.description,
          target: params.target,
          expiry_ts: params.expiryTs,
          max_parts: params.maxParts,
        }
      };

      const result = await signingClient.execute(sender, config.contracts.groups, msg, 'auto');
      
      const groupId = extractGroupId([...result.events]);
      
      return {
        groupId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error creating group:', error);
      return {
        groupId: '0',
        txHash: '',
        success: false
      };
    }
  }

  async contribute(groupId: string, amount: string): Promise<GroupResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        contribute: { group_id: groupId }
      };

      const result = await signingClient.execute(sender, config.contracts.groups, msg, 'auto', undefined, [
        { amount, denom: config.denom }
      ]);
      
      return {
        groupId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error contributing to group:', error);
      return {
        groupId,
        txHash: '',
        success: false
      };
    }
  }

  async distribute(groupId: string, recipients: DistributionRecipient[]): Promise<GroupResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        distribute: { 
          group_id: groupId,
          recipients: recipients.map(r => ({
            address: r.address,
            share_bps: r.shareBps
          }))
        }
      };

      const result = await signingClient.execute(sender, config.contracts.groups, msg, 'auto');
      
      return {
        groupId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error distributing group:', error);
      return {
        groupId,
        txHash: '',
        success: false
      };
    }
  }

  async refund(groupId: string): Promise<GroupResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        refund: { group_id: groupId }
      };

      const result = await signingClient.execute(sender, config.contracts.groups, msg, 'auto');
      
      return {
        groupId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error refunding group:', error);
      return {
        groupId,
        txHash: '',
        success: false
      };
    }
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

class PotsClientImpl implements PotsClient {
  constructor(private client: CosmWasmClient) {}

  async openPot(params: OpenPotParams): Promise<PotResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        open_pot: {
          goal: params.goal,
          label: params.label,
        }
      };

      const result = await signingClient.execute(sender, config.contracts.pots, msg, 'auto');
      
      const potId = extractPotId([...result.events]);
      
      return {
        potId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error opening pot:', error);
      return {
        potId: '0',
        txHash: '',
        success: false
      };
    }
  }

  async depositPot(potId: number, amount: string): Promise<PotResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        deposit_pot: { pot_id: potId }
      };

      const result = await signingClient.execute(sender, config.contracts.pots, msg, 'auto', undefined, [
        { amount, denom: config.denom }
      ]);
      
      return {
        potId: potId.toString(),
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error depositing to pot:', error);
      return {
        potId: potId.toString(),
        txHash: '',
        success: false
      };
    }
  }

  async breakPot(potId: number): Promise<PotResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        break_pot: { pot_id: potId }
      };

      const result = await signingClient.execute(sender, config.contracts.pots, msg, 'auto');
      
      return {
        potId: potId.toString(),
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error breaking pot:', error);
      return {
        potId: potId.toString(),
        txHash: '',
        success: false
      };
    }
  }

  async closePot(potId: number): Promise<PotResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        close_pot: { pot_id: potId }
      };

      const result = await signingClient.execute(sender, config.contracts.pots, msg, 'auto');
      
      return {
        potId: potId.toString(),
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error closing pot:', error);
      return {
        potId: potId.toString(),
        txHash: '',
        success: false
      };
    }
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
        list_by_owner: { owner },
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

class VaultsClientImpl implements VaultsClient {
  constructor(private client: CosmWasmClient) {}

  async createVault(params: CreateVaultParams): Promise<VaultResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        create_vault: {
          label: params.label,
          strategy: params.strategy,
          fee_bps: params.feeBps,
          min_deposit: params.minDeposit,
          max_deposit: params.maxDeposit,
        }
      };

      const result = await signingClient.execute(sender, config.contracts.vaults, msg, 'auto');
      
      const vaultId = extractVaultId([...result.events]);
      
      return {
        vaultId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error creating vault:', error);
      return {
        vaultId: '0',
        txHash: '',
        success: false
      };
    }
  }

  async deposit(vaultId: string, amount: string): Promise<VaultResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        deposit: { vault_id: vaultId }
      };

      const result = await signingClient.execute(sender, config.contracts.vaults, msg, 'auto', undefined, [
        { amount, denom: config.denom }
      ]);
      
      return {
        vaultId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error depositing to vault:', error);
      return {
        vaultId,
        txHash: '',
        success: false
      };
    }
  }

  async withdraw(vaultId: string, shares: string): Promise<VaultResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        withdraw: { 
          vault_id: vaultId,
          shares
        }
      };

      const result = await signingClient.execute(sender, config.contracts.vaults, msg, 'auto');
      
      return {
        vaultId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error withdrawing from vault:', error);
      return {
        vaultId,
        txHash: '',
        success: false
      };
    }
  }

  async harvest(vaultId: string): Promise<VaultResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        harvest: { vault_id: vaultId }
      };

      const result = await signingClient.execute(sender, config.contracts.vaults, msg, 'auto');
      
      return {
        vaultId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error harvesting vault:', error);
      return {
        vaultId,
        txHash: '',
        success: false
      };
    }
  }

  async rebalance(vaultId: string, strategy: string): Promise<VaultResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        rebalance: { 
          vault_id: vaultId,
          strategy
        }
      };

      const result = await signingClient.execute(sender, config.contracts.vaults, msg, 'auto');
      
      return {
        vaultId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error rebalancing vault:', error);
      return {
        vaultId,
        txHash: '',
        success: false
      };
    }
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

  async createEscrow(params: CreateEscrowParams): Promise<EscrowResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        create_escrow: {
          parties: params.parties,
          arbiter: params.arbiter,
          amount: params.amount,
          model: params.model,
          expiry_ts: params.expiryTs,
          metadata: params.metadata,
        }
      };

      const result = await signingClient.execute(sender, config.contracts.escrow, msg, 'auto');
      
      const escrowId = extractEscrowId([...result.events]);
      
      return {
        escrowId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error creating escrow:', error);
      return {
        escrowId: '0',
        txHash: '',
        success: false
      };
    }
  }

  async approve(escrowId: string, approval: boolean): Promise<EscrowResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        approve: { 
          escrow_id: escrowId,
          approval
        }
      };

      const result = await signingClient.execute(sender, config.contracts.escrow, msg, 'auto');
      
      return {
        escrowId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error approving escrow:', error);
      return {
        escrowId,
        txHash: '',
        success: false
      };
    }
  }

  async dispute(escrowId: string, reason: string): Promise<EscrowResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        dispute: { 
          escrow_id: escrowId,
          reason
        }
      };

      const result = await signingClient.execute(sender, config.contracts.escrow, msg, 'auto');
      
      return {
        escrowId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error disputing escrow:', error);
      return {
        escrowId,
        txHash: '',
        success: false
      };
    }
  }

  async resolve(escrowId: string, decision: 'approve' | 'refund', reason?: string): Promise<EscrowResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        resolve: { 
          escrow_id: escrowId,
          decision,
          reason
        }
      };

      const result = await signingClient.execute(sender, config.contracts.escrow, msg, 'auto');
      
      return {
        escrowId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error resolving escrow:', error);
      return {
        escrowId,
        txHash: '',
        success: false
      };
    }
  }

  async release(escrowId: string, to: string, shareBps?: number): Promise<EscrowResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        release: { 
          escrow_id: escrowId,
          to,
          share_bps: shareBps
        }
      };

      const result = await signingClient.execute(sender, config.contracts.escrow, msg, 'auto');
      
      return {
        escrowId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error releasing escrow:', error);
      return {
        escrowId,
        txHash: '',
        success: false
      };
    }
  }

  async refund(escrowId: string): Promise<EscrowResult> {
    try {
      const signingClient = await getSigningClient();
      // Get sender address from wallet context
      const sender = process.env.WALLET_ADDRESS || "sei1default";
      
      const msg = {
        refund: { escrow_id: escrowId }
      };

      const result = await signingClient.execute(sender, config.contracts.escrow, msg, 'auto');
      
      return {
        escrowId,
        txHash: result.transactionHash,
        success: true
      };
    } catch (error) {
      logger.error('Error refunding escrow:', error);
      return {
        escrowId,
        txHash: '',
        success: false
      };
    }
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

// Helper functions to extract IDs from transaction events
function extractTransferId(events: any[]): string {
  // Implementation depends on actual event structure
  // For now, return a placeholder
  return '1';
}

function extractGroupId(events: any[]): string {
  return '1';
}

function extractPotId(events: any[]): string {
  return '1';
}

function extractVaultId(events: any[]): string {
  return '1';
}

function extractEscrowId(events: any[]): string {
  return '1';
}
