/**
 * Auto-generated query client for Payments contract
 */

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { QueryMsg, ConfigResponse, TransferResponse, TransferListResponse, FeesResponse } from './messages';

export class PaymentsQueryClient {
  private readonly client: CosmWasmClient;
  private readonly contractAddress: string;

  constructor(client: CosmWasmClient, contractAddress: string) {
    this.client = client;
    this.contractAddress = contractAddress;
  }

  /**
   * Get contract configuration
   */
  async getConfig(): Promise<ConfigResponse> {
    const queryMsg: QueryMsg = { config: {} };
    return this.client.queryContractSmart(this.contractAddress, queryMsg);
  }

  /**
   * Get transfer by ID
   */
  async getTransfer(id: string | number): Promise<TransferResponse> {
    const queryMsg: QueryMsg = { get_transfer: { id: id.toString() } };
    return this.client.queryContractSmart(this.contractAddress, queryMsg);
  }

  /**
   * List transfers by sender
   */
  async listBySender(
    sender: string,
    startAfter?: string | number,
    limit?: number
  ): Promise<TransferListResponse> {
    const queryMsg: QueryMsg = {
      list_by_sender: {
        sender,
        start_after: startAfter?.toString(),
        limit,
      },
    };
    return this.client.queryContractSmart(this.contractAddress, queryMsg);
  }

  /**
   * List transfers by recipient
   */
  async listByRecipient(
    recipient: string,
    startAfter?: string | number,
    limit?: number
  ): Promise<TransferListResponse> {
    const queryMsg: QueryMsg = {
      list_by_recipient: {
        recipient,
        start_after: startAfter?.toString(),
        limit,
      },
    };
    return this.client.queryContractSmart(this.contractAddress, queryMsg);
  }

  /**
   * Get fees for a specific denomination
   */
  async getFees(denom: string): Promise<FeesResponse> {
    const queryMsg: QueryMsg = { get_fees: { denom } };
    return this.client.queryContractSmart(this.contractAddress, queryMsg);
  }

  /**
   * Get all pending transfers for a user (both as sender and recipient)
   */
  async getPendingTransfers(user: string): Promise<{
    asSender: TransferResponse[];
    asRecipient: TransferResponse[];
  }> {
    const [asSender, asRecipient] = await Promise.all([
      this.listBySender(user),
      this.listByRecipient(user),
    ]);

    return {
      asSender: asSender.transfers.filter(t => !t.claimed && !t.refunded),
      asRecipient: asRecipient.transfers.filter(t => !t.claimed && !t.refunded),
    };
  }

  /**
   * Get expired transfers that can be refunded
   */
  async getExpiredTransfers(sender: string): Promise<TransferResponse[]> {
    const result = await this.listBySender(sender);
    const now = Math.floor(Date.now() / 1000);
    
    return result.transfers.filter(t => 
      !t.claimed && 
      !t.refunded && 
      t.expiry_ts && 
      parseInt(t.expiry_ts) < now
    );
  }

  /**
   * Get transfer statistics for a user
   */
  async getUserStats(user: string): Promise<{
    totalSent: number;
    totalReceived: number;
    pendingSent: number;
    pendingReceived: number;
    totalAmount: { [denom: string]: string };
  }> {
    const [sent, received] = await Promise.all([
      this.listBySender(user),
      this.listByRecipient(user),
    ]);

    const totalSent = sent.transfers.length;
    const totalReceived = received.transfers.length;
    const pendingSent = sent.transfers.filter(t => !t.claimed && !t.refunded).length;
    const pendingReceived = received.transfers.filter(t => !t.claimed && !t.refunded).length;

    // Calculate total amounts by denomination
    const totalAmount: { [denom: string]: string } = {};
    
    sent.transfers.forEach(t => {
      if (t.claimed) {
        const denom = t.amount.denom;
        const current = totalAmount[denom] || '0';
        totalAmount[denom] = (parseInt(current) + parseInt(t.amount.amount)).toString();
      }
    });

    received.transfers.forEach(t => {
      if (t.claimed) {
        const denom = t.amount.denom;
        const current = totalAmount[denom] || '0';
        totalAmount[denom] = (parseInt(current) + parseInt(t.amount.amount)).toString();
      }
    });

    return {
      totalSent,
      totalReceived,
      pendingSent,
      pendingReceived,
      totalAmount,
    };
  }
}
