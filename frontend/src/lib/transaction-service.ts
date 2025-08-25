import { metamaskWallet } from './wallets/metamask';
import { keplrWallet } from './wallets/keplr';
import { leapWallet } from './wallets/leap';

// Contract addresses on Sei testnet
export const CONTRACT_ADDRESSES = {
  PAYMENTS: "sei1kfpm92hs5gsmp84098wc3jpy2a440l50cq2ycsxlkpnlaygl9azqdhsygg",
  GROUPS: "sei1vq3ncyvf4k22lc0xhm7x6dtkn6jyxkexa2xy6uk2sj33dysnyy2syn73qt",
  POTS: "sei1c5d4flfqv3zjms0g894z82hnhv62h2vjr9hgd05c6xh456q8xjfq8f3qmj",
  VAULTS: "sei12k2yxf3cyec8p89qtgm5w30m4g2775tn7j8wx4jpuallygu45r9qs68u2h",
  ESCROW: "sei1q3gqr9ywvma6j6kja67n4h7fxz790x5lhj4v5phv2za0v7wsp5qqkrz0pj",
  ALIAS: "sei1thjuavd70uq7txe79uj8pfy2vfyl3zvmenkyxh6ew4vag9mckq4qrtjav4",
};

export interface TransactionResult {
  transactionHash: string;
  height?: number;
  gasUsed?: number;
  explorerUrl: string;
}

export interface TransactionOptions {
  memo?: string;
  funds?: { denom: string; amount: string }[];
  gasEstimate?: 'auto' | number;
}

export type WalletProvider = 'metamask' | 'keplr' | 'leap';

export class TransactionService {
  private currentProvider: WalletProvider | null = null;

  // Set the current wallet provider
  setProvider(provider: WalletProvider): void {
    this.currentProvider = provider;
  }

  // Get the current provider
  getCurrentProvider(): WalletProvider | null {
    return this.currentProvider;
  }

  // Check if a wallet is connected
  isWalletConnected(): boolean {
    if (!this.currentProvider) return false;

    switch (this.currentProvider) {
      case 'metamask':
        return metamaskWallet.isConnected();
      case 'keplr':
        return keplrWallet.isConnected();
      case 'leap':
        return leapWallet.isConnected();
      default:
        return false;
    }
  }

  // Get current wallet address
  getCurrentAddress(): string | null {
    if (!this.currentProvider || !this.isWalletConnected()) return null;

    switch (this.currentProvider) {
      case 'metamask':
        const metamaskConnection = metamaskWallet.getConnection();
        return metamaskConnection?.cosmosAddress || null;
      case 'keplr':
        const keplrConnection = keplrWallet.getConnection();
        return keplrConnection?.address || null;
      case 'leap':
        const leapConnection = leapWallet.getConnection();
        return leapConnection?.address || null;
      default:
        return null;
    }
  }

  // Estimate gas for a transaction
  async estimateGas(
    contractAddress: string,
    msg: any,
    funds: { denom: string; amount: string }[] = []
  ): Promise<number> {
    if (!this.currentProvider || !this.isWalletConnected()) {
      throw new Error('No wallet connected');
    }

    try {
      // For now, return a default gas estimate
      // In production, you'd query the chain for accurate gas estimation
      const baseGas = 200000;
      const complexityMultiplier = JSON.stringify(msg).length / 100;
      const fundsMultiplier = funds.length > 0 ? 1.2 : 1;
      
      return Math.ceil(baseGas * complexityMultiplier * fundsMultiplier);
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return 300000; // Fallback gas amount
    }
  }

  // Calculate transaction fee
  async calculateFee(gasAmount: number): Promise<{ denom: string; amount: string }> {
    const gasPrice = 0.025; // 0.025 usei per gas unit
    const feeAmount = Math.ceil(gasAmount * gasPrice);
    
    return {
      denom: 'usei',
      amount: feeAmount.toString()
    };
  }

