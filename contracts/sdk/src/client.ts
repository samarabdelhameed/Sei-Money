import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';

// Types from our contract schema
export interface Config {
  admin: string;
  fee_percentage: number;
  min_transfer_amount: string;
  max_transfer_amount: string;
  supported_denoms: string[];
}

export interface Transfer {
  id: string;
  sender: string;
  recipient: string;
  amount: string;
  denom: string;
  expiry_time: number;
  memo?: string;
  claimed: boolean;
  refunded: boolean;
  created_at: number;
}

export interface CreateTransferMsg {
  recipient: string;
  expiry_time: number;
  memo?: string;
}

export interface ClaimTransferMsg {
  id: string;
}

export interface RefundTransferMsg {
  id: string;
}

export class SeiMoneyClient {
  private client: CosmWasmClient;
  private signingClient?: SigningCosmWasmClient;
  private contractAddress: string;

  constructor(
    client: CosmWasmClient,
    contractAddress: string,
    signingClient?: SigningCosmWasmClient
  ) {
    this.client = client;
    this.contractAddress = contractAddress;
    this.signingClient = signingClient;
  }

  // Static factory methods
  static async connect(rpcEndpoint: string, contractAddress: string): Promise<SeiMoneyClient> {
    const client = await CosmWasmClient.connect(rpcEndpoint);
    return new SeiMoneyClient(client, contractAddress);
  }

  static async connectWithSigner(
    rpcEndpoint: string,
    contractAddress: string,
    mnemonic: string,
    prefix = 'sei'
  ): Promise<SeiMoneyClient> {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix });
    const client = await CosmWasmClient.connect(rpcEndpoint);
    const signingClient = await SigningCosmWasmClient.connectWithSigner(
      rpcEndpoint,
      wallet,
      {
        gasPrice: GasPrice.fromString('0.02usei'),
      }
    );
    return new SeiMoneyClient(client, contractAddress, signingClient);
  }

  // Query methods
  async getConfig(): Promise<Config> {
    const result = await this.client.queryContractSmart(this.contractAddress, {
      get_config: {},
    });
    return result;
  }

  async getTransfer(id: string): Promise<Transfer | null> {
    try {
      const result = await this.client.queryContractSmart(this.contractAddress, {
        get_transfer: { id },
      });
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  async getTransfersBySender(
    sender: string,
    startAfter?: string,
    limit = 10
  ): Promise<Transfer[]> {
    const result = await this.client.queryContractSmart(this.contractAddress, {
      get_transfers_by_sender: {
        sender,
        start_after: startAfter || null,
        limit,
      },
    });
    return result.transfers || [];
  }

  async getTransfersByRecipient(
    recipient: string,
    startAfter?: string,
    limit = 10
  ): Promise<Transfer[]> {
    const result = await this.client.queryContractSmart(this.contractAddress, {
      get_transfers_by_recipient: {
        recipient,
        start_after: startAfter || null,
        limit,
      },
    });
    return result.transfers || [];
  }

  // Execute methods (require signing client)
  async createTransfer(
    senderAddress: string,
    msg: CreateTransferMsg,
    amount: string,
    denom: string,
    fee = 'auto'
  ) {
    if (!this.signingClient) {
      throw new Error('Signing client required for execute operations');
    }

    const funds = [{ denom, amount }];
    const executeMsg = { create_transfer: msg };

    return await this.signingClient.execute(
      senderAddress,
      this.contractAddress,
      executeMsg,
      fee,
      undefined,
      funds
    );
  }

  async claimTransfer(senderAddress: string, msg: ClaimTransferMsg, fee = 'auto') {
    if (!this.signingClient) {
      throw new Error('Signing client required for execute operations');
    }

    const executeMsg = { claim_transfer: msg };

    return await this.signingClient.execute(
      senderAddress,
      this.contractAddress,
      executeMsg,
      fee
    );
  }

  async refundTransfer(senderAddress: string, msg: RefundTransferMsg, fee = 'auto') {
    if (!this.signingClient) {
      throw new Error('Signing client required for execute operations');
    }

    const executeMsg = { refund_transfer: msg };

    return await this.signingClient.execute(
      senderAddress,
      this.contractAddress,
      executeMsg,
      fee
    );
  }

  // Utility methods
  async getBalance(address: string, denom: string): Promise<string> {
    const balance = await this.client.getBalance(address, denom);
    return balance.amount;
  }

  async getHeight(): Promise<number> {
    return await this.client.getHeight();
  }

  // Helper to create expiry time
  static createExpiryTime(hoursFromNow: number): number {
    return Math.floor(Date.now() / 1000) + hoursFromNow * 3600;
  }

  // Helper to check if transfer is expired
  static isTransferExpired(transfer: Transfer): boolean {
    return Date.now() / 1000 > transfer.expiry_time;
  }

  // Helper to format amounts
  static formatAmount(amount: string, decimals = 6): string {
    const num = parseInt(amount) / Math.pow(10, decimals);
    return num.toFixed(decimals);
  }

  static parseAmount(amount: string, decimals = 6): string {
    const num = parseFloat(amount) * Math.pow(10, decimals);
    return Math.floor(num).toString();
  }
}