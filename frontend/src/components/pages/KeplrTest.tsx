import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Copy,
  Send,
  Eye
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { keplrWallet } from '../../lib/wallets/keplr';
import { colors } from '../../lib/colors';

export const KeplrTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<{ denom: string; amount: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  useEffect(() => {
    // Check if already connected
    const connection = keplrWallet.getConnection();
    if (connection) {
      setIsConnected(true);
      setAddress(connection.address);
      loadWalletData();
    }

    // Set network info
    setNetworkInfo(keplrWallet.getNetworkInfo());

    // Listen for account changes
    const unsubscribe = keplrWallet.onAccountChange((newAddress) => {
      if (newAddress) {
        setAddress(newAddress);
        loadWalletData();
      } else {
        handleDisconnect();
      }
    });

    return unsubscribe;
  }, []);

  const loadWalletData = async () => {
    try {
      const [balanceData, accountData] = await Promise.all([
        keplrWallet.getBalance(),
        keplrWallet.getAccountInfo()
      ]);
      
      setBalance(balanceData);
      setAccountInfo(accountData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load wallet data');
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const connection = await keplrWallet.connect();
      setIsConnected(true);
      setAddress(connection.address);
      await loadWalletData();
    } catch (error) {
      console.error('Connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await keplrWallet.disconnect();
      setIsConnected(false);
      setAddress(null);
      setBalance([]);
      setAccountInfo(null);
      setError(null);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const handleRefresh = async () => {
    if (!isConnected) return;
    
    setError(null);
    try {
      await loadWalletData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refresh data');
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      // You could add a toast notification here
    }
  };

  const formatBalance = (amount: string, denom: string) => {
    if (denom === 'usei') {
      return `${(parseInt(amount) / 1000000).toFixed(6)} SEI`;
    }
    return `${amount} ${denom}`;
  };

  const openExplorer = () => {
    if (address && networkInfo) {
      window.open(`${networkInfo.explorer}/account/${address}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <NeonText size="xl" color="purple" className="mb-4">
            Keplr Wallet Integration Test
          </NeonText>
          <p className="text-gray-400">
            Test the real Keplr wallet connection and functionality
          </p>
        </div>

        {/* Connection Status */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Wallet className="mr-2" size={24} />
              Connection Status
            </h3>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <CheckCircle className="text-green-400" size={20} />
              ) : (
                <AlertCircle className="text-gray-400" size={20} />
              )}
              <span className={isConnected ? 'text-green-400' : 'text-gray-400'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Keplr Installed</p>
              <div className="flex items-center">
                {keplrWallet.isInstalled() ? (
                  <CheckCircle className="text-green-400 mr-2" size={16} />
                ) : (
                  <AlertCircle className="text-red-400 mr-2" size={16} />
                )}
                <span className={keplrWallet.isInstalled() ? 'text-green-400' : 'text-red-400'}>
                  {keplrWallet.isInstalled() ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Network</p>
              <p className="text-white">
                {networkInfo ? `${networkInfo.chainName} (${networkInfo.chainId})` : 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            {!isConnected ? (
              <NeonButton
                color="purple"
                onClick={handleConnect}
                disabled={isConnecting || !keplrWallet.isInstalled()}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  'Connect Keplr'
                )}
              </NeonButton>
            ) : (
              <>
                <NeonButton color="green" onClick={handleRefresh}>
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </NeonButton>
                <NeonButton variant="outline" color="red" onClick={handleDisconnect}>
                  Disconnect
                </NeonButton>
              </>
            )}
          </div>
        </GlassCard>

        {/* Error Display */}
        {error && (
          <GlassCard className="p-4 mb-6 border-red-500/50">
            <div className="flex items-center text-red-400">
              <AlertCircle size={20} className="mr-2" />
              <span>{error}</span>
            </div>
          </GlassCard>
        )}

        {/* Wallet Information */}
        {isConnected && address && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Info */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Eye className="mr-2" size={20} />
                Account Information
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Address</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-black/30 px-2 py-1 rounded text-green-400 flex-1">
                      {address}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="p-2 hover:bg-white/10 rounded transition-colors"
                      title="Copy address"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={openExplorer}
                      className="p-2 hover:bg-white/10 rounded transition-colors"
                      title="View in explorer"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>

                {accountInfo && (
                  <>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Account Number</p>
                      <p className="text-white">{accountInfo.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Sequence</p>
                      <p className="text-white">{accountInfo.sequence}</p>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-sm text-gray-400 mb-1">Valid Address</p>
                  <div className="flex items-center">
                    {keplrWallet.constructor.isValidAddress(address) ? (
                      <CheckCircle className="text-green-400 mr-2" size={16} />
                    ) : (
                      <AlertCircle className="text-red-400 mr-2" size={16} />
                    )}
                    <span className={keplrWallet.constructor.isValidAddress(address) ? 'text-green-400' : 'text-red-400'}>
                      {keplrWallet.constructor.isValidAddress(address) ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Balance Info */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Send className="mr-2" size={20} />
                Balance Information
              </h3>

              <div className="space-y-3">
                {balance.length > 0 ? (
                  balance.map((coin, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-black/20 rounded">
                      <span className="text-gray-400">{coin.denom.toUpperCase()}</span>
                      <span className="text-white font-mono">
                        {formatBalance(coin.amount, coin.denom)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400">No balance found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      This account may not have any tokens yet
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Network Information */}
        {networkInfo && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Network Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Chain ID</p>
                <p className="text-white font-mono">{networkInfo.chainId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Chain Name</p>
                <p className="text-white">{networkInfo.chainName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">RPC Endpoint</p>
                <p className="text-white text-sm break-all">{networkInfo.rpc}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">REST Endpoint</p>
                <p className="text-white text-sm break-all">{networkInfo.rest}</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Instructions */}
        {!keplrWallet.isInstalled() && (
          <GlassCard className="p-6 border-yellow-500/50">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Install Keplr Wallet</h3>
            <p className="text-gray-300 mb-4">
              To test the Keplr integration, you need to install the Keplr browser extension.
            </p>
            <a
              href="https://www.keplr.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              <ExternalLink size={16} />
              <span>Install Keplr</span>
            </a>
          </GlassCard>
        )}
      </div>
    </div>
  );
};