import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice } from '@cosmjs/stargate';
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { toBech32, fromBech32, fromHex } from '@cosmjs/encoding';

// Sei Network Configuration for MetaMask
export const SEI_METAMASK_CONFIG = {
  // EVM Chain Configuration (Updated for Sei Pacific-1 Mainnet)
  evmChainId: '0x531', // 1329 in decimal (Sei EVM)
  evmChainName: 'Sei Network',
  evmRpcUrl: 'https://evm-rpc.sei-apis.com',
  evmExplorer: 'https://seitrace.com',
  
  // Alternative testnet config
  testnet: {
    evmChainId: '0x531', // Same chain ID for testnet
    evmChainName: 'Sei Testnet',
    evmRpcUrl: 'https://evm-rpc-testnet.sei-apis.com',
    evmExplorer: 'https://seitrace.com',
  },
  
  // Cosmos Configuration
  cosmosChainId: 'pacific-1', // Updated to mainnet
  cosmosChainName: 'Sei Network',
  cosmosRpcUrl: 'https://rpc.sei-apis.com',
  cosmosRestUrl: 'https://rest.sei-apis.com',
  
  // Currency Configuration
  nativeCurrency: {
    name: 'SEI',
    symbol: 'SEI',
    decimals: 18, // EVM uses 18 decimals
  },
  
  // Bech32 Configuration
  bech32Config: {
    bech32PrefixAccAddr: 'sei',
    bech32PrefixAccPub: 'seipub',
    bech32PrefixValAddr: 'seivaloper',
    bech32PrefixValPub: 'seivaloperpub',
    bech32PrefixConsAddr: 'seivalcons',
    bech32PrefixConsPub: 'seivalconspub',
  },
  
  // Gas Configuration
  gasPrice: '0.025usei',
  gasAdjustment: 1.3,
};

export interface MetaMaskWalletConnection {
  evmAddress: string;
  cosmosAddress: string;
  publicKey: Uint8Array;
  signingClient?: SigningCosmWasmClient;
}

export class MetaMaskWalletService {
  private connection: MetaMaskWalletConnection | null = null;
  private ethereum: any;

  constructor() {
    this.ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null;
  }

  // Check if MetaMask is installed
  isInstalled(): boolean {
    return !!this.ethereum && this.ethereum.isMetaMask;
  }

  // Check if already connected
  isConnected(): boolean {
    return this.connection !== null;
  }

  // Get current connection
  getConnection(): MetaMaskWalletConnection | null {
    return this.connection;
  }

