import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Search, Star, Crown, Shield, Check, X, Clock, Copy, ExternalLink } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { colors } from '../../lib/colors';

interface Username {
  id: string;
  name: string;
  owner: string;
  price: string;
  status: 'available' | 'owned' | 'auction' | 'reserved';
  category: 'premium' | 'standard' | 'rare';
  registeredAt?: string;
  expiresAt?: string;
  verified?: boolean;
}

const mockUsernames: Username[] = [
  {
    id: '1',
    name: 'crypto.sei',
    owner: 'sei1abc...xyz',
    price: '1,000.00',
    status: 'owned',
    category: 'premium',
    registeredAt: '2024-01-15',
    expiresAt: '2025-01-15',
    verified: true
  },
  {
    id: '2',
    name: 'defi.sei',
    owner: '',
    price: '500.00',
    status: 'available',
    category: 'premium',
  },
  {
    id: '3',
    name: 'trader.sei',
    owner: 'sei1def...abc',
    price: '750.00',
    status: 'auction',
    category: 'standard',
    registeredAt: '2024-02-01',
    expiresAt: '2025-02-01'
  },
  {
    id: '4',
    name: 'moon.sei',
    owner: '',
    price: '250.00',
    status: 'available',
    category: 'standard',
  },
  {
    id: '5',
    name: 'sei.sei',
    owner: 'sei1ghi...def',
    price: '10,000.00',
    status: 'owned',
    category: 'rare',
    registeredAt: '2024-01-01',
    expiresAt: '2025-01-01',
    verified: true
  },
  {
    id: '6',
    name: 'nft.sei',
    owner: '',
    price: '300.00',
    status: 'available',
    category: 'standard',
  }
];

const myUsernames = [
  {
    id: '1',
    name: 'myname.sei',
    registeredAt: '2024-01-20',
    expiresAt: '2025-01-20',
    verified: true,
    status: 'active'
  },
  {
    id: '2',
    name: 'trader123.sei',
    registeredAt: '2024-02-15',
    expiresAt: '2025-02-15',
    verified: false,
    status: 'pending'
  }
];

