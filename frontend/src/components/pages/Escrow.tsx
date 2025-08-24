import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Clock, CheckCircle, XCircle, AlertTriangle, User, FileText, DollarSign } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { colors } from '../../lib/colors';

interface EscrowTransaction {
  id: string;
  title: string;
  description: string;
  amount: string;
  buyer: string;
  seller: string;
  status: 'pending' | 'funded' | 'disputed' | 'completed' | 'cancelled';
  createdAt: string;
  deadline: string;
  milestones?: {
    id: string;
    title: string;
    amount: string;
    status: 'pending' | 'completed';
  }[];
}

const mockEscrows: EscrowTransaction[] = [
  {
    id: '1',
    title: 'Website Development',
    description: 'Full-stack web application development with React and Node.js',
    amount: '2,500.00',
    buyer: 'sei1abc...xyz',
    seller: 'sei1def...abc',
    status: 'funded',
    createdAt: '2024-08-20',
    deadline: '2024-09-20',
    milestones: [
      { id: '1', title: 'UI/UX Design', amount: '500.00', status: 'completed' },
      { id: '2', title: 'Frontend Development', amount: '1,000.00', status: 'completed' },
      { id: '3', title: 'Backend Development', amount: '750.00', status: 'pending' },
      { id: '4', title: 'Testing & Deployment', amount: '250.00', status: 'pending' },
    ]
  },
  {
    id: '2',
    title: 'NFT Artwork Commission',
    description: 'Custom NFT collection with 100 unique pieces',
    amount: '1,200.00',
    buyer: 'sei1ghi...def',
    seller: 'sei1jkl...ghi',
    status: 'pending',
    createdAt: '2024-08-22',
    deadline: '2024-09-15',
  },
  {
    id: '3',
    title: 'Smart Contract Audit',
    description: 'Security audit for DeFi protocol smart contracts',
    amount: '5,000.00',
    buyer: 'sei1mno...jkl',
    seller: 'sei1pqr...mno',
    status: 'disputed',
    createdAt: '2024-08-15',
    deadline: '2024-08-30',
  }
];

export const Escrow: React.FC = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowTransaction | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    seller: '',
    deadline: '',
    milestones: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating escrow:', formData);
    setShowCreateForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.neonGreen;
      case 'funded': return colors.neonPurple;
      case 'pending': return colors.warning;
      case 'disputed': return colors.error;
      case 'cancelled': return colors.textMuted;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'funded': return Shield;
      case 'pending': return Clock;
      case 'disputed': return AlertTriangle;
      case 'cancelled': return XCircle;
      default: return Clock;
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
              <p className="text-xl font-bold text-white">$45,230</p>
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
              <p className="text-xl font-bold text-white">127</p>
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
              <p className="text-xl font-bold text-white">23</p>
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
              <p className="text-xl font-bold text-white">98.5%</p>
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

      {/* Escrow List */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        {mockEscrows.map((escrow, index) => {
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
                      {escrow.status.charAt(0).toUpperCase() + escrow.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs" style={{ color: colors.textMuted }}>Amount</p>
                    <p className="text-lg font-bold" style={{ color: colors.neonGreen }}>
                      {escrow.amount} SEI
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.textMuted }}>Deadline</p>
                    <p className="text-sm text-white">
                      {new Date(escrow.deadline).toLocaleDateString()}
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
                  {escrow.status === 'pending' && (
                    <NeonButton 
                      size="sm" 
                      variant="outline" 
                      color="purple"
                    >
                      Fund Escrow
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
        })}
      </motion.div>

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
                      {selectedEscrow.amount} SEI
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
                      {selectedEscrow.status.charAt(0).toUpperCase() + selectedEscrow.status.slice(1)}
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
                  {selectedEscrow.status === 'pending' && (
                    <NeonButton color="green" className="flex-1">
                      Fund Escrow
                    </NeonButton>
                  )}
                  {selectedEscrow.status === 'funded' && (
                    <>
                      <NeonButton color="green" className="flex-1">
                        Release Payment
                      </NeonButton>
                      <NeonButton variant="outline" color="orange">
                        Raise Dispute
                      </NeonButton>
                    </>
                  )}
                  {selectedEscrow.status === 'disputed' && (
                    <NeonButton color="orange" className="flex-1">
                      View Dispute Details
                    </NeonButton>
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