  // Connect to MetaMask wallet
  async connect(): Promise<MetaMaskWalletConnection> {
    if (!this.isInstalled()) {
      throw new Error('MetaMask wallet is not installed. Please install the MetaMask browser extension.');
    }

    try {
      // Switch to Sei Network first
      await this.switchToSeiNetwork();

      // Request account access
      const accounts = await this.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found in MetaMask wallet');
      }

      const evmAddress = accounts[0];

      // Convert EVM address to Cosmos address
      const cosmosAddress = this.evmToCosmosAddress(evmAddress);

      // Create a minimal public key for now - will be generated when needed for transactions
      const publicKey = new Uint8Array(33);
      publicKey[0] = 0x02; // Compressed public key prefix
      
      // Create signing client for Cosmos transactions (optional) - do this in background
      let signingClient: SigningCosmWasmClient | undefined;
      
      // Don't wait for signing client creation to speed up connection
      this.createSigningClient(evmAddress, publicKey).then(client => {
        if (this.connection) {
          this.connection.signingClient = client;
        }
      }).catch(error => {
        console.warn('Failed to create signing client in background:', error);
      });

      // Store connection
      this.connection = {
        evmAddress,
        cosmosAddress,
        publicKey,
        signingClient, // Will be undefined initially, set later in background
      };

      // Store connection in localStorage for persistence
      localStorage.setItem('metamask-wallet-connected', 'true');
      localStorage.setItem('metamask-wallet-evm-address', evmAddress);
      localStorage.setItem('metamask-wallet-cosmos-address', cosmosAddress);
      localStorage.setItem('metamask-wallet-public-key', JSON.stringify(Array.from(publicKey)));

      return this.connection;
    } catch (error) {
      console.error('MetaMask connection error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Connection request was rejected. Please try again and approve the connection in MetaMask.');
        }
        if (error.message.includes('Chain not found')) {
          throw new Error('Sei network not found in MetaMask. Please add the network manually.');
        }
        throw error;
      }
      
      throw new Error('Failed to connect to MetaMask wallet. Please try again.');
    }
  }

  // Switch to Sei Network
  async switchToSeiNetwork(): Promise<void> {
    try {
      const currentChainId = await this.ethereum.request({ method: 'eth_chainId' });
      
      if (currentChainId !== SEI_METAMASK_CONFIG.evmChainId) {
        try {
          // Try to switch to existing network
          await this.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: SEI_METAMASK_CONFIG.evmChainId }],
          });
        } catch (switchError: any) {
          // Network not added, add it
          if (switchError.code === 4902) {
            await this.addSeiNetwork();
          } else {
            throw switchError;
          }
        }
      }
    } catch (error) {
      console.error('Failed to switch to Sei Network:', error);
      throw new Error('Failed to switch to Sei Network. Please add the network manually in MetaMask.');
    }
  }

  // Add Sei Network to MetaMask
  private async addSeiNetwork(): Promise<void> {
    try {
      await this.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: SEI_METAMASK_CONFIG.evmChainId,
          chainName: SEI_METAMASK_CONFIG.evmChainName,
          nativeCurrency: SEI_METAMASK_CONFIG.nativeCurrency,
          rpcUrls: [SEI_METAMASK_CONFIG.evmRpcUrl],
          blockExplorerUrls: [SEI_METAMASK_CONFIG.evmExplorer],
          iconUrls: ['https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png']
        }]
      });
      
      console.log('✅ Sei Network added to MetaMask successfully');
    } catch (error) {
      console.error('❌ Failed to add Sei Network:', error);
      
      // Try adding testnet as fallback
      try {
        await this.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEI_METAMASK_CONFIG.testnet.evmChainId,
            chainName: SEI_METAMASK_CONFIG.testnet.evmChainName,
            nativeCurrency: SEI_METAMASK_CONFIG.nativeCurrency,
            rpcUrls: [SEI_METAMASK_CONFIG.testnet.evmRpcUrl],
            blockExplorerUrls: [SEI_METAMASK_CONFIG.testnet.evmExplorer],
            iconUrls: ['https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png']
          }]
        });
        
        console.log('✅ Sei Testnet added to MetaMask as fallback');
      } catch (testnetError) {
        console.error('❌ Failed to add Sei Testnet as fallback:', testnetError);
        throw new Error('Failed to add Sei Network to MetaMask. Please add it manually.');
      }
    }
  }

  // Get public key through message signing (called when needed for transactions)
  async getPublicKeyForTransaction(address: string): Promise<Uint8Array> {
    try {
      // Create a deterministic message
      const message = `SeiMoney transaction signing for ${address} at ${Date.now()}`;
      
      // Sign the message to get signature
      const signature = await this.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });

      // Extract public key from signature (simplified approach)
      // In production, you'd use proper cryptographic methods
      const publicKey = this.derivePublicKeyFromSignature(message, signature, address);
      
      // Update connection with real public key
      if (this.connection) {
        this.connection.publicKey = publicKey;
        localStorage.setItem('metamask-wallet-public-key', JSON.stringify(Array.from(publicKey)));
      }
      
      return publicKey;
    } catch (error) {
      console.error('Failed to get public key:', error);
      throw new Error('Failed to get wallet public key. Please try again.');
    }
  }

  // Get public key through message signing (legacy method for compatibility)
  private async getPublicKey(address: string): Promise<Uint8Array> {
    return this.getPublicKeyForTransaction(address);
  }

  // Derive public key from signature (simplified)
  private derivePublicKeyFromSignature(message: string, signature: string, address: string): Uint8Array {
    // This is a simplified approach for demo purposes
    // In production, use proper ECDSA recovery
    const hash = this.hashString(address + message + signature);
    const publicKey = new Uint8Array(33);
    publicKey[0] = 0x02; // Compressed public key prefix
    
    for (let i = 0; i < 32; i++) {
      publicKey[i + 1] = hash[i % hash.length];
    }
    
    return publicKey;
  }

  // Simple hash function
  private hashString(input: string): Uint8Array {
    const hash = new Uint8Array(32);
    for (let i = 0; i < input.length; i++) {
      hash[i % 32] = (hash[i % 32] + input.charCodeAt(i)) % 256;
    }
    return hash;
  }

  // Convert EVM address to Cosmos address
  private evmToCosmosAddress(evmAddress: string): string {
    try {
      // Remove '0x' prefix and convert to bytes
      const addressBytes = fromHex(evmAddress.slice(2));
      
      // Take the first 20 bytes (standard Ethereum address length)
      const cosmosAddressBytes = addressBytes.slice(0, 20);
      
      // Encode with Sei bech32 prefix
      return toBech32(SEI_METAMASK_CONFIG.bech32Config.bech32PrefixAccAddr, cosmosAddressBytes);
    } catch (error) {
      console.error('Failed to convert EVM address to Cosmos address:', error);
      // Fallback: create a deterministic address based on the EVM address
      try {
        const hash = this.hashString(evmAddress);
        const addressBytes = hash.slice(0, 20);
        return toBech32(SEI_METAMASK_CONFIG.bech32Config.bech32PrefixAccAddr, addressBytes);
      } catch (fallbackError) {
        console.error('Fallback address conversion also failed:', fallbackError);
        // Ultimate fallback: return a mock address
        return `sei1${evmAddress.slice(2, 42).toLowerCase()}`;
      }
    }
  }

  // Convert hex string to bytes (using cosmjs encoding)
  private hexToBytes(hex: string): Uint8Array {
    try {
      return fromHex(hex);
    } catch (error) {
      console.error('Failed to convert hex to bytes:', error);
      // Fallback manual conversion
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes;
    }
  }

  // Create signing client for Cosmos transactions
  private async createSigningClient(evmAddress: string, publicKey: Uint8Array): Promise<SigningCosmWasmClient | undefined> {
    try {
      // Create a wallet from the public key
      const wallet = await DirectSecp256k1Wallet.fromKey(
        publicKey.slice(1), // Remove the prefix byte
        SEI_METAMASK_CONFIG.bech32Config.bech32PrefixAccAddr
      );

      // Create signing client
      return SigningCosmWasmClient.connectWithSigner(
        SEI_METAMASK_CONFIG.cosmosRpcUrl,
        wallet,
        {
          gasPrice: GasPrice.fromString(SEI_METAMASK_CONFIG.gasPrice),
        }
      );
    } catch (error) {
      console.warn('Failed to create signing client, will use REST API for queries:', error);
      // Return undefined - we'll use REST API for balance queries
      return undefined;
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    this.connection = null;
    localStorage.removeItem('metamask-wallet-connected');
    localStorage.removeItem('metamask-wallet-evm-address');
    localStorage.removeItem('metamask-wallet-cosmos-address');
    localStorage.removeItem('metamask-wallet-public-key');
  }

  // Get EVM balance
  async getEvmBalance(address?: string): Promise<string> {
    if (!this.connection && !address) {
      throw new Error('Wallet not connected');
    }

    const targetAddress = address || this.connection?.evmAddress;
    if (!targetAddress) {
      throw new Error('No address available');
    }

    try {
      const balance = await this.ethereum.request({
        method: 'eth_getBalance',
        params: [targetAddress, 'latest']
      });

      // Convert from wei to SEI (18 decimals for EVM)
      const balanceInWei = BigInt(balance);
      const balanceInSei = Number(balanceInWei) / Math.pow(10, 18);
      
      return balanceInSei.toFixed(6);
    } catch (error) {
      console.error('Failed to get EVM balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }

  // Get Cosmos balance
  async getCosmosBalance(address?: string): Promise<{ denom: string; amount: string }[]> {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    const targetAddress = address || this.connection.cosmosAddress;
    
    try {
      // If signing client is not available, try REST API
      if (!this.connection.signingClient) {
        return await this.getCosmosBalanceViaRest(targetAddress);
      }
      
      const balance = await this.connection.signingClient.getBalance(targetAddress, 'usei');
      return balance ? [balance] : [];
    } catch (error) {
      console.error('Failed to get Cosmos balance via client:', error);
      
      // Fallback to REST API
      try {
        return await this.getCosmosBalanceViaRest(targetAddress);
      } catch (restError) {
        console.error('Failed to get Cosmos balance via REST:', restError);
        
        // Return empty balance as fallback
        return [];
      }
    }
  }

  // Get Cosmos balance via REST API (fallback method)
  private async getCosmosBalanceViaRest(address: string): Promise<{ denom: string; amount: string }[]> {
    try {
      const response = await fetch(`${SEI_METAMASK_CONFIG.cosmosRestUrl}/cosmos/bank/v1beta1/balances/${address}`);
      
      if (!response.ok) {
        throw new Error(`REST API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.balances && Array.isArray(data.balances)) {
        return data.balances;
      }
      
      return [];
    } catch (error) {
      console.error('REST API balance query failed:', error);
      return [];
    }
  }

  // Sign and broadcast Cosmos transaction
  async signAndBroadcast(
    contractAddress: string,
    msg: any,
    funds: { denom: string; amount: string }[] = [],
    memo: string = ''
  ): Promise<{ transactionHash: string; height: number; gasUsed: number }> {
    if (!this.connection || !this.connection.signingClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await this.connection.signingClient.execute(
        this.connection.cosmosAddress,
        contractAddress,
        msg,
        'auto',
        memo,
        funds
      );

      return {
        transactionHash: result.transactionHash,
        height: result.height,
        gasUsed: Number(result.gasUsed),
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
          throw new Error('Transaction was rejected. Please approve the transaction in MetaMask.');
        }
        throw error;
      }
      
      throw new Error('Transaction failed. Please try again.');
    }
  }

  // Send EVM transaction
  async sendEvmTransaction(to: string, value: string, data?: string): Promise<string> {
    if (!this.connection) {
      throw new Error('Wallet not connected');
    }

    try {
      const txHash = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: this.connection.evmAddress,
          to,
          value: `0x${BigInt(Math.floor(parseFloat(value) * Math.pow(10, 18))).toString(16)}`,
          data: data || '0x',
        }],
      });

      return txHash;
    } catch (error) {
      console.error('EVM transaction failed:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('User denied')) {
          throw new Error('Transaction was rejected. Please approve the transaction in MetaMask.');
        }
        throw error;
      }
      
      throw new Error('EVM transaction failed. Please try again.');
    }
  }

  // Query contract
  async queryContract<T = any>(
    contractAddress: string,
    queryMsg: any
  ): Promise<T> {
    if (!this.connection || !this.connection.signingClient) {
      throw new Error('Wallet not connected');
    }

    return await this.connection.signingClient.queryContractSmart(contractAddress, queryMsg);
  }

  // Auto-reconnect if previously connected
  async autoReconnect(): Promise<boolean> {
    if (!this.isInstalled()) {
      return false;
    }

    const wasConnected = localStorage.getItem('metamask-wallet-connected') === 'true';
    const savedEvmAddress = localStorage.getItem('metamask-wallet-evm-address');
    const savedCosmosAddress = localStorage.getItem('metamask-wallet-cosmos-address');

    if (!wasConnected || !savedEvmAddress || !savedCosmosAddress) {
      return false;
    }

    try {
      // Check if still connected to the same account
      const accounts = await this.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length === 0 || accounts[0] !== savedEvmAddress) {
        // Account changed or disconnected
        await this.disconnect();
        return false;
      }

      // Restore connection without triggering popup
      // Use cached public key if available, otherwise create a dummy one for reconnection
      const cachedPublicKey = localStorage.getItem('metamask-wallet-public-key');
      let publicKey: Uint8Array;
      
      if (cachedPublicKey) {
        publicKey = new Uint8Array(JSON.parse(cachedPublicKey));
      } else {
        // Create a minimal public key for reconnection - will be refreshed on next transaction
        publicKey = new Uint8Array(33);
        publicKey[0] = 0x02; // Compressed public key prefix
      }
      
      const cosmosAddress = this.evmToCosmosAddress(accounts[0]);
      
      // Create signing client in background to avoid blocking reconnection
      let signingClient: SigningCosmWasmClient | undefined;
      this.createSigningClient(accounts[0], publicKey).then(client => {
        if (this.connection) {
          this.connection.signingClient = client;
        }
      }).catch(error => {
        console.warn('Failed to create signing client during reconnection:', error);
      });

      this.connection = {
        evmAddress: accounts[0],
        cosmosAddress,
        publicKey,
        signingClient, // Will be undefined initially, set later in background
      };
      
      // Verify addresses match
      if (this.connection?.evmAddress === savedEvmAddress && 
          this.connection?.cosmosAddress === savedCosmosAddress) {
        return true;
      } else {
        // Addresses changed, clear storage
        await this.disconnect();
        return false;
      }
    } catch (error) {
      console.error('Auto-reconnection failed:', error);
      await this.disconnect();
      return false;
    }
  }

  // Listen for account changes
  onAccountChange(callback: (addresses: { evm: string; cosmos: string } | null) => void): () => void {
    if (!this.isInstalled()) {
      return () => {};
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // Disconnected
        this.disconnect();
        callback(null);
      } else if (this.connection && accounts[0] !== this.connection.evmAddress) {
        // Account changed
        this.autoReconnect().then((reconnected) => {
          if (reconnected && this.connection) {
            callback({
              evm: this.connection.evmAddress,
              cosmos: this.connection.cosmosAddress
            });
          } else {
            callback(null);
          }
        });
      }
    };

    const handleChainChanged = (chainId: string) => {
      if (chainId !== SEI_METAMASK_CONFIG.evmChainId) {
        // Wrong network
        this.disconnect();
        callback(null);
      }
    };

    this.ethereum.on('accountsChanged', handleAccountsChanged);
    this.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      this.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      this.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }

  // Get network info
  getNetworkInfo() {
    return {
      evmChainId: SEI_METAMASK_CONFIG.evmChainId,
      evmChainName: SEI_METAMASK_CONFIG.evmChainName,
      cosmosChainId: SEI_METAMASK_CONFIG.cosmosChainId,
      cosmosChainName: SEI_METAMASK_CONFIG.cosmosChainName,
      evmRpcUrl: SEI_METAMASK_CONFIG.evmRpcUrl,
      cosmosRpcUrl: SEI_METAMASK_CONFIG.cosmosRpcUrl,
      evmExplorer: SEI_METAMASK_CONFIG.evmExplorer,
      cosmosExplorer: 'https://seitrace.com',
    };
  }

  // Validate addresses
  static isValidEvmAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static isValidCosmosAddress(address: string): boolean {
    return address.startsWith('sei') && address.length === 42;
  }
}

// Export singleton instance
export const metamaskWallet = new MetaMaskWalletService();