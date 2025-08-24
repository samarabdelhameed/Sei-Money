import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Clock, CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft, Copy, ExternalLink } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { colors } from '../../lib/colors';

const mockTransfers = [
  {
    id: '1',
    type: 'sent',
    recipient: 'sei1abc...xyz',
    amount: '250.00',
    status: 'completed',
    expiry: '2024-08-30',
    remark: 'Payment for services',
    createdAt: '2024-08-24 10:30 AM',
    txHash: '0x1234...5678'
  },
  {
    id: '2',
    type: 'received',
    sender: 'sei1def...abc',
    amount: '100.50',
    status: 'pending',
    expiry: '2024-08-28',
    remark: 'Freelance work',
    createdAt: '2024-08-24 09:15 AM',
    txHash: '0x5678...9012'
  },
  {
    id: '3',
    type: 'sent',
    recipient: 'sei1ghi...def',
    amount: '75.25',
    status: 'expired',
    expiry: '2024-08-23',
    remark: 'Refund processed',
    createdAt: '2024-08-23 02:45 PM',
    txHash: '0x9012...3456'
  }
];

export const Payments: React.FC = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    expiry: '',
    remark: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating transfer:', formData);
    // Handle transfer creation
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.neonGreen;
      case 'pending': return colors.warning;
      case 'expired': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'pending': return Clock;
      case 'expired': return XCircle;
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
            Smart <NeonText color="green" glow>Payments</NeonText>
          </h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>
            Send & receive payments with expiry and auto-refund features
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm" style={{ color: colors.textMuted }}>Wallet Balance</p>
            <p className="text-xl font-bold" style={{ color: colors.neonGreen }}>
              1,234.56 SEI
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
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
              <ArrowUpRight size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Total Sent</p>
              <p className="text-xl font-bold text-white">$12,450</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard glow="purple" className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientPurple }}
            >
              <ArrowDownLeft size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Total Received</p>
              <p className="text-xl font-bold text-white">$8,920</p>
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
              <p className="text-sm" style={{ color: colors.textMuted }}>Pending</p>
              <p className="text-xl font-bold text-white">5</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.warning}, ${colors.warning}dd)` }}
            >
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Success Rate</p>
              <p className="text-xl font-bold text-white">98.5%</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Transfer Form */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: colors.gradientGreen }}
              >
                <Send size={20} className="text-white" />
              </div>
              <NeonText size="lg" color="green">Create Transfer</NeonText>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={formData.recipient}
                  onChange={(e) => handleInputChange('recipient', e.target.value)}
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

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Remark (Optional)
                </label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  placeholder="Payment description..."
                  rows={3}
                  className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400 resize-none"
                  style={{
                    backgroundColor: colors.glass,
                    borderColor: colors.glassBorder,
                  }}
                />
              </div>

              <NeonButton type="submit" className="w-full" color="green">
                Create Transfer
              </NeonButton>
            </form>
          </GlassCard>
        </motion.div>

        {/* Transfers List */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <NeonText size="lg" color="purple">My Transfers</NeonText>
              
              <div className="flex space-x-2">
                {['all', 'sent', 'received', 'pending'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: activeTab === tab ? colors.glass : 'transparent',
                      border: activeTab === tab ? `1px solid ${colors.glassBorder}` : 'none',
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {mockTransfers.map((transfer, index) => {
                const StatusIcon = getStatusIcon(transfer.status);
                return (
                  <motion.div
                    key={transfer.id}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ 
                            background: transfer.type === 'sent' ? colors.gradientPurple : colors.gradientGreen 
                          }}
                        >
                          {transfer.type === 'sent' ? 
                            <ArrowUpRight size={20} className="text-white" /> :
                            <ArrowDownLeft size={20} className="text-white" />
                          }
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-white font-medium">
                              {transfer.type === 'sent' ? 'To: ' : 'From: '}
                              {transfer.type === 'sent' ? transfer.recipient : transfer.sender}
                            </p>
                            <button className="text-gray-400 hover:text-white">
                              <Copy size={14} />
                            </button>
                          </div>
                          <p className="text-sm" style={{ color: colors.textMuted }}>
                            {transfer.remark}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-bold text-white">
                            {transfer.type === 'sent' ? '-' : '+'}
                            {transfer.amount} SEI
                          </p>
                          <StatusIcon 
                            size={20} 
                            style={{ color: getStatusColor(transfer.status) }}
                          />
                        </div>
                        <p className="text-sm" style={{ color: colors.textMuted }}>
                          {transfer.createdAt}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm" style={{ color: colors.textMuted }}>
                        <span>Expires: {transfer.expiry}</span>
                        <button className="flex items-center space-x-1 hover:text-white">
                          <ExternalLink size={14} />
                          <span>View on Explorer</span>
                        </button>
                      </div>
                      
                      <div className="flex space-x-2">
                        {transfer.status === 'pending' && transfer.type === 'received' && (
                          <NeonButton size="sm" color="green">
                            Claim
                          </NeonButton>
                        )}
                        {transfer.status === 'pending' && transfer.type === 'sent' && (
                          <NeonButton size="sm" variant="outline" color="purple">
                            Cancel
                          </NeonButton>
                        )}
                        {transfer.status === 'expired' && (
                          <NeonButton size="sm" variant="outline" color="orange">
                            Refund
                          </NeonButton>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};