export const Usernames: React.FC = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'rare': return colors.warning;
      case 'premium': return colors.neonPurple;
      case 'standard': return colors.neonGreen;
      default: return colors.textMuted;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rare': return Crown;
      case 'premium': return Star;
      case 'standard': return User;
      default: return User;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return colors.neonGreen;
      case 'owned': return colors.neonPurple;
      case 'auction': return colors.warning;
      case 'reserved': return colors.textMuted;
      default: return colors.textMuted;
    }
  };

  const filteredUsernames = mockUsernames.filter(username => {
    const matchesSearch = username.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || username.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleRegister = () => {
    if (newUsername.trim()) {
      console.log('Registering username:', newUsername);
      setShowRegisterForm(false);
      setNewUsername('');
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white">
            <NeonText color="purple" glow>Usernames</NeonText>
          </h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>
            Secure your identity on the Sei Network
          </p>
        </div>
        
        <NeonButton 
          color="purple" 
          onClick={() => setShowRegisterForm(true)}
        >
          <User size={20} className="mr-2" />
          Register Username
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <GlassCard glow="purple" className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientPurple }}
            >
              <User size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Total Registered</p>
              <p className="text-xl font-bold text-white">12,847</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard glow="green" className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientGreen }}
            >
              <Star size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Available</p>
              <p className="text-xl font-bold text-white">2,156</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientNeon }}
            >
              <Crown size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Premium</p>
              <p className="text-xl font-bold text-white">342</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.warning}, ${colors.warning}dd)` }}
            >
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>My Usernames</p>
              <p className="text-xl font-bold text-white">{myUsernames.length}</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="flex space-x-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {['browse', 'my-usernames', 'auctions'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
            }`}
            style={{
              backgroundColor: activeTab === tab ? colors.glass : 'transparent',
              border: activeTab === tab ? `1px solid ${colors.glassBorder}` : 'none',
            }}
          >
            {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </button>
        ))}
      </motion.div>

      {activeTab === 'browse' && (
        <>
          {/* Search and Filters */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search usernames..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                style={{
                  backgroundColor: colors.glass,
                  borderColor: colors.glassBorder,
                }}
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-lg border bg-transparent text-white"
              style={{
                backgroundColor: colors.glass,
                borderColor: colors.glassBorder,
              }}
            >
              <option value="all">All Categories</option>
              <option value="rare">Rare</option>
              <option value="premium">Premium</option>
              <option value="standard">Standard</option>
            </select>
          </motion.div>

          {/* Usernames Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {filteredUsernames.map((username, index) => {
              const CategoryIcon = getCategoryIcon(username.category);
              const categoryColor = getCategoryColor(username.category);
              const statusColor = getStatusColor(username.status);
              
              return (
                <motion.div
                  key={username.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
                >
                  <GlassCard 
                    glow={username.category === 'rare' ? 'orange' : 
                          username.category === 'premium' ? 'purple' : 'green'} 
                    className="p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${categoryColor}20` }}
                        >
                          <CategoryIcon size={24} style={{ color: categoryColor }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {username.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${categoryColor}20`, 
                                color: categoryColor 
                              }}
                            >
                              {username.category}
                            </span>
                            {username.verified && (
                              <div className="flex items-center space-x-1">
                                <Shield size={12} style={{ color: colors.neonGreen }} />
                                <span className="text-xs" style={{ color: colors.neonGreen }}>
                                  Verified
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${statusColor}20`, 
                          color: statusColor 
                        }}
                      >
                        {username.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm" style={{ color: colors.textMuted }}>Price</span>
                        <span className="text-lg font-bold" style={{ color: colors.neonGreen }}>
                          {username.price} SEI
                        </span>
                      </div>
                      
                      {username.owner && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: colors.textMuted }}>Owner</span>
                          <span className="text-sm font-mono text-white">
                            {username.owner}
                          </span>
                        </div>
                      )}
                      
                      {username.expiresAt && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: colors.textMuted }}>Expires</span>
                          <span className="text-sm text-white">
                            {new Date(username.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {username.status === 'available' && (
                        <NeonButton 
                          size="sm" 
                          color={username.category === 'rare' ? 'orange' : 
                                 username.category === 'premium' ? 'purple' : 'green'}
                          className="flex-1"
                        >
                          Register
                        </NeonButton>
                      )}
                      {username.status === 'auction' && (
                        <NeonButton 
                          size="sm" 
                          color="orange" 
                          className="flex-1"
                        >
                          Place Bid
                        </NeonButton>
                      )}
                      {username.status === 'owned' && (
                        <NeonButton 
                          size="sm" 
                          variant="outline" 
                          color="purple" 
                          className="flex-1"
                        >
                          Make Offer
                        </NeonButton>
                      )}
                      <NeonButton 
                        size="sm" 
                        variant="outline" 
                        color="green"
                      >
                        Details
                      </NeonButton>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}

      {activeTab === 'my-usernames' && (
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myUsernames.map((username, index) => (
              <motion.div
                key={username.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
              >
                <GlassCard glow="purple" className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ background: colors.gradientPurple }}
                      >
                        <User size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {username.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {username.verified ? (
                            <div className="flex items-center space-x-1">
                              <Check size={12} style={{ color: colors.neonGreen }} />
                              <span className="text-xs" style={{ color: colors.neonGreen }}>
                                Verified
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <Clock size={12} style={{ color: colors.warning }} />
                              <span className="text-xs" style={{ color: colors.warning }}>
                                Pending
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: colors.textMuted }}>Registered</span>
                      <span className="text-sm text-white">
                        {new Date(username.registeredAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: colors.textMuted }}>Expires</span>
                      <span className="text-sm text-white">
                        {new Date(username.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: colors.textMuted }}>Status</span>
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: username.status === 'active' ? `${colors.neonGreen}20` : `${colors.warning}20`,
                          color: username.status === 'active' ? colors.neonGreen : colors.warning
                        }}
                      >
                        {username.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <NeonButton size="sm" color="purple" className="flex-1">
                      Manage
                    </NeonButton>
                    <NeonButton size="sm" variant="outline" color="green">
                      <Copy size={16} />
                    </NeonButton>
                    <NeonButton size="sm" variant="outline" color="green">
                      <ExternalLink size={16} />
                    </NeonButton>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'auctions' && (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="text-6xl mb-4">🔨</div>
          <h3 className="text-2xl font-bold text-white mb-4">Username Auctions</h3>
          <p className="text-lg" style={{ color: colors.textMuted }}>
            Bid on premium usernames in live auctions
          </p>
          <NeonButton className="mt-6" color="orange">
            View Active Auctions
          </NeonButton>
        </motion.div>
      )}

      {/* Register Username Modal */}
      {showRegisterForm && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <NeonText size="lg" color="purple">Register Username</NeonText>
                <button 
                  onClick={() => setShowRegisterForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Username
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="myname"
                      className="flex-1 p-3 rounded-l-lg border bg-transparent text-white placeholder-gray-400"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                    />
                    <div 
                      className="px-3 py-3 rounded-r-lg border-l-0 border flex items-center"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                        color: colors.textMuted
                      }}
                    >
                      .sei
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg border" style={{
                  backgroundColor: colors.glass,
                  borderColor: colors.glassBorder,
                }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm" style={{ color: colors.textMuted }}>Registration Fee</span>
                    <span className="text-lg font-bold" style={{ color: colors.neonGreen }}>
                      100.00 SEI
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: colors.textMuted }}>Duration</span>
                    <span className="text-sm text-white">1 Year</span>
                  </div>
                </div>

                <div className="text-xs" style={{ color: colors.textMuted }}>
                  * Username will be registered for 1 year and can be renewed before expiration
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <NeonButton 
                  variant="outline" 
                  color="purple" 
                  className="flex-1"
                  onClick={() => setShowRegisterForm(false)}
                >
                  Cancel
                </NeonButton>
                <NeonButton 
                  color="purple" 
                  className="flex-1"
                  onClick={handleRegister}
                >
                  Register
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};