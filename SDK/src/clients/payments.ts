/**
 * High-level Payments client
 */

import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { Coin, Address, Uint64, TxResult, ExecuteOptions } from '../types';
import { PaymentsQueryClient } from '../gen/payments';
import { 
  ExecuteMsg, 
  CreateTransferMsg, 
  ClaimTransferMsg, 
  RefundTransferMsg,
  UpdateConfigMsg,
  CollectFeesMsg
} from '../gen/payments';
import { retry, estimateGas } from '../utils';

export class PaymentsClient {
  private readonly exec: SigningCosmWasmClient;
  private readonly query: PaymentsQueryClient;
  private readonly contractAddress: string;
  private readonly defaultOptions: ExecuteOptions;

  constructor(
    exec: SigningCosmWasmClient,
    query: PaymentsQueryClient,
    contractAddress: string,
    defaultOptions: ExecuteOptions = {}
  ) {
    this.exec = exec;
    this.query = query;
    this.contractAddress = contractAddress;
    this.defaultOptions = {
      gasAdjustment: 1.3,
      memo: 'Sei Money Payments',
      ...defaultOptions,
    };
  }

  /**
   * Create a new transfer
   */
  async createTransfer(
    recipient: Address,
    amount: Coin,
    remark?: string,
    expiry?: number,
    options: ExecuteOptions = {}
  ): Promise<TxResult> {
    const msg: CreateTransferMsg = {
      recipient,
      amount,
      remark,
      expiry_ts: expiry?.toString(),
    };

    const executeMsg: ExecuteMsg = { create_transfer: msg };
    
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    return retry(async () => {
      const result = await this.exec.execute(
        this.contractAddress,
        executeMsg,
        'auto',
        mergedOptions.memo,
        undefined,
        mergedOptions.gasAdjustment
      );

      return {
        txHash: result.transactionHash,
        height: result.height,
        gasUsed: result.gasUsed || 0,
        success: result.code === 0,
        code: result.code,
        rawLog: result.rawLog,
      };
    });
  }

  /**
   * Claim a transfer
   */
  async claimTransfer(
    transferId: string | number,
    options: ExecuteOptions = {}
  ): Promise<TxResult> {
    const msg: ClaimTransferMsg = {
      transfer_id: transferId.toString(),
    };

    const executeMsg: ExecuteMsg = { claim_transfer: msg };
    
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    return retry(async () => {
      const result = await this.exec.execute(
        this.contractAddress,
        executeMsg,
        'auto',
        mergedOptions.memo,
        undefined,
        mergedOptions.gasAdjustment
      );

      return {
        txHash: result.transactionHash,
        height: result.height,
        gasUsed: result.gasUsed || 0,
        success: result.code === 0,
        code: result.code,
        rawLog: result.rawLog,
      };
    });
  }

  /**
   * Refund an expired transfer
   */
  async refundTransfer(
    transferId: string | number,
    options: ExecuteOptions = {}
  ): Promise<TxResult> {
    const msg: RefundTransferMsg = {
      transfer_id: transferId.toString(),
    };

    const executeMsg: ExecuteMsg = { refund_transfer: msg };
    
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    return retry(async () => {
      const result = await this.exec.execute(
        this.contractAddress,
        executeMsg,
        'auto',
        mergedOptions.memo,
        undefined,
        mergedOptions.gasAdjustment
      );

      return {
        txHash: result.transactionHash,
        height: result.height,
        gasUsed: result.gasUsed || 0,
        success: result.code === 0,
        code: result.code,
        rawLog: result.rawLog,
      };
    });
  }

  /**
   * Update contract configuration (admin only)
   */
  async updateConfig(
    updates: Partial<{
      admin: Address;
      fee_collector: Address;
      fee_rate: string;
      max_fee_rate: string;
      min_transfer_amount: string;
    }>,
    options: ExecuteOptions = {}
  ): Promise<TxResult> {
    const msg: UpdateConfigMsg = updates;
    const executeMsg: ExecuteMsg = { update_config: msg };
    
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    return retry(async () => {
      const result = await this.exec.execute(
        this.contractAddress,
        executeMsg,
        'auto',
        mergedOptions.memo,
        undefined,
        mergedOptions.gasAdjustment
      );

      return {
        txHash: result.transactionHash,
        height: result.height,
        gasUsed: result.gasUsed || 0,
        success: result.code === 0,
        code: result.code,
        rawLog: result.rawLog,
      };
    });
  }

  /**
   * Collect fees (admin only)
   */
  async collectFees(
    denom: string,
    options: ExecuteOptions = {}
  ): Promise<TxResult> {
    const msg: CollectFeesMsg = { denom };
    const executeMsg: ExecuteMsg = { collect_fees: msg };
    
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    return retry(async () => {
      const result = await this.exec.execute(
        this.contractAddress,
        executeMsg,
        'auto',
        mergedOptions.memo,
        undefined,
        mergedOptions.gasAdjustment
      );

      return {
        txHash: result.transactionHash,
        height: result.height,
        gasUsed: result.gasUsed || 0,
        success: result.code === 0,
        code: result.code,
        rawLog: result.rawLog,
      };
    });
  }

  /**
   * Get query client for read operations
   */
  getQueryClient(): PaymentsQueryClient {
    return this.query;
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * Get default options
   */
  getDefaultOptions(): ExecuteOptions {
    return { ...this.defaultOptions };
  }

  /**
   * Update default options
   */
  updateDefaultOptions(options: Partial<ExecuteOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
}
