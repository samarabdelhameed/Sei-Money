import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, CheckCircle, AlertCircle, X } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { colors } from '../../lib/colors';

interface SeiNetworkGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SeiNetworkGuide: React.FC<SeiNetworkGuideProps> = ({ isOpen, onClose }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const networkConfig = {
    chainName: 'Sei Network',
    chainId: '0x531', // 1329 in decimal
    rpcUrl: 'https://evm-rpc.sei-apis.com',
    blockExplorer: 'https://seitrace.com',
    symbol: 'SEI',
    decimals: 18
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const addNetworkAutomatically = async () => {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        alert('MetaMask not detected. Please install MetaMask first.');
        return;
      }

      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: networkConfig.chainId,
          chainName: networkConfig.chainName,
          nativeCurrency: {
            name: 'SEI',
            symbol: networkConfig.symbol,
            decimals: networkConfig.decimals,
          },
          rpcUrls: [networkConfig.rpcUrl],
          blockExplorerUrls: [networkConfig.blockExplorer],
          iconUrls: ['https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png']
        }]
      });

      alert('✅ Sei Network added successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to add network:', error);
      alert('❌ Failed to add network automatically. Please add manually using the details below.');
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: colors.gradientNeon }}
              >
                <img 
                  src="https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png" 
                  alt="Sei" 
                  className="w-8 h-8"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Add Sei Network to MetaMask</h2>
                <p className="text-gray-400">Connect to the Sei blockchain</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Automatic Addition */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="text-green-400" size={20} />
              <h3 className="text-lg font-semibold text-white">Option 1: Automatic Setup</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Click the button below to automatically add Sei Network to your MetaMask wallet.
            </p>
            <NeonButton 
              color="green" 
              onClick={addNetworkAutomatically}
              className="w-full"
            >
              Add Sei Network Automatically
            </NeonButton>
          </div>

          {/* Manual Addition */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="text-yellow-400" size={20} />
              <h3 className="text-lg font-semibold text-white">Option 2: Manual Setup</h3>
            </div>
            <p className="text-gray-400 mb-4">
              If automatic setup doesn't work, you can add the network manually using these details:
            </p>

            <div className="space-y-4">
              {[
                { label: 'Network Name', value: networkConfig.chainName, field: 'name' },
                { label: 'New RPC URL', value: networkConfig.rpcUrl, field: 'rpc' },
                { label: 'Chain ID', value: networkConfig.chainId, field: 'chainId' },
                { label: 'Currency Symbol', value: networkConfig.symbol, field: 'symbol' },
                { label: 'Block Explorer URL', value: networkConfig.blockExplorer, field: 'explorer' },
              ].map(({ label, value, field }) => (
                <div key={field} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder }}>
                  <div>
                    <div className="text-sm text-gray-400">{label}</div>
                    <div className="text-white font-mono text-sm">{value}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(value, field)}
                    className="flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
                  >
                    {copiedField === field ? (
                      <>
                        <CheckCircle size={16} className="text-green-400" />
                        <span className="text-green-400 text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="text-gray-400" />
                        <span className="text-gray-400 text-sm">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Steps */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">Manual Setup Steps:</h4>
            <ol className="space-y-3 text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>Open MetaMask and click on the network dropdown (usually shows "Ethereum Mainnet")</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>Click "Add Network" or "Custom RPC"</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>Fill in the network details using the values above (copy each field)</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <span>Click "Save" to add the network</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                <span>Switch to the Sei Network and try connecting again</span>
              </li>
            </ol>
          </div>

          {/* Additional Resources */}
          <div className="border-t pt-6" style={{ borderColor: colors.glassBorder }}>
            <h4 className="text-lg font-semibold text-white mb-4">Need Help?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://docs.sei.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 p-3 rounded-lg border transition-colors hover:bg-white hover:bg-opacity-5"
                style={{ borderColor: colors.glassBorder }}
              >
                <ExternalLink size={16} className="text-blue-400" />
                <span className="text-white">Sei Documentation</span>
              </a>
              <a
                href="https://seitrace.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 p-3 rounded-lg border transition-colors hover:bg-white hover:bg-opacity-5"
                style={{ borderColor: colors.glassBorder }}
              >
                <ExternalLink size={16} className="text-green-400" />
                <span className="text-white">Sei Explorer</span>
              </a>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <NeonButton variant="outline" color="gray" onClick={onClose}>
              Close
            </NeonButton>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};