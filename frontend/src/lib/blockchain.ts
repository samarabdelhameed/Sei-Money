// Blockchain Integration for Sei Network
import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { SigningStargateClient, StargateClient } from '@cosmjs/stargate';
import { coins } from '@cosmjs/amino';

// Sei Network Configuration
export const SEI_CONFIG = {
  testnet: {
    chainId: 'atlantic-2',
    rpcUrl: 'https://rpc-testnet.sei.io',
    restUrl: 'https://rest-testnet.sei.io',
    gasPrice: '0.025usei',
    gasAdjustment: 1.3,
  },
  mainnet: {
    chainId: 'pacific-1',
    rpcUrl: 'https://rpc.sei.io',
    restUrl: 'https://rest.sei.io',
    gasPrice: '0.025usei',
    gasAdjustment: 1.3,
  }
};

// Contract Addresses (These would be deployed contract addresses)
export const CONTRACT_ADDRESSES = {
  payments: 'sei1...', // Replace with actual deployed contract address
  groups: 'sei1...',   // Replace with actual deployed contract address
  pots: 'sei1...',     // Replace with actual deployed contract address
  vaults: 'sei1...',   // Replace with actual deployed contract address
  escrow: 'sei1...',   // Replace with actual deployed contract address
};

// Blockchain Client Class
export class SeiBlockchainClient {
  private client: SigningStargateClient | null = null;
  private wallet: DirectSecp256k1Wallet | DirectSecp256k1HdWallet | null = null;
  private address: string | null = null;
  private network: 'testnet' | 'mainnet' = 'testnet';

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.network = network;
  }

  // Connect wallet using private key or mnemonic
  async connectWallet(privateKeyOrMnemonic: string, isPrivateKey: boolean = false): Promise<string> {
    try {
      if (isPrivateKey) {
        this.wallet = await DirectSecp256k1Wallet.fromKey(
          Buffer.from(privateKeyOrMnemonic, 'hex'),
          SEI_CONFIG[this.network].chainId
        );
      } else {
        this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(
          privateKeyOrMnemonic,
          {
            prefix: 'sei',
            hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
          }
        );
      }

      const accounts = await this.wallet.getAccounts();
      this.address = accounts[0].address;

      // Create signing client
      this.client = await SigningStargateClient.connectWithSigner(
        SEI_CONFIG[this.network].rpcUrl,
        this.wallet
      );

      return this.address;
    } catch (error) {
      throw new Error(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get account balance
  async getBalance(address?: string): Promise<{ denom: string; amount: string }[]> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    const targetAddress = address || this.address;
    if (!targetAddress) {
      throw new Error('No address available');
    }

    return await this.client.getAllBalances(targetAddress);
  }

  // Send tokens
  async sendTokens(
    recipient: string,
    amount: string,
    denom: string = 'usei'
  ): Promise<string> {
    if (!this.client || !this.address) {
      throw new Error('Client not connected');
    }

    const fee = {
      amount: coins(5000, 'usei'),
      gas: '200000',
    };

    const result = await this.client.sendTokens(
      this.address,
      recipient,
      coins(parseInt(amount), denom),
      fee,
      'Transfer via SeiMoney'
    );

    return result.transactionHash;
  }

  // Execute smart contract
  async executeContract(
    contractAddress: string,
    msg: Record<string, any>,
    funds?: { denom: string; amount: string }[]
  ): Promise<string> {
    if (!this.client || !this.address) {
      throw new Error('Client not connected');
    }

    const fee = {
      amount: coins(10000, 'usei'),
      gas: '300000',
    };

    const result = await this.client.execute(
      this.address,
      contractAddress,
      msg,
      fee,
      'Execute contract via SeiMoney',
      funds ? coins(parseInt(funds[0].amount), funds[0].denom) : undefined
    );

    return result.transactionHash;
  }

  // Query smart contract
  async queryContract<T = any>(
    contractAddress: string,
    queryMsg: Record<string, any>
  ): Promise<T> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    const result = await this.client.queryContractSmart(contractAddress, queryMsg);
    return result as T;
  }

  // Get transaction details
  async getTransaction(txHash: string) {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    return await this.client.getTx(txHash);
  }

  // Get account info
  async getAccountInfo(address?: string) {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    const targetAddress = address || this.address;
    if (!targetAddress) {
      throw new Error('No address available');
    }

    return await this.client.getAccount(targetAddress);
  }

  // Disconnect wallet
  disconnect() {
    this.client = null;
    this.wallet = null;
    this.address = null;
  }

  // Get current address
  getCurrentAddress(): string | null {
    return this.address;
  }

  // Check if connected
  isConnected(): boolean {
    return this.client !== null && this.wallet !== null && this.address !== null;
  }
}

