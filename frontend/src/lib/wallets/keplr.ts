import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice } from '@cosmjs/stargate';

// Sei Network Configuration for Keplr
export const SEI_CHAIN_CONFIG = {
  chainId: 'atlantic-2',
  chainName: 'Sei Testnet',
  rpc: 'https://rpc.atlantic-2.seinetwork.io:443',
  rest: 'https://rest.atlantic-2.seinetwork.io:443',
  bip44: {
    coinType: 118,
  },
  bech32Config: {
    bech32PrefixAccAddr: 'sei',
    bech32PrefixAccPub: 'seipub',
    bech32PrefixValAddr: 'seivaloper',
    bech32PrefixValPub: 'seivaloperpub',
    bech32PrefixConsAddr: 'seivalcons',
    bech32PrefixConsPub: 'seivalconspub',
  },
  currencies: [
    {
      coinDenom: 'SEI',
      coinMinimalDenom: 'usei',
      coinDecimals: 6,
      coinGeckoId: 'sei-network',
    },
  ],
  feeCurrencies: [
    {
      coinDenom: 'SEI',
      coinMinimalDenom: 'usei',
      coinDecimals: 6,
      coinGeckoId: 'sei-network',
      gasPriceStep: {
        low: 0.02,
        average: 0.025,
        high: 0.03,
      },
    },
  ],
  stakeCurrency: {
    coinDenom: 'SEI',
    coinMinimalDenom: 'usei',
    coinDecimals: 6,
    coinGeckoId: 'sei-network',
  },
  features: ['cosmwasm'],
};

export interface KeplrWalletConnection {
  address: string;
  publicKey: Uint8Array;
  signingClient: SigningCosmWasmClient;
  offlineSigner: any;
}

export class KeplrWalletService {
  private connection: KeplrWalletConnection | null = null;

