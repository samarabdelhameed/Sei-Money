import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Target, Calendar, TrendingUp, Crown, Loader2, RefreshCw, AlertCircle, ArrowUpRight, Clock, CheckCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { CircularProgress } from '../charts/CircularProgress';
import { useApp } from '../../contexts/AppContext';
import { colors } from '../../lib/colors';
import { 
  formatSeiAmount, 
  formatPercentage,
  formatTime 
} from '../../lib/utils/formatters';

interface ContributeModalData {
  groupId: string;
  amount: string;
  isProcessing: boolean;
}

export const Groups: React.FC = () => {
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState('browse');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [contributeModal, setContributeModal] = useState<ContributeModalData | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    maxParticipants: '',
    expiry: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo groups data for display
  const demoGroups = [
    {
      id: '1',
      name: 'Vacation Fund 2025',
      description: 'Saving together for an amazing group vacation to Bali',
      targetAmount: 5000,
      currentAmount: 3250,
      maxParticipants: 8,
      participants: [
        { address: 'sei1abc123...', contribution: 800, joinedAt: '2024-01-15' },
        { address: 'sei1def456...', contribution: 750, joinedAt: '2024-01-20' },
        { address: 'sei1ghi789...', contribution: 900, joinedAt: '2024-01-25' },
        { address: 'sei1jkl012...', contribution: 800, joinedAt: '2024-02-01' }
      ],
      creator: 'sei1abc123...',
      status: 'active',
      expiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      name: 'Emergency Fund Pool',
      description: 'Community emergency fund for unexpected situations',
      targetAmount: 10000,
      currentAmount: 7500,
      maxParticipants: 15,
      participants: [
        { address: 'sei1abc123...', contribution: 1200, joinedAt: '2024-01-10' },
        { address: 'sei1mno345...', contribution: 1500, joinedAt: '2024-01-12' },
        { address: 'sei1pqr678...', contribution: 1300, joinedAt: '2024-01-18' },
        { address: 'sei1stu901...', contribution: 1000, joinedAt: '2024-01-22' },
        { address: 'sei1vwx234...', contribution: 2500, joinedAt: '2024-01-28' }
      ],
      creator: 'sei1mno345...',
      status: 'active',
      expiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      name: 'Tech Startup Investment',
      description: 'Pooling funds to invest in promising blockchain startups',
      targetAmount: 25000,
      currentAmount: 18750,
      maxParticipants: 10,
      participants: [
        { address: 'sei1abc123...', contribution: 3000, joinedAt: '2024-02-01' },
        { address: 'sei1xyz789...', contribution: 5000, joinedAt: '2024-02-03' },
        { address: 'sei1def456...', contribution: 2500, joinedAt: '2024-02-05' },
        { address: 'sei1ghi789...', contribution: 4000, joinedAt: '2024-02-08' },
        { address: 'sei1jkl012...', contribution: 4250, joinedAt: '2024-02-10' }
      ],
      creator: 'sei1xyz789...',
      status: 'active',
      expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      name: 'Gaming Tournament Prize Pool',
      description: 'Prize pool for monthly SEI blockchain gaming tournament',
      targetAmount: 2000,
      currentAmount: 2000,
      maxParticipants: 20,
      participants: [
        { address: 'sei1gamer1...', contribution: 400, joinedAt: '2024-02-15' },
        { address: 'sei1gamer2...', contribution: 300, joinedAt: '2024-02-16' },
        { address: 'sei1gamer3...', contribution: 500, joinedAt: '2024-02-17' },
        { address: 'sei1gamer4...', contribution: 200, joinedAt: '2024-02-18' },
        { address: 'sei1gamer5...', contribution: 600, joinedAt: '2024-02-19' }
      ],
      creator: 'sei1gamer1...',
      status: 'completed',
      expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '5',
      name: 'Community Garden Project',
      description: 'Funding for a sustainable community garden and farming initiative',
      targetAmount: 3500,
      currentAmount: 1250,
      maxParticipants: 12,
      participants: [
        { address: 'sei1green1...', contribution: 500, joinedAt: '2024-02-20' },
        { address: 'sei1green2...', contribution: 350, joinedAt: '2024-02-21' },
        { address: 'sei1green3...', contribution: 400, joinedAt: '2024-02-22' }
      ],
      creator: 'sei1green1...',
      status: 'active',
      expiry: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '6',
      name: 'DeFi Education Fund',
      description: 'Educational resources and workshops about DeFi and blockchain',
      targetAmount: 1500,
      currentAmount: 890,
      maxParticipants: 25,
      participants: [
        { address: 'sei1teacher1...', contribution: 200, joinedAt: '2024-02-25' },
        { address: 'sei1student1...', contribution: 150, joinedAt: '2024-02-26' },
        { address: 'sei1student2...', contribution: 180, joinedAt: '2024-02-27' },
        { address: 'sei1student3...', contribution: 160, joinedAt: '2024-02-28' },
        { address: 'sei1student4...', contribution: 200, joinedAt: '2024-03-01' }
      ],
      creator: 'sei1teacher1...',
      status: 'active',
      expiry: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Calculate group statistics
  const groupStats = useMemo(() => {
    // Use demo data if no real groups available
    const groups = Array.isArray(state.groups) && state.groups.length > 0 ? state.groups : demoGroups;
    
    const activeGroups = groups.filter(g => g.status === 'active');
    const totalPooled = groups.reduce((sum, g) => sum + g.currentAmount, 0);
    const completedGroups = groups.filter(g => g.status === 'completed');
    const successRate = groups.length > 0 ? (completedGroups.length / groups.length) * 100 : 0;
    
    // Calculate user's total contributions
    const userAddress = state.wallet?.address;
    const userContributions = groups.reduce((sum, group) => {
      const userParticipation = group.participants?.find(p => p.address === userAddress);
      return sum + (userParticipation?.contribution || 0);
    }, 0);

    return {
      activeGroups: activeGroups.length,
      totalPooled,
      successRate,
      userContributions
    };
  }, [state.groups, state.wallet?.address, demoGroups]);

  // Filter groups based on active tab
  const filteredGroups = useMemo(() => {
    const userAddress = state.wallet?.address;
    const groups = Array.isArray(state.groups) && state.groups.length > 0 ? state.groups : demoGroups;
    
    switch (activeTab) {
      case 'my-groups':
        return groups.filter(g => 
          g.participants?.some(p => p.address === userAddress)
        );
      case 'created':
        return groups.filter(g => g.creator === userAddress);
      default:
        return groups;
    }
  }, [state.groups, activeTab, state.wallet?.address, demoGroups]);

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Group name is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.targetAmount.trim()) {
      errors.targetAmount = 'Target amount is required';
    } else {
      const amount = parseFloat(formData.targetAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.targetAmount = 'Target amount must be greater than 0';
      }
    }

    if (!formData.maxParticipants.trim()) {
      errors.maxParticipants = 'Max participants is required';
    } else {
      const participants = parseInt(formData.maxParticipants);
      if (isNaN(participants) || participants < 2) {
        errors.maxParticipants = 'Must allow at least 2 participants';
      }
    }

    if (!formData.expiry) {
      errors.expiry = 'Expiry date is required';
    } else {
      const expiryDate = new Date(formData.expiry);
      const now = new Date();
      if (expiryDate <= now) {
        errors.expiry = 'Expiry date must be in the future';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.isWalletConnected) {
      actions.addNotification('Please connect your wallet first', 'error');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await actions.createGroup({
        name: formData.name,
        description: formData.description,
        targetAmount: parseFloat(formData.targetAmount),
        maxParticipants: parseInt(formData.maxParticipants),
        expiry: formData.expiry
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        targetAmount: '',
        maxParticipants: '',
        expiry: ''
      });
      setFormErrors({});
      setShowCreateForm(false);

      actions.addNotification('Group created successfully!', 'success');
      
    } catch (error) {
      console.error('Error creating group:', error);
      const message = error instanceof Error ? error.message : 'Failed to create group';
      actions.addNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle contribute to group
  const handleContribute = async () => {
    if (!contributeModal || !state.isWalletConnected) return;

    const amount = parseFloat(contributeModal.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormErrors({ amount: 'Please enter a valid amount' });
      return;
    }

    if (state.wallet && amount > state.wallet.balance) {
      setFormErrors({ amount: 'Insufficient balance' });
      return;
    }

    setContributeModal(prev => prev ? { ...prev, isProcessing: true } : null);
    
    try {
      // This would call the real group contribution API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      
      actions.addNotification(`Successfully contributed ${amount} SEI to group!`, 'success');
      setContributeModal(null);
      setFormErrors({});
      
      // Refresh group data
      await actions.loadGroups();
      
    } catch (error) {
      console.error('Contribution error:', error);
      actions.addNotification('Failed to contribute to group', 'error');
    } finally {
      setContributeModal(prev => prev ? { ...prev, isProcessing: false } : null);
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'active': return Clock;
      case 'expired': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.neonGreen;
      case 'active': return colors.neonPurple;
      case 'expired': return colors.error;
      default: return colors.textMuted;
    }
  };

  // Auto-refresh group data
  useEffect(() => {
    if (state.isWalletConnected) {
      const interval = setInterval(() => {
        actions.loadGroups();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [state.isWalletConnected]);

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

      {/* Real Stats */}
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
              {state.isLoading ? (
                <div className="animate-pulse bg-gray-600 h-6 w-8 rounded"></div>
              ) : (
                <p className="text-xl font-bold text-white">{groupStats.activeGroups}</p>
              )}
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
              {state.isLoading ? (
                <div className="animate-pulse bg-gray-600 h-6 w-20 rounded"></div>
              ) : (
                <p className="text-xl font-bold text-white">{`${groupStats.totalPooled.toFixed(0)} SEI`}</p>
              )}
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
              {state.isLoading ? (
                <div className="animate-pulse bg-gray-600 h-6 w-12 rounded"></div>
              ) : (
                <p className="text-xl font-bold text-white">{`${groupStats.successRate.toFixed(1)}%`}</p>
              )}
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
              {state.isLoading ? (
                <div className="animate-pulse bg-gray-600 h-6 w-16 rounded"></div>
              ) : (
                <p className="text-xl font-bold text-white">{`${groupStats.userContributions.toFixed(2)} SEI`}</p>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="flex space-x-4">
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
        </div>
        
        <button
          onClick={() => actions.loadGroups()}
          disabled={state.isLoading}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-gray-400 hover:text-white"
        >
          <RefreshCw 
            size={16} 
            className={state.isLoading ? 'animate-spin' : ''} 
          />
        </button>
      </motion.div>

      {/* Real Groups Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        {state.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <GlassCard className="p-6 h-full">
                  <div className="space-y-4">
                    <div className="bg-gray-600 h-6 w-3/4 rounded"></div>
                    <div className="bg-gray-600 h-4 w-full rounded"></div>
                    <div className="bg-gray-600 h-4 w-1/2 rounded"></div>
                    <div className="bg-gray-600 h-3 w-full rounded"></div>
                    <div className="bg-gray-600 h-8 w-full rounded"></div>
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
            <p className="text-lg text-white mb-2">
              {activeTab === 'browse' ? 'No groups available' :
               activeTab === 'my-groups' ? 'You haven\'t joined any groups yet' :
               'You haven\'t created any groups yet'}
            </p>
            <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
              {activeTab === 'browse' ? 
                'Groups will appear here when they are created' :
                activeTab === 'my-groups' ?
                'Join a group to start collaborative saving' :
                'Create your first group to get started'
              }
            </p>
            {(activeTab === 'browse' || activeTab === 'created') && (
              <NeonButton 
                color="purple"
                onClick={() => setShowCreateForm(true)}
                disabled={!state.isWalletConnected}
              >
                <Plus size={16} className="mr-2" />
                {state.isWalletConnected ? 'Create Group' : 'Connect Wallet'}
              </NeonButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group, index) => {
              const progress = getProgressPercentage(group.currentAmount, group.targetAmount);
              const StatusIcon = getStatusIcon(group.status);
              const userAddress = state.wallet?.address;
              const isParticipant = group.participants.some(p => p.address === userAddress);
              const isCreator = group.creator === userAddress;
              const userContribution = group.participants.find(p => p.address === userAddress)?.contribution || 0;
              
              return (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <GlassCard 
                    glow={group.status === 'completed' ? 'green' : 'purple'} 
                    className="p-6 h-full hover:border-opacity-60 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {group.name}
                          </h3>
                          {isCreator && (
                            <Crown size={16} style={{ color: colors.warning }} />
                          )}
                        </div>
                        <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                          {group.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusIcon 
                          size={16} 
                          style={{ color: getStatusColor(group.status) }}
                        />
                        <div 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${getStatusColor(group.status)}20`, 
                            color: getStatusColor(group.status)
                          }}
                        >
                          {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm" style={{ color: colors.textMuted }}>
                          Progress
                        </span>
                        <span className="text-sm font-medium text-white">
                          {group.currentAmount.toFixed(2)} / {group.targetAmount.toFixed(2)} SEI
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                        <motion.div
                          className="h-3 rounded-full"
                          style={{ 
                            background: group.status === 'completed' ? colors.gradientGreen : colors.gradientPurple 
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
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

                      {isParticipant && (
                        <div className="mt-3 p-2 rounded-lg" style={{ backgroundColor: `${colors.neonPurple}10` }}>
                          <div className="flex justify-between items-center">
                            <span className="text-xs" style={{ color: colors.textMuted }}>Your Contribution</span>
                            <span className="text-xs font-bold text-white">
                              {userContribution.toFixed(2)} SEI
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {group.status === 'active' && !isParticipant && group.currentParticipants < group.maxParticipants && (
                        <NeonButton 
                          className="flex-1" 
                          color="purple"
                          size="sm"
                          disabled={!state.isWalletConnected}
                          onClick={() => setContributeModal({ groupId: group.id, amount: '', isProcessing: false })}
                        >
                          <ArrowUpRight size={14} className="mr-1" />
                          {state.isWalletConnected ? 'Join Group' : 'Connect Wallet'}
                        </NeonButton>
                      )}
                      {group.status === 'active' && isParticipant && (
                        <NeonButton 
                          className="flex-1" 
                          color="green"
                          size="sm"
                          onClick={() => setContributeModal({ groupId: group.id, amount: '', isProcessing: false })}
                        >
                          <Plus size={14} className="mr-1" />
                          Contribute More
                        </NeonButton>
                      )}
                      {group.status === 'completed' && (
                        <NeonButton 
                          className="flex-1" 
                          color="green"
                          size="sm"
                          disabled
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Completed
                        </NeonButton>
                      )}
                      <NeonButton 
                        variant="outline" 
                        color={group.status === 'completed' ? 'green' : 'purple'}
                        size="sm"
                        onClick={() => setSelectedGroup(group)}
                      >
                        View Details
                      </NeonButton>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
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
                    className={`w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400 ${
                      formErrors.name ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: formErrors.name ? colors.error : colors.glassBorder,
                    }}
                    disabled={isSubmitting}
                  />
                  {formErrors.name && (
                    <div className="flex items-center mt-1 text-red-400 text-sm">
                      <AlertCircle size={14} className="mr-1" />
                      {formErrors.name}
                    </div>
                  )}
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
                    maxLength={200}
                    className={`w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400 resize-none ${
                      formErrors.description ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: formErrors.description ? colors.error : colors.glassBorder,
                    }}
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {formErrors.description ? (
                      <div className="flex items-center text-red-400 text-sm">
                        <AlertCircle size={14} className="mr-1" />
                        {formErrors.description}
                      </div>
                    ) : (
                      <div></div>
                    )}
                    <div className="text-xs text-gray-400">
                      {formData.description.length}/200
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Target Amount (SEI)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={formData.targetAmount}
                      onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                      placeholder="0.00"
                      className={`w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400 ${
                        formErrors.targetAmount ? 'border-red-500' : ''
                      }`}
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: formErrors.targetAmount ? colors.error : colors.glassBorder,
                      }}
                      disabled={isSubmitting}
                    />
                    {formErrors.targetAmount && (
                      <div className="flex items-center mt-1 text-red-400 text-sm">
                        <AlertCircle size={14} className="mr-1" />
                        {formErrors.targetAmount}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="100"
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                      placeholder="10"
                      className={`w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400 ${
                        formErrors.maxParticipants ? 'border-red-500' : ''
                      }`}
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: formErrors.maxParticipants ? colors.error : colors.glassBorder,
                      }}
                      disabled={isSubmitting}
                    />
                    {formErrors.maxParticipants && (
                      <div className="flex items-center mt-1 text-red-400 text-sm">
                        <AlertCircle size={14} className="mr-1" />
                        {formErrors.maxParticipants}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiry}
                    onChange={(e) => handleInputChange('expiry', e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className={`w-full p-3 rounded-lg border bg-transparent text-white ${
                      formErrors.expiry ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: formErrors.expiry ? colors.error : colors.glassBorder,
                    }}
                    disabled={isSubmitting}
                  />
                  {formErrors.expiry && (
                    <div className="flex items-center mt-1 text-red-400 text-sm">
                      <AlertCircle size={14} className="mr-1" />
                      {formErrors.expiry}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <NeonButton 
                    type="button" 
                    variant="outline" 
                    color="purple" 
                    className="flex-1"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormErrors({});
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </NeonButton>
                  <NeonButton 
                    type="submit" 
                    color="purple" 
                    className="flex-1"
                    disabled={isSubmitting || !state.isWalletConnected}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Group'
                    )}
                  </NeonButton>
                </div>

                {!state.isWalletConnected && (
                  <div className="text-center text-sm text-gray-400 mt-2">
                    Connect your wallet to create groups
                  </div>
                )}
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {/* Group Details Modal */}
      {selectedGroup && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => setSelectedGroup(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <NeonText size="lg" color="purple">{selectedGroup.name}</NeonText>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedGroup.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}>
                      {selectedGroup.status === 'completed' ? '✓ Completed' : '🔄 Active'}
                    </div>
                    <div className="text-sm text-gray-400">
                      Created {formatTime(selectedGroup.createdAt)}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedGroup(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-white font-medium mb-2">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{selectedGroup.description}</p>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-medium">Progress</h3>
                    <span className="text-purple-400 font-medium">
                      {Math.round((selectedGroup.currentAmount / selectedGroup.targetAmount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((selectedGroup.currentAmount / selectedGroup.targetAmount) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>{formatSeiAmount(selectedGroup.currentAmount)} raised</span>
                    <span>{formatSeiAmount(selectedGroup.targetAmount)} target</span>
                  </div>
                </div>

                {/* Key Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Participants</div>
                    <div className="text-white font-medium">
                      {selectedGroup.participants?.length || 0} / {selectedGroup.maxParticipants}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Expires</div>
                    <div className="text-white font-medium">
                      {formatTime(selectedGroup.expiry)}
                    </div>
                  </div>
                </div>

                {/* Participants List */}
                <div>
                  <h3 className="text-white font-medium mb-3">Participants ({selectedGroup.participants?.length || 0})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedGroup.participants?.map((participant: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                            {participant.address.slice(3, 5).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">
                              {participant.address.slice(0, 8)}...{participant.address.slice(-6)}
                            </div>
                            <div className="text-gray-400 text-xs">
                              Joined {formatTime(participant.joinedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-purple-400 font-medium">
                            {formatSeiAmount(participant.contribution)}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {((participant.contribution / selectedGroup.currentAmount) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )) || <div className="text-gray-400 text-center py-4">No participants yet</div>}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-700">
                  {selectedGroup.status === 'active' && (
                    <NeonButton
                      variant="gradient"
                      color="purple"
                      size="md"
                      onClick={() => {
                        setContributeModal({
                          groupId: selectedGroup.id,
                          amount: '',
                          isProcessing: false
                        });
                        setSelectedGroup(null);
                      }}
                      className="flex-1"
                    >
                      <Plus size={16} className="mr-2" />
                      Contribute
                    </NeonButton>
                  )}
                  <NeonButton
                    variant="outline"
                    color="gray"
                    size="md"
                    onClick={() => setSelectedGroup(null)}
                    className="flex-1"
                  >
                    Close
                  </NeonButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {/* Contribute Modal */}
      {contributeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !contributeModal.isProcessing && setContributeModal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Contribute to Group</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contribution Amount (SEI)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={contributeModal.amount}
                      onChange={(e) => {
                        setContributeModal(prev => prev ? { ...prev, amount: e.target.value } : null);
                        setFormErrors({});
                      }}
                      className={`w-full p-3 rounded-lg bg-white/10 border text-white placeholder-gray-400 focus:outline-none focus:border-white/40 ${
                        formErrors.amount ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="0.00"
                      disabled={contributeModal.isProcessing}
                    />
                    {state.wallet && (
                      <div className="absolute right-3 top-3 text-sm text-gray-400">
                        Max: {Number(state.wallet.balance).toFixed(6)}
                      </div>
                    )}
                  </div>
                  {formErrors.amount && (
                    <div className="flex items-center mt-1 text-red-400 text-sm">
                      <AlertCircle size={14} className="mr-1" />
                      {formErrors.amount}
                    </div>
                  )}
                </div>

                {(() => {
                  const groups = Array.isArray(state.groups) ? state.groups : [];
                  const group = groups.find(g => g.id === contributeModal.groupId);
                  return group && (
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Group Progress</span>
                        <span className="text-sm text-white">
                          {group.currentAmount.toFixed(2)} / {group.targetAmount.toFixed(2)} SEI
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ 
                            background: colors.gradientPurple,
                            width: `${getProgressPercentage(group.currentAmount, group.targetAmount)}%`
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-3 mt-6">
                <NeonButton 
                  variant="outline" 
                  onClick={() => setContributeModal(null)}
                  className="flex-1"
                  disabled={contributeModal.isProcessing}
                >
                  Cancel
                </NeonButton>
                <NeonButton 
                  onClick={handleContribute}
                  className="flex-1"
                  color="purple"
                  disabled={contributeModal.isProcessing}
                >
                  {contributeModal.isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Contributing...
                    </>
                  ) : (
                    'Contribute'
                  )}
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};