// Smart Contract Message Builders
export const contractMessages = {
  // Payments Contract
  payments: {
    createTransfer: (recipient: string, amount: string, expiry: number, remark?: string) => ({
      create_transfer: {
        recipient,
        amount,
        expiry: expiry.toString(),
        remark: remark || '',
      }
    }),

    claimTransfer: (transferId: string) => ({
      claim_transfer: {
        transfer_id: transferId,
      }
    }),

    cancelTransfer: (transferId: string) => ({
      cancel_transfer: {
        transfer_id: transferId,
      }
    }),

    refundTransfer: (transferId: string) => ({
      refund_transfer: {
        transfer_id: transferId,
      }
    }),

    getTransfer: (transferId: string) => ({
      get_transfer: {
        transfer_id: transferId,
      }
    }),

    listTransfers: (address: string, filter?: 'sent' | 'received' | 'all') => ({
      list_transfers: {
        address,
        filter: filter || 'all',
      }
    }),
  },

  // Groups Contract
  groups: {
    createGroup: (name: string, description: string, targetAmount: string, maxParticipants: number, expiry: number) => ({
      create_group: {
        name,
        description,
        target_amount: targetAmount,
        max_participants: maxParticipants,
        expiry: expiry.toString(),
      }
    }),

    joinGroup: (groupId: string, contribution: string) => ({
      join_group: {
        group_id: groupId,
        contribution,
      }
    }),

    leaveGroup: (groupId: string) => ({
      leave_group: {
        group_id: groupId,
      }
    }),

    getGroup: (groupId: string) => ({
      get_group: {
        group_id: groupId,
      }
    }),

    listGroups: (filter?: 'active' | 'completed' | 'all') => ({
      list_groups: {
        filter: filter || 'all',
      }
    }),
  },

  // Pots Contract
  pots: {
    createPot: (name: string, targetAmount: string, category: string, targetDate?: number, autoSaveEnabled: boolean, autoSaveAmount?: string) => ({
      create_pot: {
        name,
        target_amount: targetAmount,
        category,
        target_date: targetDate?.toString() || '',
        auto_save_enabled: autoSaveEnabled,
        auto_save_amount: autoSaveAmount || '0',
      }
    }),

    addFunds: (potId: string, amount: string) => ({
      add_funds: {
        pot_id: potId,
        amount,
      }
    }),

    withdrawFunds: (potId: string, amount: string) => ({
      withdraw_funds: {
        pot_id: potId,
        amount,
      }
    }),

    getPot: (potId: string) => ({
      get_pot: {
        pot_id: potId,
      }
    }),

    listPots: (owner: string) => ({
      list_pots: {
        owner,
      }
    }),
  },

  // Vaults Contract
  vaults: {
    createVault: (name: string, description: string, strategy: string, minDeposit: string, riskLevel: string) => ({
      create_vault: {
        name,
        description,
        strategy,
        min_deposit: minDeposit,
        risk_level: riskLevel,
      }
    }),

    deposit: (vaultId: string, amount: string) => ({
      deposit: {
        vault_id: vaultId,
        amount,
      }
    }),

    withdraw: (vaultId: string, amount: string) => ({
      withdraw: {
        vault_id: vaultId,
        amount,
      }
    }),

    getVault: (vaultId: string) => ({
      get_vault: {
        vault_id: vaultId,
      }
    }),

    listVaults: (filter?: 'active' | 'all') => ({
      list_vaults: {
        filter: filter || 'all',
      }
    }),
  },

  // Escrow Contract
  escrow: {
    createEscrow: (title: string, description: string, amount: string, seller: string, deadline: number, milestones?: boolean) => ({
      create_escrow: {
        title,
        description,
        amount,
        seller,
        deadline: deadline.toString(),
        milestones: milestones || false,
      }
    }),

    fundEscrow: (escrowId: string) => ({
      fund_escrow: {
        escrow_id: escrowId,
      }
    }),

    releasePayment: (escrowId: string) => ({
      release_payment: {
        escrow_id: escrowId,
      }
    }),

    raiseDispute: (escrowId: string, reason: string) => ({
      raise_dispute: {
        escrow_id: escrowId,
        reason,
      }
    }),

    getEscrow: (escrowId: string) => ({
      get_escrow: {
        escrow_id: escrowId,
      }
    }),

    listEscrows: (filter?: 'active' | 'funded' | 'completed' | 'disputed') => ({
      list_escrows: {
        filter: filter || 'all',
      }
    }),
  },
};

// Utility function to convert string to path
function stringToPath(str: string): number[] {
  return str.split('/').map(part => {
    if (part.endsWith("'")) {
      return parseInt(part.slice(0, -1)) + 0x80000000;
    }
    return parseInt(part);
  });
}

// Export singleton instance
export const seiClient = new SeiBlockchainClient();
