import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Clock, CheckCircle, XCircle, AlertTriangle, User, FileText, DollarSign } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { colors } from '../../lib/colors';
import { escrowContractService, RealEscrowCase, CreateEscrowParams } from '../../lib/services/escrow-contract';
import { disputeResolutionService } from '../../lib/services/dispute-resolution-service';

// Real escrow data state
interface EscrowStats {
  totalSecured: number;
  completed: number;
  active: number;
  successRate: number;
}

export const Escrow: React.FC = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<RealEscrowCase | null>(null);
  const [escrows, setEscrows] = useState<RealEscrowCase[]>([]);
  const [stats, setStats] = useState<EscrowStats>({
    totalSecured: 0,
    completed: 0,
    active: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    seller: '',
    arbiter: '',
    deadline: '',
    terms: '',
    milestones: false
  });

  // Load real escrow data on component mount
  useEffect(() => {
    loadEscrowData();
  }, []);

  const loadEscrowData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, we'd get the user address from wallet context
      const userAddress = 'current_user_address';
      
      const response = await escrowContractService.getUserEscrows(userAddress);
      
      if (response.success && response.data) {
        setEscrows(response.data);
        calculateStats(response.data);
      } else {
        setError(response.error || 'Failed to load escrows');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load escrows');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (escrowData: RealEscrowCase[]) => {
    const totalSecured = escrowData.reduce((sum, escrow) => sum + escrow.amount, 0);
    const completed = escrowData.filter(e => e.status === 'released').length;
    const active = escrowData.filter(e => ['created', 'funded'].includes(e.status)).length;
    const successRate = escrowData.length > 0 ? (completed / escrowData.length) * 100 : 0;
    
    setStats({
      totalSecured,
      completed,
      active,
      successRate
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const createParams: CreateEscrowParams = {
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        seller: formData.seller,
        arbiter: formData.arbiter || 'sei1default_arbiter...', // Default arbiter
        expiryDate: new Date(formData.deadline),
        terms: formData.terms.split('\n').filter(term => term.trim()),
        milestones: formData.milestones ? [
          {
            title: 'Initial Milestone',
            description: 'First milestone payment',
            amount: parseFloat(formData.amount) * 0.5
          },
          {
            title: 'Final Milestone', 
            description: 'Final milestone payment',
            amount: parseFloat(formData.amount) * 0.5
          }
        ] : undefined
      };
      
      const response = await escrowContractService.createEscrow(createParams);
      
      if (response.success && response.data) {
        // Add new escrow to list
        setEscrows(prev => [response.data!, ...prev]);
        calculateStats([response.data!, ...escrows]);
        
        // Reset form and close modal
        setFormData({
          title: '',
          description: '',
          amount: '',
          seller: '',
          arbiter: '',
          deadline: '',
          terms: '',
          milestones: false
        });
        setShowCreateForm(false);
      } else {
        setError(response.error || 'Failed to create escrow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create escrow');
    } finally {
      setLoading(false);
    }
  };

  const handleFundEscrow = async (escrowId: string, amount: number) => {
    try {
      setLoading(true);
      
      const response = await escrowContractService.fundEscrow(escrowId, amount);
      
      if (response.success) {
        // Reload escrow data to reflect changes
        await loadEscrowData();
      } else {
        setError(response.error || 'Failed to fund escrow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fund escrow');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async (escrowId: string) => {
    try {
      setLoading(true);
      
      const response = await escrowContractService.releasePayment(escrowId);
      
      if (response.success) {
        // Reload escrow data to reflect changes
        await loadEscrowData();
      } else {
        setError(response.error || 'Failed to release payment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release payment');
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseDispute = async (escrowId: string, reason: string) => {
    try {
      setLoading(true);
      
      const response = await escrowContractService.raiseDispute(escrowId, reason, []);
      
      if (response.success) {
        // Reload escrow data to reflect changes
        await loadEscrowData();
      } else {
        setError(response.error || 'Failed to raise dispute');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to raise dispute');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: RealEscrowCase['status']) => {
    switch (status) {
      case 'released': return colors.neonGreen;
      case 'funded': return colors.neonPurple;
      case 'created': return colors.warning;
      case 'disputed': return colors.error;
      case 'cancelled': return colors.textMuted;
      case 'resolved': return colors.neonGreen;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status: RealEscrowCase['status']) => {
    switch (status) {
      case 'released': return CheckCircle;
      case 'resolved': return CheckCircle;
      case 'funded': return Shield;
      case 'created': return Clock;
      case 'disputed': return AlertTriangle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const getStatusDisplayName = (status: RealEscrowCase['status']) => {
    switch (status) {
      case 'created': return 'Pending';
      case 'funded': return 'Funded';
      case 'released': return 'Completed';
      case 'disputed': return 'Disputed';
      case 'resolved': return 'Resolved';
      case 'cancelled': return 'Cancelled';
      default: return status;
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
            Escrow <NeonText color="green" glow>Service</NeonText>
          </h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>
            Secure transactions with dispute resolution
          </p>
        </div>
        
        <NeonButton 
          color="green" 
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={20} className="mr-2" />
          Create Escrow
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <GlassCard glow="green" className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientGreen }}
            >
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Total Secured</p>
              <p className="text-xl font-bold text-white">{stats.totalSecured.toFixed(2)} SEI</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard glow="purple" className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientPurple }}
            >
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Completed</p>
              <p className="text-xl font-bold text-white">{stats.completed}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientNeon }}
            >
              <Clock size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Active</p>
              <p className="text-xl font-bold text-white">{stats.active}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.warning}, ${colors.warning}dd)` }}
            >
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Success Rate</p>
              <p className="text-xl font-bold text-white">{stats.successRate.toFixed(1)}%</p>
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
        {['browse', 'my-escrows', 'as-seller', 'disputes'].map((tab) => (
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

      {/* Error Display */}
      {error && (
        <motion.div
          className="p-4 rounded-lg border border-red-500 bg-red-500/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-red-400">{error}</p>
          <NeonButton 
            size="sm" 
            color="green" 
            className="mt-2"
            onClick={() => {
              setError(null);
              loadEscrowData();
            }}
          >
            Retry
          </NeonButton>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          className="flex items-center justify-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-white">Loading escrows...</span>
        </motion.div>
      )}

      {/* Escrow List */}
      {!loading && (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {escrows.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400 mb-4">No escrows found</p>
              <NeonButton color="green" onClick={() => setShowCreateForm(true)}>
                Create Your First Escrow
              </NeonButton>
            </div>
          ) : (
            escrows.map((escrow, index) => {
          const StatusIcon = getStatusIcon(escrow.status);
          const statusColor = getStatusColor(escrow.status);
          
          return (
            <motion.div
              key={escrow.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
            >
              <GlassCard 
                glow={escrow.status === 'completed' ? 'green' : 
                      escrow.status === 'funded' ? 'purple' : 'orange'} 
                className="p-6 cursor-pointer"
                onClick={() => setSelectedEscrow(escrow)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {escrow.title}
                    </h3>
                    <p className="text-sm mb-3" style={{ color: colors.textMuted }}>
                      {escrow.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIcon size={20} style={{ color: statusColor }} />
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${statusColor}20`, 
                        color: statusColor 
                      }}
                    >
                      {getStatusDisplayName(escrow.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs" style={{ color: colors.textMuted }}>Amount</p>
                    <p className="text-lg font-bold" style={{ color: colors.neonGreen }}>
                      {escrow.amount.toFixed(2)} SEI
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.textMuted }}>Deadline</p>
                    <p className="text-sm text-white">
                      {escrow.expiryDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: colors.textMuted }}>Buyer:</span>
                    <span className="text-white font-mono">{escrow.buyer}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: colors.textMuted }}>Seller:</span>
                    <span className="text-white font-mono">{escrow.seller}</span>
                  </div>
                </div>

                {escrow.milestones && (
                  <div className="mb-4">
                    <p className="text-xs mb-2" style={{ color: colors.textMuted }}>
                      Milestones ({escrow.milestones.filter(m => m.status === 'completed').length}/{escrow.milestones.length})
                    </p>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ background: colors.gradientGreen }}
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(escrow.milestones.filter(m => m.status === 'completed').length / escrow.milestones.length) * 100}%` 
                        }}
                        transition={{ delay: 1 + index * 0.1, duration: 1 }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <NeonButton 
                    size="sm" 
                    color="green" 
                    className="flex-1"
                  >
                    View Details
                  </NeonButton>
                  {escrow.status === 'created' && (
                    <NeonButton 
                      size="sm" 
                      variant="outline" 
                      color="purple"
                      onClick={() => handleFundEscrow(escrow.id, escrow.amount)}
                    >
                      Fund Escrow
                    </NeonButton>
                  )}
                  {escrow.status === 'funded' && (
                    <NeonButton 
                      size="sm" 
                      variant="outline" 
                      color="green"
                      onClick={() => handleReleasePayment(escrow.id)}
                    >
                      Release Payment
                    </NeonButton>
                  )}
                  {escrow.status === 'disputed' && (
                    <NeonButton 
                      size="sm" 
                      variant="outline" 
                      color="orange"
                    >
                      View Dispute
                    </NeonButton>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          );
        }))}
      </motion.div>
      )}

      {/* Create Escrow Modal */}
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
            <GlassCard className="p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <NeonText size="lg" color="green">Create New Escrow</NeonText>
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
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter project title"
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
                    placeholder="Describe the project requirements"
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
                      Amount (SEI)
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="0.00"
                      className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                      className="w-full p-3 rounded-lg border bg-transparent text-white"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Seller Address
                  </label>
                  <input
                    type="text"
                    value={formData.seller}
                    onChange={(e) => handleInputChange('seller', e.target.value)}
                    placeholder="sei1abc...xyz"
                    className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Arbiter Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.arbiter}
                    onChange={(e) => handleInputChange('arbiter', e.target.value)}
                    placeholder="sei1arbiter...xyz (leave empty for default)"
                    className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => handleInputChange('terms', e.target.value)}
                    placeholder="Enter terms and conditions (one per line)"
                    rows={3}
                    className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400 resize-none"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="milestones"
                    checked={formData.milestones}
                    onChange={(e) => handleInputChange('milestones', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="milestones" className="text-sm text-white">
                    Enable milestone-based payments
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <NeonButton 
                    type="button" 
                    variant="outline" 
                    color="green" 
                    className="flex-1"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </NeonButton>
                  <NeonButton 
                    type="submit" 
                    color="green" 
                    className="flex-1"
                  >
                    Create Escrow
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {/* Escrow Details Modal */}
      {selectedEscrow && (
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
            <GlassCard className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <NeonText size="lg" color="green">{selectedEscrow.title}</NeonText>
                <button 
                  onClick={() => setSelectedEscrow(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-white font-medium mb-2">Description</h4>
                  <p style={{ color: colors.textMuted }}>{selectedEscrow.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-2">Amount</h4>
                    <p className="text-2xl font-bold" style={{ color: colors.neonGreen }}>
                      {selectedEscrow.amount.toFixed(2)} SEI
                    </p>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Status</h4>
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: `${getStatusColor(selectedEscrow.status)}20`, 
                        color: getStatusColor(selectedEscrow.status) 
                      }}
                    >
                      {getStatusDisplayName(selectedEscrow.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-2">Buyer</h4>
                    <p className="font-mono text-sm" style={{ color: colors.textMuted }}>
                      {selectedEscrow.buyer}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Seller</h4>
                    <p className="font-mono text-sm" style={{ color: colors.textMuted }}>
                      {selectedEscrow.seller}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-white font-medium mb-2">Arbiter</h4>
                    <p className="font-mono text-sm" style={{ color: colors.textMuted }}>
                      {selectedEscrow.arbiter}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Expiry Date</h4>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      {selectedEscrow.expiryDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedEscrow.terms.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-2">Terms & Conditions</h4>
                    <ul className="space-y-1">
                      {selectedEscrow.terms.map((term, index) => (
                        <li key={index} className="text-sm" style={{ color: colors.textMuted }}>
                          • {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedEscrow.milestones && (
                  <div>
                    <h4 className="text-white font-medium mb-4">Milestones</h4>
                    <div className="space-y-3">
                      {selectedEscrow.milestones.map((milestone, index) => (
                        <div 
                          key={milestone.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                          style={{
                            backgroundColor: colors.glass,
                            borderColor: colors.glassBorder,
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ 
                                background: milestone.status === 'completed' ? colors.gradientGreen : colors.glass,
                                border: milestone.status === 'pending' ? `1px solid ${colors.glassBorder}` : 'none'
                              }}
                            >
                              {milestone.status === 'completed' ? (
                                <CheckCircle size={16} className="text-white" />
                              ) : (
                                <span className="text-sm text-white">{index + 1}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-white font-medium">{milestone.title}</p>
                              <p className="text-sm" style={{ color: colors.textMuted }}>
                                {milestone.amount} SEI
                              </p>
                            </div>
                          </div>
                          <span 
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ 
                              backgroundColor: milestone.status === 'completed' ? `${colors.neonGreen}20` : `${colors.warning}20`,
                              color: milestone.status === 'completed' ? colors.neonGreen : colors.warning
                            }}
                          >
                            {milestone.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  {selectedEscrow.status === 'created' && (
                    <NeonButton 
                      color="green" 
                      className="flex-1"
                      onClick={() => handleFundEscrow(selectedEscrow.id, selectedEscrow.amount)}
                    >
                      Fund Escrow
                    </NeonButton>
                  )}
                  {selectedEscrow.status === 'funded' && (
                    <>
                      <NeonButton 
                        color="green" 
                        className="flex-1"
                        onClick={() => handleReleasePayment(selectedEscrow.id)}
                      >
                        Release Payment
                      </NeonButton>
                      <NeonButton 
                        variant="outline" 
                        color="orange"
                        onClick={() => handleRaiseDispute(selectedEscrow.id, 'Dispute raised from UI')}
                      >
                        Raise Dispute
                      </NeonButton>
                    </>
                  )}
                  {selectedEscrow.status === 'disputed' && (
                    <NeonButton color="orange" className="flex-1">
                      View Dispute Details
                    </NeonButton>
                  )}
                  {selectedEscrow.status === 'released' && (
                    <div className="flex-1 text-center py-2">
                      <span className="text-green-400">✓ Escrow Completed Successfully</span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};