  // Sign and broadcast a transaction
  async signAndBroadcast(
    contractAddress: string,
    msg: any,
    options: TransactionOptions = {}
  ): Promise<TransactionResult> {
    if (!this.currentProvider || !this.isWalletConnected()) {
      throw new Error('No wallet connected');
    }

    const { memo = '', funds = [] } = options;

    try {
      let result: { transactionHash: string; height?: number; gasUsed?: number };

      switch (this.currentProvider) {
        case 'metamask':
          result = await metamaskWallet.signAndBroadcast(contractAddress, msg, funds, memo);
          break;
        case 'keplr':
          result = await keplrWallet.signAndBroadcast(contractAddress, msg, funds, memo);
          break;
        case 'leap':
          result = await leapWallet.signAndBroadcast(contractAddress, msg, funds, memo);
          break;
        default:
          throw new Error('Unsupported wallet provider');
      }

      return {
        ...result,
        explorerUrl: `https://seitrace.com/tx/${result.transactionHash}`
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      throw this.handleTransactionError(error);
    }
  }

  // Send tokens
  async sendTokens(
    recipient: string,
    amount: string,
    denom: string = 'usei',
    memo: string = ''
  ): Promise<TransactionResult> {
    if (!this.currentProvider || !this.isWalletConnected()) {
      throw new Error('No wallet connected');
    }

    try {
      const tokenAmount = [{ denom, amount }];
      let result: { transactionHash: string; height?: number };

      switch (this.currentProvider) {
        case 'metamask':
          // For MetaMask, use EVM transaction if sending to EVM address
          if (recipient.startsWith('0x')) {
            const amountInSei = parseFloat(amount) / 1000000; // Convert usei to SEI
            const txHash = await metamaskWallet.sendEvmTransaction(recipient, amountInSei.toString());
            result = { transactionHash: txHash };
          } else {
            // Use Cosmos transaction for sei addresses
            result = await metamaskWallet.sendTokens(recipient, tokenAmount, memo);
          }
          break;
        case 'keplr':
          result = await keplrWallet.sendTokens(recipient, tokenAmount, memo);
          break;
        case 'leap':
          result = await leapWallet.sendTokens(recipient, tokenAmount, memo);
          break;
        default:
          throw new Error('Unsupported wallet provider');
      }

      return {
        ...result,
        explorerUrl: `https://seitrace.com/tx/${result.transactionHash}`
      };
    } catch (error) {
      console.error('Send tokens failed:', error);
      throw this.handleTransactionError(error);
    }
  }

  // Contract-specific transaction methods

  // Create transfer (Payments contract)
  async createTransfer(
    recipient: string,
    amount: string,
    denom: string = 'usei',
    expiry?: number,
    remark?: string
  ): Promise<TransactionResult> {
    const msg = {
      create_transfer: {
        recipient,
        amount: { amount, denom },
        expiry_ts: expiry || null,
        remark: remark || null
      }
    };

    const funds = [{ denom, amount }];

    return this.signAndBroadcast(CONTRACT_ADDRESSES.PAYMENTS, msg, { 
      funds,
      memo: `Create transfer: ${amount} ${denom} to ${recipient}`
    });
  }

  // Claim transfer (Payments contract)
  async claimTransfer(transferId: number): Promise<TransactionResult> {
    const msg = {
      claim_transfer: {
        id: transferId
      }
    };

    return this.signAndBroadcast(CONTRACT_ADDRESSES.PAYMENTS, msg, {
      memo: `Claim transfer #${transferId}`
    });
  }

  // Refund transfer (Payments contract)
  async refundTransfer(transferId: number): Promise<TransactionResult> {
    const msg = {
      refund_transfer: {
        id: transferId
      }
    };

    return this.signAndBroadcast(CONTRACT_ADDRESSES.PAYMENTS, msg, {
      memo: `Refund transfer #${transferId}`
    });
  }

  // Create group (Groups contract)
  async createGroup(
    name: string,
    target: { amount: string; denom: string },
    maxParticipants?: number,
    expiry?: number
  ): Promise<TransactionResult> {
    const msg = {
      create_pool: {
        name,
        target,
        max_participants: maxParticipants || null,
        expiry_ts: expiry || null
      }
    };

    return this.signAndBroadcast(CONTRACT_ADDRESSES.GROUPS, msg, {
      memo: `Create group: ${name}`
    });
  }

  // Join group (Groups contract)
  async joinGroup(
    groupId: string,
    contribution: { amount: string; denom: string }
  ): Promise<TransactionResult> {
    const msg = {
      contribute: {
        pool_id: groupId,
        amount: contribution
      }
    };

    const funds = [contribution];

    return this.signAndBroadcast(CONTRACT_ADDRESSES.GROUPS, msg, {
      funds,
      memo: `Join group: ${groupId}`
    });
  }

  // Create pot (Pots contract)
  async createPot(
    label: string,
    goal: { amount: string; denom: string },
    targetDate?: number
  ): Promise<TransactionResult> {
    const msg = {
      create_pot: {
        label,
        goal,
        target_date: targetDate || null
      }
    };

    return this.signAndBroadcast(CONTRACT_ADDRESSES.POTS, msg, {
      memo: `Create savings pot: ${label}`
    });
  }

  // Deposit to pot (Pots contract)
  async depositToPot(
    potId: number,
    amount: { amount: string; denom: string }
  ): Promise<TransactionResult> {
    const msg = {
      deposit: {
        id: potId,
        amount
      }
    };

    const funds = [amount];

    return this.signAndBroadcast(CONTRACT_ADDRESSES.POTS, msg, {
      funds,
      memo: `Deposit to pot #${potId}`
    });
  }

  // Deposit to vault (Vaults contract)
  async depositToVault(
    vaultId: string,
    amount: { amount: string; denom: string }
  ): Promise<TransactionResult> {
    const msg = {
      deposit: {
        vault_id: vaultId,
        amount
      }
    };

    const funds = [amount];

    return this.signAndBroadcast(CONTRACT_ADDRESSES.VAULTS, msg, {
      funds,
      memo: `Deposit to vault: ${vaultId}`
    });
  }

  // Withdraw from vault (Vaults contract)
  async withdrawFromVault(
    vaultId: string,
    shares: string
  ): Promise<TransactionResult> {
    const msg = {
      withdraw: {
        vault_id: vaultId,
        shares
      }
    };

    return this.signAndBroadcast(CONTRACT_ADDRESSES.VAULTS, msg, {
      memo: `Withdraw from vault: ${vaultId}`
    });
  }

  // Handle transaction errors
  private handleTransactionError(error: any): Error {
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        return new Error('Insufficient balance to complete this transaction. Please add more funds to your wallet.');
      }
      if (error.message.includes('gas')) {
        return new Error('Transaction failed due to gas estimation. Please try again with a higher gas limit.');
      }
      if (error.message.includes('rejected') || error.message.includes('denied')) {
        return new Error('Transaction was rejected. Please approve the transaction in your wallet.');
      }
      if (error.message.includes('timeout')) {
        return new Error('Transaction timed out. Please check your network connection and try again.');
      }
      return error;
    }
    return new Error('Transaction failed. Please try again.');
  }

  // Get transaction details
  async getTransaction(txHash: string): Promise<any> {
    if (!this.currentProvider || !this.isWalletConnected()) {
      throw new Error('No wallet connected');
    }

    try {
      switch (this.currentProvider) {
        case 'metamask':
          const metamaskConnection = metamaskWallet.getConnection();
          return await metamaskConnection?.signingClient?.getTx(txHash);
        case 'keplr':
          return await keplrWallet.getTransaction(txHash);
        case 'leap':
          return await leapWallet.getTransaction(txHash);
        default:
          throw new Error('Unsupported wallet provider');
      }
    } catch (error) {
      console.error('Failed to get transaction:', error);
      throw new Error('Failed to retrieve transaction details');
    }
  }

  // Query contract
  async queryContract<T = any>(
    contractAddress: string,
    queryMsg: any
  ): Promise<T> {
    if (!this.currentProvider || !this.isWalletConnected()) {
      throw new Error('No wallet connected');
    }

    try {
      switch (this.currentProvider) {
        case 'metamask':
          return await metamaskWallet.queryContract(contractAddress, queryMsg);
        case 'keplr':
          return await keplrWallet.queryContract(contractAddress, queryMsg);
        case 'leap':
          return await leapWallet.queryContract(contractAddress, queryMsg);
        default:
          throw new Error('Unsupported wallet provider');
      }
    } catch (error) {
      console.error('Contract query failed:', error);
      throw new Error('Failed to query contract');
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService();