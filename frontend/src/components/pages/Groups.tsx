import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Target, Calendar, TrendingUp, Crown } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { CircularProgress } from '../charts/CircularProgress';
import { colors } from '../../lib/colors';

const mockGroups = [
  {
    id: '1',
    name: 'Vacation Fund 2024',
    description: 'Saving for our group trip to Bali',
    targetAmount: 5000,
    currentAmount: 3250,
    maxParticipants: 8,
    currentParticipants: 6,
    expiry: '2024-12-31',
    creator: 'sei1abc...xyz',
    status: 'active',
    participants: [
      { address: 'sei1abc...xyz', contribution: 800, joinedAt: '2024-08-01' },
      { address: 'sei1def...abc', contribution: 650, joinedAt: '2024-08-03' },
      { address: 'sei1ghi...def', contribution: 500, joinedAt: '2024-08-05' },
    ]
  },
  {
    id: '2',
    name: 'Startup Investment Pool',
    description: 'Collective investment in promising DeFi startups',
    targetAmount: 10000,
    currentAmount: 7800,
    maxParticipants: 12,
    currentParticipants: 9,
    expiry: '2024-11-30',
    creator: 'sei1jkl...ghi',
    status: 'active',
    participants: []
  },
  {
    id: '3',
    name: 'Emergency Fund',
    description: 'Community emergency support fund',
    targetAmount: 2000,
    currentAmount: 2000,
    maxParticipants: 15,
    currentParticipants: 12,
    expiry: '2024-10-15',
    creator: 'sei1mno...jkl',
    status: 'completed',
    participants: []
  }
];

export const Groups: React.FC = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    maxParticipants: '',
    expiry: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating group:', formData);
    setShowCreateForm(false);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
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
            Group <NeonText color="purple" glow>Pools</NeonText>
          </h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>
            Collaborative savings with friends and community
          </p>
        </div>
        
        <NeonButton 
          color="purple" 
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={20} className="mr-2" />
          Create Group
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
              <Users size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Active Groups</p>
              <p className="text-xl font-bold text-white">12</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard glow="green" className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientGreen }}
            >
              <Target size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Total Pooled</p>
              <p className="text-xl font-bold text-white">$45,230</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientNeon }}
            >
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Success Rate</p>
              <p className="text-xl font-bold text-white">94%</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.warning}, ${colors.warning}dd)` }}
            >
              <Crown size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>My Contributions</p>
              <p className="text-xl font-bold text-white">$2,150</p>
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
        {['browse', 'my-groups', 'created'].map((tab) => (
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

      {/* Groups Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        {mockGroups.map((group, index) => {
          const progress = getProgressPercentage(group.currentAmount, group.targetAmount);
          const isCompleted = group.status === 'completed';
          
          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
            >
              <GlassCard 
                glow={isCompleted ? 'green' : 'purple'} 
                className="p-6 h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {group.name}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                      {group.description}
                    </p>
                  </div>
                  {isCompleted && (
                    <div 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${colors.neonGreen}20`, 
                        color: colors.neonGreen 
                      }}
                    >
                      Completed
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm" style={{ color: colors.textMuted }}>
                      Progress
                    </span>
                    <span className="text-sm font-medium text-white">
                      ${group.currentAmount.toLocaleString()} / ${group.targetAmount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                    <motion.div
                      className="h-3 rounded-full"
                      style={{ 
                        background: isCompleted ? colors.gradientGreen : colors.gradientPurple 
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ delay: 1 + index * 0.1, duration: 1 }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span style={{ color: colors.textMuted }}>Participants</span>
                      <p className="text-white font-medium">
                        {group.currentParticipants}/{group.maxParticipants}
                      </p>
                    </div>
                    <div>
                      <span style={{ color: colors.textMuted }}>Expires</span>
                      <p className="text-white font-medium">
                        {new Date(group.expiry).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {!isCompleted && (
                    <NeonButton 
                      className="flex-1" 
                      color="purple"
                      size="sm"
                    >
                      Join Group
                    </NeonButton>
                  )}
                  <NeonButton 
                    variant="outline" 
                    color={isCompleted ? 'green' : 'purple'}
                    size="sm"
                  >
                    View Details
                  </NeonButton>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Create Group Modal */}
      {showCreateForm && (
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
                <NeonText size="lg" color="purple">Create New Group</NeonText>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter group name"
                    className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the group purpose"
                    rows={3}
                    className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400 resize-none"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Target Amount
                    </label>
                    <input
                      type="number"
                      value={formData.targetAmount}
                      onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                      placeholder="0"
                      className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                      placeholder="10"
                      className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiry}
                    onChange={(e) => handleInputChange('expiry', e.target.value)}
                    className="w-full p-3 rounded-lg border bg-transparent text-white"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <NeonButton 
                    type="button" 
                    variant="outline" 
                    color="purple" 
                    className="flex-1"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </NeonButton>
                  <NeonButton 
                    type="submit" 
                    color="purple" 
                    className="flex-1"
                  >
                    Create Group
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};