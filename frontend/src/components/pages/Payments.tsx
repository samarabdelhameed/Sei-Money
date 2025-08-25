import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Send, Clock, CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft, Copy, ExternalLink, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { useApp } from '../../contexts/AppContext';
import { colors } from '../../lib/colors';
import { apiService } from '../../lib/api';

export const Payments: React.FC = () => {
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    expiry: '',
    remark: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [processingTransfers, setProcessingTransfers] = useState<Set<string>>(new Set());

  // Calculate real transfer statistics
  const transferStats = useMemo(() => {
    const userAddress = state.wallet?.address;
    if (!userAddress) return { totalSent: 0, totalReceived: 0, pending: 0, successRate: 0 };

    const sentTransfers = state.transfers.filter(t => t.sender === userAddress);
    const receivedTransfers = state.transfers.filter(t => t.recipient === userAddress);
    const pendingTransfers = state.transfers.filter(t => t.status === 'pending');
    const completedTransfers = state.transfers.filter(t => t.status === 'completed');

    const totalSent = sentTransfers.reduce((sum, t) => sum + t.amount, 0);
    const totalReceived = receivedTransfers.reduce((sum, t) => sum + t.amount, 0);
    const successRate = state.transfers.length > 0 ? (completedTransfers.length / state.transfers.length) * 100 : 0;

    return {
      totalSent,
      totalReceived,
      pending: pendingTransfers.length,
      successRate
    };
  }, [state.transfers, state.wallet?.address]);

  // Filter transfers based on active tab
  const filteredTransfers = useMemo(() => {
    const userAddress = state.wallet?.address;
    if (!userAddress) return [];

    switch (activeTab) {
      case 'sent':
        return state.transfers.filter(t => t.sender === userAddress);
      case 'received':
        return state.transfers.filter(t => t.recipient === userAddress);
      case 'pending':
        return state.transfers.filter(t => t.status === 'pending');
      default:
        return state.transfers.filter(t => t.sender === userAddress || t.recipient === userAddress);
    }
  }, [state.transfers, activeTab, state.wallet?.address]);

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.recipient.trim()) {
      errors.recipient = 'Recipient address is required';
    } else if (!formData.recipient.startsWith('sei1') || formData.recipient.length < 20) {
      errors.recipient = 'Invalid Sei address format';
    }

    if (!formData.amount.trim()) {
      errors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Amount must be greater than 0';
      } else if (state.wallet && amount > state.wallet.balance) {
        errors.amount = 'Insufficient balance';
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
      await actions.createTransfer({
        recipient: formData.recipient,
        amount: parseFloat(formData.amount),
        expiry: formData.expiry,
        remark: formData.remark || undefined
      });

      // Reset form
      setFormData({
        recipient: '',
        amount: '',
        expiry: '',
        remark: ''
      });
      setFormErrors({});

      actions.addNotification('Transfer created successfully!', 'success');
      
    } catch (error) {
      console.error('Error creating transfer:', error);
      const message = error instanceof Error ? error.message : 'Failed to create transfer';
      actions.addNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle claim transfer
  const handleClaimTransfer = async (transferId: string) => {
    setProcessingTransfers(prev => new Set(prev).add(transferId));
    try {
      // This would call the real claim API
      await apiService.updateTransfer(transferId, { status: 'completed' });
      await actions.loadTransfers(); // Refresh transfers
      actions.addNotification('Transfer claimed successfully!', 'success');
    } catch (error) {
      console.error('Error claiming transfer:', error);
      actions.addNotification('Failed to claim transfer', 'error');
    } finally {
      setProcessingTransfers(prev => {
        const newSet = new Set(prev);
        newSet.delete(transferId);
        return newSet;
      });
    }
  };

  // Handle refund transfer
  const handleRefundTransfer = async (transferId: string) => {
    setProcessingTransfers(prev => new Set(prev).add(transferId));
    try {
      // This would call the real refund API
      await apiService.updateTransfer(transferId, { status: 'refunded' });
      await actions.loadTransfers(); // Refresh transfers
      actions.addNotification('Transfer refunded successfully!', 'success');
    } catch (error) {
      console.error('Error refunding transfer:', error);
      actions.addNotification('Failed to refund transfer', 'error');
    } finally {
      setProcessingTransfers(prev => {
        const newSet = new Set(prev);
        newSet.delete(transferId);
        return newSet;
      });
    }
  };

  // Auto-refresh transfers
  useEffect(() => {
    if (state.isWalletConnected) {
      const interval = setInterval(() => {
        actions.loadTransfers();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [state.isWalletConnected]);

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
              {state.wallet?.balance ? `${state.wallet.balance.toFixed(2)} SEI` : '0.00 SEI'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Real Stats Cards */}
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
              <p className="text-xl font-bold text-white">
                {state.isLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-16 rounded"></div>
                ) : (
                  `${transferStats.totalSent.toFixed(2)} SEI`
                )}
              </p>
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
              <p className="text-xl font-bold text-white">
                {state.isLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-16 rounded"></div>
                ) : (
                  `${transferStats.totalReceived.toFixed(2)} SEI`
                )}
              </p>
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
              <p className="text-xl font-bold text-white">
                {state.isLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-8 rounded"></div>
                ) : (
                  transferStats.pending
                )}
              </p>
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
              <p className="text-xl font-bold text-white">
                {state.isLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-12 rounded"></div>
                ) : (
                  `${transferStats.successRate.toFixed(1)}%`
                )}
              </p>
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
                  className={`w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400 ${
                    formErrors.recipient ? 'border-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: colors.glass,
                    borderColor: formErrors.recipient ? colors.error : colors.glassBorder,
                  }}
                  disabled={isSubmitting}
                />
                {formErrors.recipient && (
                  <div className="flex items-center mt-1 text-red-400 text-sm">
                    <AlertCircle size={14} className="mr-1" />
                    {formErrors.recipient}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Amount (SEI)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    className={`w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400 ${
                      formErrors.amount ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: formErrors.amount ? colors.error : colors.glassBorder,
                    }}
                    disabled={isSubmitting}
                  />
                  {state.wallet && (
                    <div className="absolute right-3 top-3 text-sm text-gray-400">
                      Max: {state.wallet.balance.toFixed(6)}
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

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Remark (Optional)
                </label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  placeholder="Payment description..."
                  rows={3}
                  maxLength={200}
                  className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400 resize-none"
                  style={{
                    backgroundColor: colors.glass,
                    borderColor: colors.glassBorder,
                  }}
                  disabled={isSubmitting}
                />
                <div className="text-xs text-gray-400 mt-1">
                  {formData.remark.length}/200 characters
                </div>
              </div>

              <NeonButton 
                type="submit" 
                className="w-full" 
                color="green"
                disabled={isSubmitting || !state.isWalletConnected}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Transfer...
                  </>
                ) : (
                  'Create Transfer'
                )}
              </NeonButton>

              {!state.isWalletConnected && (
                <div className="text-center text-sm text-gray-400 mt-2">
                  Connect your wallet to create transfers
                </div>
              )}
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
              <div className="flex items-center space-x-4">
                <NeonText size="lg" color="purple">My Transfers</NeonText>
                <button
                  onClick={() => actions.loadTransfers()}
                  disabled={state.isLoading}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <RefreshCw 
                    size={16} 
                    className={state.isLoading ? 'animate-spin' : ''} 
                  />
                </button>
              </div>
              
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
                    {tab === 'pending' && transferStats.pending > 0 && (
                      <span 
                        className="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                        style={{ backgroundColor: colors.warning, color: 'white' }}
                      >
                        {transferStats.pending}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {state.isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-4 rounded-lg border" style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder }}>
                      <div className="flex items-center space-x-4">
                        <div className="bg-gray-600 w-10 h-10 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-gray-600 h-4 w-3/4 rounded"></div>
                          <div className="bg-gray-600 h-3 w-1/2 rounded"></div>
                        </div>
                        <div className="bg-gray-600 h-6 w-20 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredTransfers.length === 0 ? (
                <div className="text-center py-12">
                  <Send size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
                  <p className="text-lg text-white mb-2">
                    {activeTab === 'all' ? 'No transfers found' : 
                     activeTab === 'sent' ? 'No sent transfers' :
                     activeTab === 'received' ? 'No received transfers' :
                     'No pending transfers'}
                  </p>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    {state.isWalletConnected ? 
                      'Create your first transfer using the form on the left' : 
                      'Connect your wallet to view and create transfers'
                    }
                  </p>
                  {state.isWalletConnected && (
                    <NeonButton 
                      className="mt-4" 
                      color="green" 
                      size="sm"
                      onClick={() => {
                        // Focus on recipient input
                        const recipientInput = document.querySelector('input[placeholder="sei1abc...xyz"]') as HTMLInputElement;
                        recipientInput?.focus();
                      }}
                    >
                      Create Transfer
                    </NeonButton>
                  )}
                </div>
              ) : (
                filteredTransfers.map((transfer, index) => {
                  const StatusIcon = getStatusIcon(transfer.status);
                  const isSent = transfer.sender === state.wallet?.address;
                  const transferType = isSent ? 'sent' : 'received';
                  const isProcessing = processingTransfers.has(transfer.id);
                  
                  return (
                    <motion.div
                      key={transfer.id}
                      className="p-4 rounded-lg border hover:border-opacity-60 transition-all duration-200"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ 
                              background: transferType === 'sent' ? colors.gradientPurple : colors.gradientGreen 
                            }}
                          >
                            {transferType === 'sent' ? 
                              <ArrowUpRight size={20} className="text-white" /> :
                              <ArrowDownLeft size={20} className="text-white" />
                            }
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-white font-medium">
                                {transferType === 'sent' ? 'To: ' : 'From: '}
                                <span className="font-mono text-sm">
                                  {(transferType === 'sent' ? transfer.recipient : transfer.sender).slice(0, 12)}...
                                  {(transferType === 'sent' ? transfer.recipient : transfer.sender).slice(-6)}
                                </span>
                              </p>
                              <button 
                                className="text-gray-400 hover:text-white transition-colors"
                                onClick={() => {
                                  const address = transferType === 'sent' ? transfer.recipient : transfer.sender;
                                  navigator.clipboard.writeText(address);
                                  actions.addNotification('Address copied to clipboard', 'success');
                                }}
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                            <p className="text-sm" style={{ color: colors.textMuted }}>
                              {transfer.remark || 'No description provided'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <p className={`text-lg font-bold ${
                              transferType === 'sent' ? 'text-red-400' : 'text-green-400'
                            }`}>
                              {transferType === 'sent' ? '-' : '+'}
                              {transfer.amount.toFixed(6)} SEI
                            </p>
                            <StatusIcon 
                              size={20} 
                              style={{ color: getStatusColor(transfer.status) }}
                            />
                          </div>
                          <p className="text-sm" style={{ color: colors.textMuted }}>
                            {new Date(transfer.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm" style={{ color: colors.textMuted }}>
                          <span>
                            Expires: {new Date(transfer.expiry).toLocaleDateString()} at {new Date(transfer.expiry).toLocaleTimeString()}
                          </span>
                          <button 
                            className="flex items-center space-x-1 hover:text-white transition-colors"
                            onClick={() => {
                              // Open Sei explorer - replace with actual explorer URL
                              window.open(`https://seitrace.com/tx/${transfer.id}`, '_blank');
                            }}
                          >
                            <ExternalLink size={14} />
                            <span>View on Explorer</span>
                          </button>
                        </div>
                        
                        <div className="flex space-x-2">
                          {transfer.status === 'pending' && transferType === 'received' && (
                            <NeonButton 
                              size="sm" 
                              color="green"
                              disabled={isProcessing}
                              onClick={() => handleClaimTransfer(transfer.id)}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  Claiming...
                                </>
                              ) : (
                                'Claim'
                              )}
                            </NeonButton>
                          )}
                          {transfer.status === 'pending' && transferType === 'sent' && (
                            <NeonButton 
                              size="sm" 
                              variant="outline" 
                              color="purple"
                              disabled={isProcessing}
                              onClick={() => handleRefundTransfer(transfer.id)}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  Canceling...
                                </>
                              ) : (
                                'Cancel'
                              )}
                            </NeonButton>
                          )}
                          {transfer.status === 'expired' && transferType === 'sent' && (
                            <NeonButton 
                              size="sm" 
                              variant="outline" 
                              color="orange"
                              disabled={isProcessing}
                              onClick={() => handleRefundTransfer(transfer.id)}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  Refunding...
                                </>
                              ) : (
                                'Refund'
                              )}
                            </NeonButton>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};