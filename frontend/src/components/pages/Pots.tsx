import React from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Plus, Target, TrendingUp, Calendar, Zap, AlertCircle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { CircularProgress } from '../charts/CircularProgress';
import { LineChart } from '../charts/LineChart';
import { colors } from '../../lib/colors';
import { useApp } from '../../hooks/useApp';

export function Pots() {
  const { state, actions } = useApp();

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white">
            Savings <NeonText color="green" glow>Pots</NeonText>
          </h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>
            Goal-based savings with auto-deposit features
          </p>
        </div>
        
        <NeonButton 
          color="green"
          onClick={() => console.log('Create pot functionality will be implemented')}
        >
          <Plus size={20} className="mr-2" />
          Create Pot
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: colors.gradientGreen }}
            >
              <PiggyBank size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Total Saved</p>
              <p className="text-xl font-bold text-white">
                0.00 SEI
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard glow="purple" className="p-6">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: colors.gradientPurple }}
            >
              <Target size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Active Pots</p>
              <p className="text-xl font-bold text-white">
                0
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: colors.gradientNeon }}
            >
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Monthly Growth</p>
              <p className="text-xl font-bold text-white">
                +0.0%
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.warning}, ${colors.warning}dd)` }}
            >
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Auto-Save</p>
              <p className="text-xl font-bold text-white">
                0 SEI per month
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pots List */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* No Wallet Connected */}
          {!state.wallet?.address && (
            <GlassCard className="p-6 text-center">
              <PiggyBank size={48} className="mx-auto mb-4" style={{ color: colors.textMuted }} />
              <p className="text-white mb-2">Connect Your Wallet</p>
              <p style={{ color: colors.textMuted }} className="mb-4">
                Connect your wallet to view and manage your savings pots
              </p>
              <NeonButton onClick={() => actions.connectWallet('metamask')} color="green">
                Connect Wallet
              </NeonButton>
            </GlassCard>
          )}

          {/* Empty State */}
          {state.wallet?.address && (
            <GlassCard className="p-6 text-center">
              <PiggyBank size={48} className="mx-auto mb-4" style={{ color: colors.textMuted }} />
              <p className="text-white mb-2">No Savings Pots Yet</p>
              <p style={{ color: colors.textMuted }} className="mb-4">
                Create your first savings pot to start building your financial goals
              </p>
              <NeonButton onClick={() => console.log('Create pot')} color="green">
                <Plus size={20} className="mr-2" />
                Create Your First Pot
              </NeonButton>
            </GlassCard>
          )}
        </motion.div>

        {/* Selected Pot Details */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <GlassCard className="p-6 text-center">
            <PiggyBank size={48} className="mx-auto mb-4" style={{ color: colors.textMuted }} />
            <p className="text-white mb-2">Select a Pot</p>
            <p style={{ color: colors.textMuted }}>
              Choose a savings pot to view details and manage funds
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}