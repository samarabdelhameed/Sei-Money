import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { NeonText } from './NeonText';
import { colors } from '../../lib/colors';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (provider: 'metamask') => Promise<void>;
  isLoading: boolean;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  isLoading
}) => {
  const wallets = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect your Ethereum wallet to Sei Network with full Cosmos support',
      icon: '🦊',
      color: 'orange',
      url: 'https://metamask.io/',
      installed: typeof window !== 'undefined' && !!window.ethereum
    }
  ];

  const handleConnect = async (provider: 'metamask') => {
    try {
      await onConnect(provider);
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
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
            className="w-full max-w-md"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <NeonText size="lg" color="green">Connect Wallet</NeonText>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ color: colors.textMuted }}
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
                Choose your preferred wallet to connect to SeiMoney
              </p>

              <div className="space-y-3">
                {wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      wallet.installed ? 'cursor-pointer hover:bg-white/10' : 'opacity-60'
                    }`}
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: wallet.installed ? colors.glassBorder : colors.textFaded,
                    }}
                    onClick={() => wallet.installed && handleConnect(wallet.id as 'metamask')}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{wallet.icon}</div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{wallet.name}</h3>
                        <p className="text-sm" style={{ color: colors.textMuted }}>
                          {wallet.description}
                        </p>
                      </div>

                      {wallet.installed ? (
                        <NeonButton
                          size="sm"
                          color={wallet.color as 'green' | 'purple' | 'blue'}
                          disabled={isLoading}
                          onClick={() => handleConnect(wallet.id as 'metamask')}
                        >
                          {isLoading ? 'Connecting...' : 'Connect'}
                        </NeonButton>
                      ) : (
                        <div className="flex space-x-2">
                          <a
                            href={wallet.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            style={{ color: colors.textMuted }}
                          >
                            <Download size={16} />
                          </a>
                          <a
                            href={wallet.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            style={{ color: colors.textMuted }}
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.glassBorder }}>
                <p className="text-xs text-center" style={{ color: colors.textMuted }}>
                  By connecting your wallet, you agree to our{' '}
                  <a href="#" className="underline hover:text-white">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="underline hover:text-white">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
