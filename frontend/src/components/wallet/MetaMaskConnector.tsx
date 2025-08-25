import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { colors } from '../../lib/colors';
import { apiService } from '../../lib/api';

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface MetaMaskConnectorProps {
  onConnect?: (wallet: any) => void;
  onDisconnect?: () => void;
}

export const MetaMaskConnector: React.FC<MetaMaskConnectorProps> = ({
  onConnect,
  onDisconnect
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
  };

  // Check connection status on component mount
  useEffect(() => {
    checkConnection();
    
    if (isMetaMaskInstalled()) {
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const checkConnection = async () => {
    if (!isMetaMaskInstalled()) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setChainId(chainId);
        setIsConnected(true);
        await getBalance(accounts[0]);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      setIsConnected(false);
      setAccount(null);
      setBalance(null);
      setChainId(null);
      onDisconnect?.();
    } else {
      // User switched accounts
      setAccount(accounts[0]);
      getBalance(accounts[0]);
    }
  };

  const handleChainChanged = (chainId: string) => {
    setChainId(chainId);
    // Reload the page when chain changes (recommended by MetaMask)
    window.location.reload();
  };

  const getBalance = async (address: string) => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // Convert from wei to ETH
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      setBalance(balanceInEth.toFixed(4));
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });

      // Get a signature for verification (optional)
      const message = `Connect to SeiMoney at ${new Date().toISOString()}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, account]
      });

      // Send connection data to backend
      const walletData = {
        provider: 'metamask',
        address: account,
        signature,
        message
      };

      const response = await apiService.connectWallet(walletData);
      
      if (response.ok) {
        setAccount(account);
        setChainId(chainId);
        setIsConnected(true);
        await getBalance(account);
        
        onConnect?.(response.wallet);
      } else {
        throw new Error(response.error || 'Failed to connect wallet');
      }

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await apiService.disconnectWallet();
      
      setIsConnected(false);
      setAccount(null);
      setBalance(null);
      setChainId(null);
      setError(null);
      
      onDisconnect?.();
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error);
      setError(error.message || 'Failed to disconnect wallet');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getChainName = (chainId: string) => {
    const chains: Record<string, string> = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai',
      '0xa86a': 'Avalanche Mainnet',
      '0xa869': 'Avalanche Fuji',
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  if (!isMetaMaskInstalled()) {
    return (
      <GlassCard className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Wallet size={32} className="text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              MetaMask Required
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Please install MetaMask to connect your wallet
            </p>
            <NeonButton
              color="green"
              onClick={() => window.open('https://metamask.io/', '_blank')}
            >
              Install MetaMask
            </NeonButton>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
            <span className="text-2xl">🦊</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">MetaMask</h3>
            <p className="text-sm text-gray-400">Ethereum Wallet</p>
          </div>
        </div>
        
        {isConnected && (
          <div className="flex items-center space-x-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-sm text-green-400">Connected</span>
          </div>
        )}
      </div>

      {error && (
        <motion.div
          className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-500/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        </motion.div>
      )}

      {isConnected && account ? (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Address:</span>
              <NeonText color="green" size="sm">
                {formatAddress(account)}
              </NeonText>
            </div>
            
            {balance && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Balance:</span>
                <span className="text-sm text-white font-mono">
                  {balance} ETH
                </span>
              </div>
            )}
            
            {chainId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Network:</span>
                <span className="text-sm text-white">
                  {getChainName(chainId)}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-700">
            <NeonButton
              variant="outline"
              color="purple"
              onClick={disconnectWallet}
              className="w-full"
            >
              Disconnect Wallet
            </NeonButton>
          </div>
        </motion.div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-gray-400 mb-4">
            Connect your MetaMask wallet to get started with SeiMoney
          </p>
          
          <NeonButton
            color="green"
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <div className="flex items-center space-x-2">
                <Loader size={16} className="animate-spin" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Wallet size={16} />
                <span>Connect MetaMask</span>
              </div>
            )}
          </NeonButton>
        </div>
      )}
    </GlassCard>
  );
};