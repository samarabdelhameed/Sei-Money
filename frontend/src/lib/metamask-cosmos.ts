import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { SigningStargateClient, StargateClient } from '@cosmjs/stargate';
import { Bech32 } from '@cosmjs/encoding';

export interface MetaMaskCosmosConfig {
  rpcUrl: string;
  chainId: string;
  chainName: string;
  bech32Config: {
    bech32PrefixAccAddr: string;
    bech32PrefixAccPub: string;
    bech32PrefixValAddr: string;
    bech32PrefixValPub: string;
    bech32PrefixConsAddr: string;
    bech32PrefixConsPub: string;
  };
}

export class MetaMaskCosmosProvider {
  private config: MetaMaskCosmosConfig;
  private ethereum: any;

  constructor(config: MetaMaskCosmosConfig) {
    this.config = config;
    this.ethereum = (window as any).ethereum;
  }

  async connect(): Promise<{
    address: string;
    cosmosAddress: string;
    publicKey: Uint8Array;
  }> {
    if (!this.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      // Request account access
      const accounts = await this.ethereum.request({ method: 'eth_requestAccounts' });
      const ethAddress = accounts[0];

      // Get the account's public key
      const publicKey = await this.getPublicKey(ethAddress);

      // Convert Ethereum address to Cosmos address
      const cosmosAddress = this.ethToCosmosAddress(ethAddress, publicKey);

      return {
        address: ethAddress,
        cosmosAddress,
        publicKey
      };
    } catch (error) {
      throw new Error(`Failed to connect MetaMask: ${error}`);
    }
  }

  private async getPublicKey(address: string): Promise<Uint8Array> {
    try {
      // Request personal_sign to get the public key
      const message = 'Get public key for Cosmos integration';
      const signature = await this.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });

      // Extract public key from signature (this is a simplified approach)
      // In production, you'd want to use a more robust method
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = this.hexToBytes(signature);
      
      // For now, we'll generate a deterministic public key
      // In a real implementation, you'd derive this from the signature
      return this.generateDeterministicPublicKey(address);
    } catch (error) {
      throw new Error(`Failed to get public key: ${error}`);
    }
  }

  private generateDeterministicPublicKey(address: string): Uint8Array {
    // Generate a deterministic public key based on the Ethereum address
    // This is a simplified approach - in production, use proper key derivation
    const hash = this.simpleHash(address);
    const publicKey = new Uint8Array(33);
    publicKey[0] = 0x02; // Compressed public key prefix
    for (let i = 0; i < 32; i++) {
      publicKey[i + 1] = hash[i % hash.length];
    }
    return publicKey;
  }

  private simpleHash(input: string): Uint8Array {
    // Simple hash function for demo purposes
    // In production, use a proper cryptographic hash
    const hash = new Uint8Array(32);
    for (let i = 0; i < input.length; i++) {
      hash[i % 32] = (hash[i % 32] + input.charCodeAt(i)) % 256;
    }
    return hash;
  }

  private ethToCosmosAddress(ethAddress: string, publicKey: Uint8Array): string {
    // Convert Ethereum address to Cosmos address using bech32
    const addressBytes = this.hexToBytes(ethAddress.slice(2)); // Remove '0x' prefix
    
    // Use the public key to generate a Cosmos address
    const cosmosAddressBytes = this.publicKeyToCosmosAddress(publicKey);
    
    return Bech32.encode(this.config.bech32Config.bech32PrefixAccAddr, cosmosAddressBytes);
  }

  private publicKeyToCosmosAddress(publicKey: Uint8Array): Uint8Array {
    // Convert public key to Cosmos address
    // This is a simplified conversion - in production, use proper address derivation
    const address = new Uint8Array(20);
    
    // Use the last 20 bytes of the public key as the address
    if (publicKey.length >= 20) {
      for (let i = 0; i < 20; i++) {
        address[i] = publicKey[publicKey.length - 20 + i];
      }
    } else {
      // If public key is shorter, pad with zeros
      for (let i = 0; i < 20; i++) {
        address[i] = i < publicKey.length ? publicKey[i] : 0;
      }
    }
    
    return address;
  }

  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  async signTransaction(transaction: any): Promise<{
    signature: Uint8Array;
    publicKey: Uint8Array;
  }> {
    try {
      const message = JSON.stringify(transaction);
      const accounts = await this.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      const signature = await this.ethereum.request({
        method: 'personal_sign',
        params: [message, address]
      });

      const signatureBytes = this.hexToBytes(signature.slice(2)); // Remove '0x'
      const publicKey = await this.getPublicKey(address);

      return {
        signature: signatureBytes,
        publicKey
      };
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error}`);
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // Convert from wei to SEI (assuming 18 decimals)
      const balanceInWei = BigInt(balance);
      const balanceInSei = Number(balanceInWei) / Math.pow(10, 18);
      
      return balanceInSei.toString();
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  async switchToSeiNetwork(): Promise<void> {
    try {
      const chainId = await this.ethereum.request({ method: 'eth_chainId' });
      const seiTestnetChainId = '0x1A'; // 26 in decimal (atlantic-2 testnet)
      
      if (chainId !== seiTestnetChainId) {
        try {
          // Try to switch to existing network
          await this.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: seiTestnetChainId }],
          });
        } catch (switchError: any) {
          // Network not added, add it
          if (switchError.code === 4902) {
            await this.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: seiTestnetChainId,
                chainName: 'Sei Testnet',
                nativeCurrency: {
                  name: 'SEI',
                  symbol: 'SEI',
                  decimals: 18
                },
                rpcUrls: ['https://rpc-testnet.sei.io'],
                blockExplorerUrls: ['https://testnet.sei.io'],
                iconUrls: ['https://sei.io/favicon.ico']
              }]
            });
          } else {
            throw switchError;
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to switch to Sei Network: ${error}`);
    }
  }
}

// Default configuration for Sei Network
export const seiNetworkConfig: MetaMaskCosmosConfig = {
  rpcUrl: 'https://rpc-testnet.sei.io',
  chainId: 'atlantic-2',
  chainName: 'Sei Testnet',
  bech32Config: {
    bech32PrefixAccAddr: 'sei',
    bech32PrefixAccPub: 'seipub',
    bech32PrefixValAddr: 'seivaloper',
    bech32PrefixValPub: 'seivaloperpub',
    bech32PrefixConsAddr: 'seivalcons',
    bech32PrefixConsPub: 'seivalconspub'
  }
};

export const metamaskCosmosProvider = new MetaMaskCosmosProvider(seiNetworkConfig);
