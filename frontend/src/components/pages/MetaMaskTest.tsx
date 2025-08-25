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
  Eye,
  Layers,
  Globe
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { metamaskWallet } from '../../lib/wallets/metamask';
import { colors } from '../../lib/colors';

export const MetaMaskTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connection, setConnection] = useState<any>(null);
  const [evmBalance, setEvmBalance] = useState<string>('0');
  const [cosmosBalance, setCosmosBalance] = useState<{ denom: string; amount: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    // Check if already connected
    const existingConnection = metamaskWallet.getConnection();
    if (existingConnection) {
      setIsConnected(true);
      setConnection(existingConnection);
      loadWalletData();
    }

    // Set network info
    setNetworkInfo(metamaskWallet.getNetworkInfo());

    // Listen for account changes
    const unsubscribe = metamaskWallet.onAccountChange((addresses) => {
      if (addresses) {
        setConnection(metamaskWallet.getConnection());
        loadWalletData();
      } else {
        handleDisconnect();
      }
    });

    return unsubscribe;
  }, []);

  const loadWalletData = async () => {
    try {
      const [evmBal, cosmosBal] = await Promise.all([
        metamaskWallet.getEvmBalance(),
        metamaskWallet.getCosmosBalance()
      ]);
      
      setEvmBalance(evmBal);
      setCosmosBalance(cosmosBal);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load wallet data');
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const newConnection = await metamaskWallet.connect();
      setIsConnected(true);
      setConnection(newConnection);
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
      await metamaskWallet.disconnect();
      setIsConnected(false);
      setConnection(null);
      setEvmBalance('0');
      setCosmosBalance([]);
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

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    // You could add a toast notification here
  };

  const formatCosmosBalance = (amount: string, denom: string) => {
    if (denom === 'usei') {
      return `${(parseInt(amount) / 1000000).toFixed(6)} SEI`;
    }
    return `${amount} ${denom}`;
  };

  const openEvmExplorer = () => {
    if (connection && networkInfo) {
      window.open(`${networkInfo.evmExplorer}/address/${connection.evmAddress}`, '_blank');
    }
  };

  const openCosmosExplorer = () => {
    if (connection && networkInfo) {
      window.open(`${networkInfo.cosmosExplorer}/account/${connection.cosmosAddress}`, '_blank');
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await metamaskWallet.switchToSeiNetwork();
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to switch network');
    }
  };

  const handleSendEvmTransaction = async () => {
    const recipientInput = document.getElementById('evmRecipient') as HTMLInputElement;
    const amountInput = document.getElementById('evmAmount') as HTMLInputElement;
    
    const recipient = recipientInput?.value;
    const amount = amountInput?.value;

    if (!recipient || !amount) {
      setError('Please enter recipient address and amount');
      return;
    }

    if (!metamaskWallet.constructor.isValidEvmAddress(recipient)) {
      setError('Invalid EVM address format');
      return;
    }

    try {
      setError(null);
      const txHash = await metamaskWallet.sendEvmTransaction(recipient, amount);
      console.log('Transaction sent:', txHash);
      
      // Clear inputs
      if (recipientInput) recipientInput.value = '';
      if (amountInput) amountInput.value = '';
      
      // Refresh balance
      setTimeout(loadWalletData, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Transaction failed');
    }
  };

  const handleTestConnection = async () => {
    try {
      setError(null);
      const networkInfo = metamaskWallet.getNetworkInfo();
      console.log('Network info:', networkInfo);
      
      if (connection) {
        console.log('Connection details:', {
          evmAddress: connection.evmAddress,
          cosmosAddress: connection.cosmosAddress,
          isValidEvm: metamaskWallet.constructor.isValidEvmAddress(connection.evmAddress),
          isValidCosmos: metamaskWallet.constructor.isValidCosmosAddress(connection.cosmosAddress)
        });
      }
      
      alert('Connection test completed! Check console for details.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection test failed');
    }
  };

  const handleTestSigning = async () => {
    if (!connection) return;
    
    try {
      setError(null);
      const message = `Test message signing for SeiMoney at ${new Date().toISOString()}`;
      
      // Request signature from MetaMask
      const signature = await (window as any).ethereum.request({
        method: 'personal_sign',
        params: [message, connection.evmAddress]
      });
      
      console.log('Message signed:', { message, signature });
      alert('Message signing test completed! Check console for details.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Message signing failed');
    }
  };

  const handleTestNetworkSwitch = async () => {
    try {
      setError(null);
      await metamaskWallet.switchToSeiNetwork();
      await updateNetworkInfo();
      alert('Network switch test completed!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network switch test failed');
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <NeonText size="xl" color="orange" className="mb-4">
            MetaMask Wallet Integration Test
          </NeonText>
          <p className="text-gray-400">
            Test the real MetaMask wallet connection with Sei Network support
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">MetaMask Installed</p>
              <div className="flex items-center">
                {metamaskWallet.isInstalled() ? (
                  <CheckCircle className="text-green-400 mr-2" size={16} />
                ) : (
                  <AlertCircle className="text-red-400 mr-2" size={16} />
                )}
                <span className={metamaskWallet.isInstalled() ? 'text-green-400' : 'text-red-400'}>
                  {metamaskWallet.isInstalled() ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">EVM Network</p>
              <p className="text-white text-sm">
                {networkInfo ? networkInfo.evmChainName : 'Loading...'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Cosmos Network</p>
              <p className="text-white text-sm">
                {networkInfo ? networkInfo.cosmosChainName : 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            {!isConnected ? (
              <NeonButton
                color="orange"
                onClick={handleConnect}
                disabled={isConnecting || !metamaskWallet.isInstalled()}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  'Connect MetaMask'
                )}
              </NeonButton>
            ) : (
              <>
                <NeonButton color="green" onClick={handleRefresh}>
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </NeonButton>
                <NeonButton variant="outline" color="blue" onClick={handleSwitchNetwork}>
                  <Globe size={16} className="mr-2" />
                  Switch Network
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
        {isConnected && connection && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EVM Account Info */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Layers className="mr-2" size={20} />
                EVM Account (Ethereum-Compatible)
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">EVM Address</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-black/30 px-2 py-1 rounded text-orange-400 flex-1 break-all">
                      {connection.evmAddress}
                    </code>
                    <button
                      onClick={() => copyAddress(connection.evmAddress)}
                      className="p-2 hover:bg-white/10 rounded transition-colors"
                      title="Copy EVM address"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={openEvmExplorer}
                      className="p-2 hover:bg-white/10 rounded transition-colors"
                      title="View in EVM explorer"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">EVM Balance</p>
                  <div className="p-3 bg-black/20 rounded">
                    <span className="text-white font-mono text-lg">
                      {evmBalance} SEI
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Valid EVM Address</p>
                  <div className="flex items-center">
                    {metamaskWallet.constructor.isValidEvmAddress(connection.evmAddress) ? (
                      <CheckCircle className="text-green-400 mr-2" size={16} />
                    ) : (
                      <AlertCircle className="text-red-400 mr-2" size={16} />
                    )}
                    <span className={metamaskWallet.constructor.isValidEvmAddress(connection.evmAddress) ? 'text-green-400' : 'text-red-400'}>
                      {metamaskWallet.constructor.isValidEvmAddress(connection.evmAddress) ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Cosmos Account Info */}
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Eye className="mr-2" size={20} />
                Cosmos Account (Sei Native)
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Cosmos Address</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-black/30 px-2 py-1 rounded text-green-400 flex-1 break-all">
                      {connection.cosmosAddress}
                    </code>
                    <button
                      onClick={() => copyAddress(connection.cosmosAddress)}
                      className="p-2 hover:bg-white/10 rounded transition-colors"
                      title="Copy Cosmos address"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={openCosmosExplorer}
                      className="p-2 hover:bg-white/10 rounded transition-colors"
                      title="View in Cosmos explorer"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Cosmos Balance</p>
                  <div className="space-y-2">
                    {cosmosBalance.length > 0 ? (
                      cosmosBalance.map((coin, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-black/20 rounded">
                          <span className="text-gray-400">{coin.denom.toUpperCase()}</span>
                          <span className="text-white font-mono">
                            {formatCosmosBalance(coin.amount, coin.denom)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-400">No Cosmos balance found</p>
                        <p className="text-sm text-gray-500 mt-1">
                          This account may not have any Cosmos tokens yet
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Valid Cosmos Address</p>
                  <div className="flex items-center">
                    {metamaskWallet.constructor.isValidCosmosAddress(connection.cosmosAddress) ? (
                      <CheckCircle className="text-green-400 mr-2" size={16} />
                    ) : (
                      <AlertCircle className="text-red-400 mr-2" size={16} />
                    )}
                    <span className={metamaskWallet.constructor.isValidCosmosAddress(connection.cosmosAddress) ? 'text-green-400' : 'text-red-400'}>
                      {metamaskWallet.constructor.isValidCosmosAddress(connection.cosmosAddress) ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Network Information */}
        {networkInfo && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Network Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* EVM Network */}
              <div>
                <h4 className="text-md font-medium text-orange-400 mb-3">EVM Network</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chain ID:</span>
                    <span className="text-white font-mono">{networkInfo.evmChainId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{networkInfo.evmChainName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">RPC:</span>
                    <span className="text-white text-sm break-all">{networkInfo.evmRpcUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Explorer:</span>
                    <span className="text-white text-sm break-all">{networkInfo.evmExplorer}</span>
                  </div>
                </div>
              </div>

              {/* Cosmos Network */}
              <div>
                <h4 className="text-md font-medium text-green-400 mb-3">Cosmos Network</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chain ID:</span>
                    <span className="text-white font-mono">{networkInfo.cosmosChainId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{networkInfo.cosmosChainName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">RPC:</span>
                    <span className="text-white text-sm break-all">{networkInfo.cosmosRpcUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Explorer:</span>
                    <span className="text-white text-sm break-all">{networkInfo.cosmosExplorer}</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Transaction Testing */}
        {isConnected && connection && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Send className="mr-2" size={20} />
              Transaction Testing
            </h3>
            
            <div className="space-y-6">
              {/* EVM Transaction Test */}
              <div>
                <h4 className="text-md font-medium text-orange-400 mb-3">EVM Transaction (Ethereum-Compatible)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Recipient EVM Address (0x...)"
                    className="px-3 py-2 bg-black/30 border border-gray-600 rounded text-white placeholder-gray-400"
                    id="evmRecipient"
                  />
                  <input
                    type="number"
                    placeholder="Amount in SEI"
                    step="0.000001"
                    className="px-3 py-2 bg-black/30 border border-gray-600 rounded text-white placeholder-gray-400"
                    id="evmAmount"
                  />
                  <NeonButton color="orange" onClick={handleSendEvmTransaction}>
                    Send EVM Transaction
                  </NeonButton>
                </div>
              </div>

              {/* Test Buttons */}
              <div>
                <h4 className="text-md font-medium text-green-400 mb-3">Quick Tests</h4>
                <div className="flex flex-wrap gap-3">
                  <NeonButton variant="outline" color="blue" onClick={handleTestConnection}>
                    Test Connection
                  </NeonButton>
                  <NeonButton variant="outline" color="purple" onClick={handleTestSigning}>
                    Test Message Signing
                  </NeonButton>
                  <NeonButton variant="outline" color="green" onClick={handleTestNetworkSwitch}>
                    Test Network Switch
                  </NeonButton>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Instructions */}
        {!metamaskWallet.isInstalled() && (
          <GlassCard className="p-6 border-yellow-500/50">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Install MetaMask Wallet</h3>
            <p className="text-gray-300 mb-4">
              To test the MetaMask integration, you need to install the MetaMask browser extension.
            </p>
            <div className="space-y-3">
              <a
                href="https://metamask.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg hover:bg-yellow-500/30 transition-colors"
              >
                <ExternalLink size={16} />
                <span>Install MetaMask</span>
              </a>
              <div className="text-sm text-gray-400">
                <p>After installing MetaMask:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Create or import a wallet</li>
                  <li>Get some test SEI tokens from the faucet</li>
                  <li>Return here to test the integration</li>
                </ol>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Helpful Links */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Helpful Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://seitrace.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-3 bg-black/20 rounded hover:bg-black/30 transition-colors"
            >
              <ExternalLink size={16} />
              <span>Sei Explorer</span>
            </a>
            <a
              href="https://faucet.sei.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-3 bg-black/20 rounded hover:bg-black/30 transition-colors"
            >
              <ExternalLink size={16} />
              <span>Sei Testnet Faucet</span>
            </a>
            <a
              href="https://docs.sei.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-3 bg-black/20 rounded hover:bg-black/30 transition-colors"
            >
              <ExternalLink size={16} />
              <span>Sei Documentation</span>
            </a>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-3 bg-black/20 rounded hover:bg-black/30 transition-colors"
            >
              <ExternalLink size={16} />
              <span>Download MetaMask</span>
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};