  // Check if Keplr is installed
  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.keplr;
  }

  // Check if already connected
  isConnected(): boolean {
    return this.connection !== null;
  }

  // Get current connection
  getConnection(): KeplrWalletConnection | null {
    return this.connection;
  }

  // Connect to Keplr wallet
  async connect(): Promise<KeplrWalletConnection> {
    if (!this.isInstalled()) {
      throw new Error('Keplr wallet is not installed. Please install the Keplr browser extension.');
    }

    try {
      // Suggest the chain to Keplr
      await this.suggestChain();

      // Enable the chain
      await window.keplr.enable(SEI_CHAIN_CONFIG.chainId);

      // Get the offline signer
      const offlineSigner = window.keplr.getOfflineSigner(SEI_CHAIN_CONFIG.chainId);
      
      // Get accounts
      const accounts = await offlineSigner.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found in Keplr wallet');
      }

      const account = accounts[0];

      // Create signing client
      const signingClient = await SigningCosmWasmClient.connectWithSigner(
        SEI_CHAIN_CONFIG.rpc,
        offlineSigner,
        {
          gasPrice: GasPrice.fromString('0.025usei'),
        }
      );

      // Store connection
      this.connection = {
        address: account.address,
        publicKey: account.pubkey,
        signingClient,
        offlineSigner,
      };

      // Store connection in localStorage for persistence
      localStorage.setItem('keplr-wallet-connected', 'true');
      localStorage.setItem('keplr-wallet-address', account.address);

      return this.connection;
    } catch (error) {
      console.error('Keplr connection error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Request rejected')) {
          throw new Error('Connection request was rejected. Please try again and approve the connection in Keplr.');
        }
        if (error.message.includes('Chain not found')) {
          throw new Error('Sei network not found in Keplr. Please add the network manually or update Keplr.');
        }
        throw error;
      }
      
      throw new Error('Failed to connect to Keplr wallet. Please try again.');
    }
  }

  // Suggest Sei chain to Keplr
  private async suggestChain(): Promise<void> {
    try {
      await window.keplr.experimentalSuggestChain(SEI_CHAIN_CONFIG);
    } catch (error) {
      // Chain might already be added, or user rejected
      console.warn('Failed to suggest chain to Keplr:', error);
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    this.connection = null;
    localStorage.removeItem('keplr-wallet-connected');
    localStorage.removeItem('keplr-wallet-address');
  }

  // Get wallet balance
  async getBalance(address?: string): Promise<{ denom: string; amount: string }[]> {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    const targetAddress = address || this.connection.address;
    return await this.connection.signingClient.getAllBalances(targetAddress);
  }

  // Get account info
  async getAccountInfo(address?: string) {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    const targetAddress = address || this.connection.address;
    return await this.connection.signingClient.getAccount(targetAddress);
  }

  // Sign and broadcast transaction
  async signAndBroadcast(
    contractAddress: string,
    msg: any,
    funds: { denom: string; amount: string }[] = [],
    memo: string = ''
  ): Promise<{ transactionHash: string; height: number; gasUsed: number }> {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await this.connection.signingClient.execute(
        this.connection.address,
        contractAddress,
        msg,
        'auto',
        memo,
        funds
      );

      return {
        transactionHash: result.transactionHash,
        height: result.height,
        gasUsed: result.gasUsed,
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient balance to complete this transaction.');
        }
        if (error.message.includes('gas')) {
          throw new Error('Transaction failed due to gas estimation. Please try again.');
        }
        if (error.message.includes('rejected')) {
          throw new Error('Transaction was rejected. Please approve the transaction in Keplr.');
        }
        throw error;
      }
      
      throw new Error('Transaction failed. Please try again.');
    }
  }

  // Query contract
  async queryContract<T = any>(
    contractAddress: string,
    queryMsg: any
  ): Promise<T> {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    return await this.connection.signingClient.queryContractSmart(contractAddress, queryMsg);
  }

  // Send tokens
  async sendTokens(
    recipient: string,
    amount: { denom: string; amount: string }[],
    memo: string = ''
  ): Promise<{ transactionHash: string; height: number }> {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await this.connection.signingClient.sendTokens(
        this.connection.address,
        recipient,
        amount,
        'auto',
        memo
      );

      return {
        transactionHash: result.transactionHash,
        height: result.height,
      };
    } catch (error) {
      console.error('Send tokens failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient balance to send tokens.');
        }
        if (error.message.includes('rejected')) {
          throw new Error('Transaction was rejected. Please approve the transaction in Keplr.');
        }
        throw error;
      }
      
      throw new Error('Failed to send tokens. Please try again.');
    }
  }

  // Get transaction details
  async getTransaction(txHash: string) {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    return await this.connection.signingClient.getTx(txHash);
  }

  // Auto-reconnect if previously connected
  async autoReconnect(): Promise<boolean> {
    if (!this.isInstalled()) {
      return false;
    }

    const wasConnected = localStorage.getItem('keplr-wallet-connected') === 'true';
    const savedAddress = localStorage.getItem('keplr-wallet-address');

    if (!wasConnected || !savedAddress) {
      return false;
    }

    try {
      // Try to reconnect silently
      await this.connect();
      
      // Verify the address matches
      if (this.connection?.address === savedAddress) {
        return true;
      } else {
        // Address changed, clear storage
        await this.disconnect();
        return false;
      }
    } catch (error) {
      // Failed to reconnect, clear storage
      await this.disconnect();
      return false;
    }
  }

  // Listen for account changes
  onAccountChange(callback: (address: string | null) => void): () => void {
    if (!this.isInstalled()) {
      return () => {};
    }

    const handleAccountChange = () => {
      if (this.connection) {
        // Re-check connection
        this.autoReconnect().then((reconnected) => {
          if (reconnected && this.connection) {
            callback(this.connection.address);
          } else {
            callback(null);
          }
        });
      }
    };

    // Listen for Keplr events
    window.addEventListener('keplr_keystorechange', handleAccountChange);

    return () => {
      window.removeEventListener('keplr_keystorechange', handleAccountChange);
    };
  }

  // Get network info
  getNetworkInfo() {
    return {
      chainId: SEI_CHAIN_CONFIG.chainId,
      chainName: SEI_CHAIN_CONFIG.chainName,
      rpc: SEI_CHAIN_CONFIG.rpc,
      rest: SEI_CHAIN_CONFIG.rest,
      explorer: 'https://seitrace.com',
    };
  }

  // Validate address format
  static isValidAddress(address: string): boolean {
    return address.startsWith('sei') && address.length === 42;
  }
}

// Export singleton instance
export const keplrWallet = new KeplrWalletService();

// Extend Window interface for Keplr
declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      getOfflineSigner: (chainId: string) => any;
      experimentalSuggestChain: (chainInfo: any) => Promise<void>;
      getKey: (chainId: string) => Promise<{
        name: string;
        algo: string;
        pubKey: Uint8Array;
        address: Uint8Array;
        bech32Address: string;
      }>;
    };
  }
}