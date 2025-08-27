/**
 * High-level Payments client
 */

import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Coin, Address, Uint64, TxResult, ExecuteOptions } from '../types';
import { 
  PaymentsQueryClient,
  PaymentsExecuteMsg,
  PaymentsQueryMsg,
  Transfer
} from '../gen/payments';
import { retry, estimateGas } from '../utils';

export class PaymentsClient {
  private readonly exec: SigningCosmWasmClient;
  private readonly query: PaymentsQueryClient;
  private readonly contractAddress: Address;
  private readonly senderAddress: Address;
  private readonly defaultOptions: ExecuteOptions;

  constructor(
    exec: SigningCosmWasmClient,
    query: PaymentsQueryClient,
    contractAddress: Address,
    senderAddress: Address,
    defaultOptions: ExecuteOptions = {}
  ) {
    this.exec = exec;
    this.query = query;
    this.contractAddress = contractAddress;
    this.senderAddress = senderAddress;
    this.defaultOptions = defaultOptions;
  }

  /**
   * Create a new transfer
   */
  async createTransfer(
    recipient: Address,
    amount: Coin,
    options: ExecuteOptions & { expiry?: Uint64; remark?: string } = {}
  ): Promise<TxResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    const createTransferData: any = {
      recipient,
      amount: amount.amount,
      denom: amount.denom,
    };
    
    if (options.expiry !== undefined) createTransferData.expiry = options.expiry;
    if (options.remark !== undefined) createTransferData.remark = options.remark;
    
    const msg: PaymentsExecuteMsg = {
      create_transfer: createTransferData
    };

    return retry(async () => {
      const result = await this.exec.execute(
        this.senderAddress,
        this.contractAddress,
        msg,
        'auto',
        mergedOptions.memo || '',
        mergedOptions.funds
      );

      return {
        txHash: result.transactionHash,
        height: result.height,
        gasUsed: Number(result.gasUsed),
        success: true,
        code: 0,
        rawLog: (result as any).rawLog || '',
      };
    }, mergedOptions.retries || 3);
  }

  /**
   * Claim a transfer
   */
  async claimTransfer(
    transferId: string,
    options: ExecuteOptions = {}
  ): Promise<TxResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    const msg: PaymentsExecuteMsg = {
      claim_transfer: {
        transfer_id: transferId,
      }
    };

    return retry(async () => {
      const result = await this.exec.execute(
        this.senderAddress,
        this.contractAddress,
        msg,
        'auto',
        mergedOptions.memo || '',
        mergedOptions.funds
      );

      return {
        txHash: result.transactionHash,
        height: result.height,
        gasUsed: Number(result.gasUsed),
        success: true,
        code: 0,
        rawLog: (result as any).rawLog || '',
      };
    }, mergedOptions.retries || 3);
  }

  /**
   * Refund a transfer
   */
  async refundTransfer(
    transferId: string,
    options: ExecuteOptions = {}
  ): Promise<TxResult> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    const msg: PaymentsExecuteMsg = {
      refund_transfer: {
        transfer_id: transferId,
      }
    };

    return retry(async () => {
      const result = await this.exec.execute(
        this.senderAddress,
        this.contractAddress,
        msg,
        'auto',
        mergedOptions.memo || '',
        mergedOptions.funds
      );

      return {
        txHash: result.transactionHash,
        height: result.height,
        gasUsed: Number(result.gasUsed),
        success: true,
        code: 0,
        rawLog: (result as any).rawLog || '',
      };
    }, mergedOptions.retries || 3);
  }

  /**
   * Get transfer by ID
   */
  async getTransfer(transferId: string): Promise<Transfer | null> {
    try {
      return await this.query.getTransfer(transferId);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user transfers
   */
  async getUserTransfers(address: Address): Promise<Transfer[]> {
    try {
      return await this.query.getUserTransfers(address);
    } catch (error) {
      return [];
    }
  }

  /**
   * Update default options
   */
  updateDefaultOptions(options: Partial<ExecuteOptions>): void {
    Object.assign(this.defaultOptions, options);
  }
}