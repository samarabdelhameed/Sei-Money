import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  X, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { NeonText } from './NeonText';
import { LoadingSpinner } from './LoadingSpinner';
import { useApp } from '../../contexts/AppContext';
import { colors } from '../../lib/colors';

interface WalletConnectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({
  isOpen,
  onClose
}) => {
  const { state, actions } = useApp();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'select' | 'connecting' | 'success' | 'error'>('select');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<'metamask' | 'keplr' | 'leap' | null>(null);

  // Check wallet availability
  const [walletStatus, setWalletStatus] = useState({
    metamask: false,
    keplr: false,
    leap: false
  });

  useEffect(() => {
    // Check wallet availability on mount
    setWalletStatus({
      metamask: typeof window !== 'undefined' && !!window.ethereum,
      keplr: typeof window !== 'undefined' && !!window.keplr,
      leap: typeof window !== 'undefined' && !!window.leap
    });
  }, []);

  const handleWalletSelect = async (wallet: 'metamask' | 'keplr' | 'leap') => {
    setSelectedWallet(wallet);
    setConnectionStep('connecting');
    setIsConnecting(true);
    setErrorMessage('');

    try {
      await actions.connectWallet(wallet);
      setConnectionStep('success');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        setConnectionStep('select');
        setIsConnecting(false);
      }, 2000);
      
    } catch (error) {
      setConnectionStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
      setIsConnecting(false);
    }
  };

  const handleRetry = () => {
    setConnectionStep('select');
    setErrorMessage('');
    setSelectedWallet(null);
  };

  const handleClose = () => {
    if (connectionStep === 'connecting') return; // Prevent closing while connecting
    onClose();
    setConnectionStep('select');
    setErrorMessage('');
    setSelectedWallet(null);
    setIsConnecting(false);
  };

  const getWalletInfo = (wallet: 'metamask' | 'keplr' | 'leap') => {
    switch (wallet) {
      case 'metamask':
        return {
          name: 'MetaMask',
          description: 'Connect your Ethereum wallet to Sei Network with full Cosmos support',
          icon: '🦊',
          color: 'orange',
          url: 'https://metamask.io/',
          isAvailable: walletStatus.metamask,
          features: ['Full Cosmos Support', 'Sei Network Ready', 'Professional Integration']
        };
      case 'keplr':
        return {
          name: 'Keplr Wallet',
          description: 'Native Cosmos wallet with advanced features',
          icon: '🟣',
          color: 'purple',
          url: 'https://www.keplr.app/',
          isAvailable: walletStatus.keplr,
          features: ['Native Cosmos', 'Advanced features', 'Best performance']
        };
      case 'leap':
        return {
          name: 'Leap Wallet',
          description: 'Modern Cosmos wallet with beautiful UI',
          icon: '🔵',
          color: 'blue',
          url: 'https://leapwallet.io/',
          isAvailable: walletStatus.leap,
          features: ['Modern UI', 'Mobile first', 'Cross-platform']
        };
    }
  };

  const renderWalletOption = (wallet: 'metamask' | 'keplr' | 'leap') => {
    const info = getWalletInfo(wallet);
    if (!info) return null;

    return (
      <motion.div
        key={wallet}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: wallet === 'metamask' ? 0 : wallet === 'keplr' ? 0.1 : 0.2 }}
        className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
          info.isAvailable 
            ? 'hover:bg-white/10 hover:scale-105' 
            : 'opacity-60 cursor-not-allowed'
        }`}
        style={{
          backgroundColor: colors.glass,
          borderColor: info.isAvailable ? colors.glassBorder : colors.textFaded,
        }}
        onClick={() => info.isAvailable && handleWalletSelect(wallet)}
      >
        <div className="flex items-start space-x-4">
          <div className="text-4xl">{info.icon}</div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-white">{info.name}</h3>
              {info.isAvailable ? (
                <CheckCircle size={16} className="text-green-400" />
              ) : (
                <AlertCircle size={16} className="text-gray-400" />
              )}
            </div>
            
            <p className="text-sm mb-3" style={{ color: colors.textMuted }}>
              {info.description}
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-2 mb-3">
              {info.features.map((feature, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: `${colors.neonGreen}20`,
                    color: colors.neonGreen,
                    border: `1px solid ${colors.neonGreen}40`
                  }}
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {info.isAvailable ? (
                <NeonButton
                  size="sm"
                  color={info.color as 'green' | 'purple' | 'blue' | 'orange'}
                  disabled={isConnecting}
                  onClick={() => handleWalletSelect(wallet)}
                >
                  {isConnecting && selectedWallet === wallet ? (
                    <>
                      <RefreshCw size={14} className="animate-spin mr-2" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </NeonButton>
              ) : (
                <>
                  <a
                    href={info.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors hover:bg-white/10"
                    style={{ borderColor: colors.glassBorder }}
                  >
                    <Download size={14} />
                    <span className="text-sm">Install</span>
                  </a>
                  <a
                    href={info.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors hover:bg-white/10"
                    style={{ borderColor: colors.glassBorder }}
                  >
                    <ExternalLink size={14} />
                    <span className="text-sm">Learn More</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderContent = () => {
    switch (connectionStep) {
      case 'select':
        return (
          <>
            <div className="flex items-center justify-between mb-6">
              <NeonText size="lg" color="green">Connect Your Wallet</NeonText>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                style={{ color: colors.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
              Choose your preferred wallet to connect to SeiMoney. We support multiple wallet types for your convenience.
            </p>

            <div className="space-y-4">
              {renderWalletOption('keplr')}
              {renderWalletOption('metamask')}
            </div>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.glassBorder }}>
              <p className="text-xs text-center" style={{ color: colors.textMuted }}>
                By connecting your wallet, you agree to our{' '}
                <a href="#" className="underline hover:text-white">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="underline hover:text-white">Privacy Policy</a>
              </p>
            </div>
          </>
        );

      case 'connecting':
        return (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" color="green" text="Connecting to wallet..." />
            <p className="mt-4 text-sm" style={{ color: colors.textMuted }}>
              Please approve the connection in your wallet
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${colors.neonGreen}20` }}>
              <CheckCircle size={40} style={{ color: colors.neonGreen }} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Wallet Connected!</h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Your wallet has been successfully connected to SeiMoney
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${colors.error}20` }}>
              <AlertCircle size={40} style={{ color: colors.error }} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Connection Failed</h3>
            <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
              {errorMessage}
            </p>
            <div className="flex space-x-3 justify-center">
              <NeonButton color="green" onClick={handleRetry}>
                Try Again
              </NeonButton>
              <NeonButton variant="outline" color="purple" onClick={handleClose}>
                Close
              </NeonButton>
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl"
          >
            <GlassCard className="p-6">
              {renderContent()}
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
