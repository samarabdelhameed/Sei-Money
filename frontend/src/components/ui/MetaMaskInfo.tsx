import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, RefreshCw, Wallet, Shield, Network } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { NeonText } from './NeonText';
import { colors } from '../../lib/colors';

interface MetaMaskInfoProps {
  walletData: {
    ethAddress: string;
    cosmosAddress: string;
    publicKey: Uint8Array;
  };
  onRefresh: () => void;
}

export const MetaMaskInfo: React.FC<MetaMaskInfoProps> = ({ walletData, onRefresh }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatAddress = (address: string, prefix: string) => {
    if (address.length <= 20) return address;
    return `${prefix}${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatPublicKey = (publicKey: Uint8Array) => {
    const hex = Array.from(publicKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `${hex.slice(0, 16)}...${hex.slice(-16)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">MetaMask Connected</h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              Successfully connected to Sei Network
            </p>
          </div>
        </div>
        
        <NeonButton
          size="sm"
          color="orange"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </NeonButton>
      </div>

      {/* Wallet Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ethereum Address */}
        <GlassCard className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <Network size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium text-white">Ethereum Address</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-sm bg-black/20 px-3 py-2 rounded-lg font-mono">
              {formatAddress(walletData.ethAddress, '0x')}
            </code>
            <button
              onClick={() => copyToClipboard(walletData.ethAddress, 'eth')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Copy address"
            >
              <Copy size={16} style={{ color: copiedField === 'eth' ? colors.neonGreen : colors.textMuted }} />
            </button>
          </div>
          
          <div className="mt-2 flex items-center space-x-2">
            <a
              href={`https://testnet.sei.io/account/${walletData.ethAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs hover:text-white transition-colors"
              style={{ color: colors.textMuted }}
            >
              <ExternalLink size={12} />
              <span>View on Explorer</span>
            </a>
          </div>
        </GlassCard>

        {/* Cosmos Address */}
        <GlassCard className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium text-white">Cosmos Address</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-sm bg-black/20 px-3 py-2 rounded-lg font-mono">
              {formatAddress(walletData.cosmosAddress, 'sei')}
            </code>
            <button
              onClick={() => copyToClipboard(walletData.cosmosAddress, 'cosmos')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Copy address"
            >
              <Copy size={16} style={{ color: copiedField === 'cosmos' ? colors.neonGreen : colors.textMuted }} />
            </button>
          </div>
          
          <div className="mt-2 flex items-center space-x-2">
            <a
              href={`https://testnet.sei.io/account/${walletData.cosmosAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs hover:text-white transition-colors"
              style={{ color: colors.textMuted }}
            >
              <ExternalLink size={12} />
              <span>View on Explorer</span>
            </a>
          </div>
        </GlassCard>
      </div>

      {/* Public Key */}
      <GlassCard className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <span className="text-sm font-medium text-white">Public Key</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <code className="flex-1 text-sm bg-black/20 px-3 py-2 rounded-lg font-mono">
            {formatPublicKey(walletData.publicKey)}
          </code>
          <button
            onClick={() => copyToClipboard(formatPublicKey(walletData.publicKey), 'publicKey')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Copy public key"
          >
            <Copy size={16} style={{ color: copiedField === 'publicKey' ? colors.neonGreen : colors.textMuted }} />
          </button>
        </div>
        
        <p className="text-xs mt-2" style={{ color: colors.textMuted }}>
          This public key is used for transaction signing and verification
        </p>
      </GlassCard>

      {/* Network Status */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <div>
              <h4 className="text-sm font-medium text-white">Network Status</h4>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                Connected to Sei Testnet (atlantic-2)
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-white">Chain ID</div>
            <div className="text-xs" style={{ color: colors.textMuted }}>26 (0x1A)</div>
          </div>
        </div>
      </GlassCard>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-4"
      >
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full" style={{ backgroundColor: `${colors.neonGreen}20`, border: `1px solid ${colors.neonGreen}40` }}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-sm" style={{ color: colors.neonGreen }}>
            MetaMask successfully integrated with Sei Network!
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
