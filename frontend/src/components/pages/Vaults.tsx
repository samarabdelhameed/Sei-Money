import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { colors } from '../../lib/colors';
import { 
  Shield, 
  Lock, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Download,
  Upload,
  Trash2,
  Settings,
  Key,
  FileText,
  Image,
  Video,
  Music
} from 'lucide-react';

interface VaultItem {
  id: string;
  name: string;
  type: 'password' | 'document' | 'image' | 'video' | 'audio' | 'other';
  size?: string;
  lastModified: string;
  encrypted: boolean;
}

interface Vault {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  totalSize: string;
  createdAt: string;
  items: VaultItem[];
}

const mockVaults: Vault[] = [
  {
    id: '1',
    name: 'Personal Documents',
    description: 'Important personal files and documents',
    itemCount: 12,
    totalSize: '45.2 MB',
    createdAt: '2024-01-15',
    items: [
      { id: '1', name: 'Passport.pdf', type: 'document', size: '2.1 MB', lastModified: '2024-01-20', encrypted: true },
      { id: '2', name: 'Bank_Statement.pdf', type: 'document', size: '1.8 MB', lastModified: '2024-01-18', encrypted: true },
      { id: '3', name: 'ID_Card.jpg', type: 'image', size: '0.5 MB', lastModified: '2024-01-15', encrypted: true },
    ]
  },
  {
    id: '2',
    name: 'Crypto Keys',
    description: 'Cryptocurrency wallet keys and recovery phrases',
    itemCount: 8,
    totalSize: '2.1 KB',
    createdAt: '2024-01-10',
    items: [
      { id: '4', name: 'BTC_Wallet_Key', type: 'password', lastModified: '2024-01-22', encrypted: true },
      { id: '5', name: 'ETH_Recovery_Phrase', type: 'password', lastModified: '2024-01-20', encrypted: true },
      { id: '6', name: 'Wallet_Backup.json', type: 'document', size: '1.2 KB', lastModified: '2024-01-15', encrypted: true },
    ]
  },
  {
    id: '3',
    name: 'Media Vault',
    description: 'Private photos and videos',
    itemCount: 25,
    totalSize: '1.2 GB',
    createdAt: '2024-01-05',
    items: [
      { id: '7', name: 'Family_Photo.jpg', type: 'image', size: '3.2 MB', lastModified: '2024-01-25', encrypted: true },
      { id: '8', name: 'Vacation_Video.mp4', type: 'video', size: '125 MB', lastModified: '2024-01-23', encrypted: true },
    ]
  }
];

export const Vaults: React.FC = () => {
  const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
  const [showCreateVault, setShowCreateVault] = useState(false);
  const [newVaultName, setNewVaultName] = useState('');
  const [newVaultDescription, setNewVaultDescription] = useState('');
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-5 h-5" />;
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'password': return <Key className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const togglePasswordVisibility = (itemId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleCreateVault = () => {
    if (newVaultName.trim()) {
      // Here you would typically call an API to create the vault
      console.log('Creating vault:', { name: newVaultName, description: newVaultDescription });
      setShowCreateVault(false);
      setNewVaultName('');
      setNewVaultDescription('');
    }
  };

  if (selectedVault) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedVault(null)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <motion.div
                  whileHover={{ x: -2 }}
                  className="text-white"
                >
                  ←
                </motion.div>
              </button>
              <div>
                <NeonText className="text-3xl font-bold mb-2">
                  {selectedVault.name}
                </NeonText>
                <p className="text-gray-400">{selectedVault.description}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <NeonButton variant="secondary" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </NeonButton>
              <NeonButton variant="secondary" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </NeonButton>
            </div>
          </div>

          {/* Vault Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <GlassCard className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.neonGreen}20` }}>
                  <FileText className="w-6 h-6" style={{ color: colors.neonGreen }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{selectedVault.itemCount}</p>
                  <p className="text-gray-400">Items</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.neonPurple}20` }}>
                  <Shield className="w-6 h-6" style={{ color: colors.neonPurple }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{selectedVault.totalSize}</p>
                  <p className="text-gray-400">Total Size</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.neonBlue}20` }}>
                  <Lock className="w-6 h-6" style={{ color: colors.neonBlue }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-gray-400">Encrypted</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Vault Items */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Vault Contents</h3>
              <NeonButton size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </NeonButton>
            </div>

            <div className="space-y-3">
              {selectedVault.items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-white/10">
                      {getFileIcon(item.type)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {item.size && <span>{item.size}</span>}
                        <span>Modified: {item.lastModified}</span>
                        {item.encrypted && (
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Encrypted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.type === 'password' && (
                      <button
                        onClick={() => togglePasswordVisibility(item.id)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {showPasswords[item.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <NeonText className="text-4xl font-bold mb-2">
              AI Vaults
            </NeonText>
            <p className="text-xl" style={{ color: colors.textMuted }}>
              Secure, encrypted storage for your most important files
            </p>
          </div>
          <NeonButton onClick={() => setShowCreateVault(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Create Vault
          </NeonButton>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <GlassCard className="p-6 text-center">
            <div className="p-4 rounded-full mx-auto mb-4 w-fit" style={{ backgroundColor: `${colors.neonGreen}20` }}>
              <Shield className="w-8 h-8" style={{ color: colors.neonGreen }} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Military-Grade Encryption</h3>
            <p className="text-gray-400">AES-256 encryption protects your data</p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="p-4 rounded-full mx-auto mb-4 w-fit" style={{ backgroundColor: `${colors.neonPurple}20` }}>
              <Lock className="w-8 h-8" style={{ color: colors.neonPurple }} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Zero-Knowledge Architecture</h3>
            <p className="text-gray-400">Only you can access your data</p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <div className="p-4 rounded-full mx-auto mb-4 w-fit" style={{ backgroundColor: `${colors.neonBlue}20` }}>
              <Key className="w-8 h-8" style={{ color: colors.neonBlue }} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Biometric Access</h3>
            <p className="text-gray-400">Secure access with your fingerprint</p>
          </GlassCard>
        </div>

        {/* Vaults Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockVaults.map((vault) => (
            <motion.div
              key={vault.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard 
                className="p-6 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setSelectedVault(vault)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.neonGreen}20` }}>
                    <Shield className="w-6 h-6" style={{ color: colors.neonGreen }} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Lock className="w-3 h-3" />
                    Encrypted
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">{vault.name}</h3>
                <p className="text-gray-400 mb-4 text-sm">{vault.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Items:</span>
                    <span className="text-white">{vault.itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white">{vault.totalSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{vault.createdAt}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Create Vault Modal */}
        {showCreateVault && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateVault(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold text-white mb-4">Create New Vault</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Vault Name
                    </label>
                    <input
                      type="text"
                      value={newVaultName}
                      onChange={(e) => setNewVaultName(e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
                      placeholder="Enter vault name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newVaultDescription}
                      onChange={(e) => setNewVaultDescription(e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white/40 resize-none"
                      rows={3}
                      placeholder="Enter vault description"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <NeonButton 
                    variant="secondary" 
                    onClick={() => setShowCreateVault(false)}
                    className="flex-1"
                  >
                    Cancel
                  </NeonButton>
                  <NeonButton 
                    onClick={handleCreateVault}
                    className="flex-1"
                  >
                    Create Vault
                  </NeonButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};