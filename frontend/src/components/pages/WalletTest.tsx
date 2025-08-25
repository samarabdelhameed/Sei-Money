import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { MetaMaskConnector } from '../wallet/MetaMaskConnector';
import { colors } from '../../lib/colors';
import { apiService } from '../../lib/api';

export const WalletTest: React.FC = () => {
  const [connectedWallet, setConnectedWallet] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const handleWalletConnect = (wallet: any) => {
    setConnectedWallet(wallet);
    addTestResult('Wallet Connected', 'success', `Connected to ${wallet.address}`);
  };

  const handleWalletDisconnect = () => {
    setConnectedWallet(null);
    addTestResult('Wallet Disconnected', 'info', 'Wallet disconnected successfully');
  };

  const addTestResult = (test: string, status: 'success' | 'error' | 'info', message: string) => {
    const result = {
      id: Date.now(),
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev]);
  };

  const runApiTests = async () => {
    if (!connectedWallet) {
      addTestResult('API Tests', 'error', 'No wallet connected');
      return;
    }

    setIsRunningTests(true);
    
    try {
      // Test 1: Get wallet session
      addTestResult('Session Test', 'info', 'Testing wallet session...');
      try {
        const sessionResponse = await apiService.apiClient.get('/api/v1/wallet/session');
        addTestResult('Session Test', 'success', `Session active: ${sessionResponse.session?.userId}`);
      } catch (error: any) {
        addTestResult('Session Test', 'error', error.message);
      }

      // Test 2: Get wallet balance
      addTestResult('Balance Test', 'info', 'Testing balance retrieval...');
      try {
        const balanceResponse = await apiService.apiClient.get(`/api/v1/wallet/balance/${connectedWallet.address}`);
        addTestResult('Balance Test', 'success', `Balance: ${balanceResponse.balance?.formatted}`);
      } catch (error: any) {
        addTestResult('Balance Test', 'error', error.message);
      }

      // Test 3: Get supported wallets
      addTestResult('Supported Wallets', 'info', 'Testing supported wallets endpoint...');
      try {
        const walletsResponse = await apiService.apiClient.get('/api/v1/wallet/supported');
        addTestResult('Supported Wallets', 'success', `Found ${walletsResponse.wallets?.length} supported wallets`);
      } catch (error: any) {
        addTestResult('Supported Wallets', 'error', error.message);
      }

      // Test 4: Test transaction signing preparation
      addTestResult('Sign Test', 'info', 'Testing transaction signing...');
      try {
        const mockTransaction = {
          type: 'transfer',
          to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          amount: '0.001',
          data: 'Test transaction'
        };
        
        const signResponse = await apiService.apiClient.post('/api/v1/wallet/sign', {
          transaction: mockTransaction,
          walletAddress: connectedWallet.address
        });
        
        addTestResult('Sign Test', 'success', `Transaction prepared: ${signResponse.signingData?.transactionId}`);
      } catch (error: any) {
        addTestResult('Sign Test', 'error', error.message);
      }

    } catch (error: any) {
      addTestResult('API Tests', 'error', `Test suite failed: ${error.message}`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <TestTube size={16} className="text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center space-x-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: colors.gradientGreen }}
          >
            <TestTube size={24} className="text-white" />
          </div>
          <NeonText size="2xl" color="green" glow>
            Wallet Test Suite
          </NeonText>
        </div>
        <p className="text-lg" style={{ color: colors.textMuted }}>
          Test MetaMask integration and wallet API endpoints
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wallet Connection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <Wallet size={20} />
              <span>Wallet Connection</span>
            </h2>
            
            <MetaMaskConnector
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
            />

            {connectedWallet && (
              <GlassCard className="p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Connected Wallet Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: colors.textMuted }}>Provider:</span>
                    <span className="text-white">{connectedWallet.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.textMuted }}>Address:</span>
                    <span className="text-white font-mono">{connectedWallet.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.textMuted }}>Network:</span>
                    <span className="text-white">{connectedWallet.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: colors.textMuted }}>Balance:</span>
                    <span className="text-white">{connectedWallet.balance?.toFixed(4)} SEI</span>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </motion.div>

        {/* Test Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <TestTube size={20} />
                <span>API Tests</span>
              </h2>
              
              <div className="flex space-x-2">
                <NeonButton
                  size="sm"
                  color="green"
                  onClick={runApiTests}
                  disabled={!connectedWallet || isRunningTests}
                >
                  {isRunningTests ? 'Running...' : 'Run Tests'}
                </NeonButton>
                
                <NeonButton
                  size="sm"
                  variant="outline"
                  color="purple"
                  onClick={clearResults}
                  disabled={testResults.length === 0}
                >
                  Clear
                </NeonButton>
              </div>
            </div>

            <GlassCard className="p-4 h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <TestTube size={48} className="mx-auto mb-4" style={{ color: colors.textMuted }} />
                    <p style={{ color: colors.textMuted }}>
                      Connect your wallet and run tests to see results
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result) => (
                    <motion.div
                      key={result.id}
                      className="p-3 rounded-lg border"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder
                      }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium ${getStatusColor(result.status)}`}>
                              {result.test}
                            </h4>
                            <span className="text-xs" style={{ color: colors.textMuted }}>
                              {result.timestamp}
                            </span>
                          </div>
                          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                            {result.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </motion.div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Testing Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-2">1. Connect MetaMask</h4>
              <ul className="text-sm space-y-1" style={{ color: colors.textMuted }}>
                <li>• Make sure MetaMask is installed</li>
                <li>• Click "Connect MetaMask" button</li>
                <li>• Approve the connection request</li>
                <li>• Sign the verification message</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-2">2. Run API Tests</h4>
              <ul className="text-sm space-y-1" style={{ color: colors.textMuted }}>
                <li>• Click "Run Tests" to test all endpoints</li>
                <li>• Check session management</li>
                <li>• Test balance retrieval</li>
                <li>• Test transaction signing</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: colors.glass }}>
            <div className="flex items-start space-x-2">
              <AlertCircle size={16} className="text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-400 font-medium">Note:</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  This is a development test environment. Make sure your backend is running on localhost:3001 
                  and that CORS is properly configured for testing.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};