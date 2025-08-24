import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Users, PieChart, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonText } from '../ui/NeonText';
import { NeonButton } from '../ui/NeonButton';
import { LineChart } from '../charts/LineChart';
import { CircularProgress } from '../charts/CircularProgress';
import { colors } from '../../lib/colors';

const portfolioData = [
  { name: 'Jan', value: 1000 },
  { name: 'Feb', value: 1200 },
  { name: 'Mar', value: 1100 },
  { name: 'Apr', value: 1400 },
  { name: 'May', value: 1600 },
  { name: 'Jun', value: 1850 },
];

const recentActivities = [
  { type: 'deposit', amount: '250 SEI', vault: 'AI Vault Alpha', time: '2 hours ago', status: 'completed' },
  { type: 'harvest', amount: '+15.2 SEI', vault: 'DeFi Strategies', time: '5 hours ago', status: 'completed' },
  { type: 'transfer', amount: '100 SEI', recipient: 'sei1abc...xyz', time: '1 day ago', status: 'completed' },
  { type: 'group', amount: '50 SEI', group: 'Vacation Fund', time: '2 days ago', status: 'pending' },
];

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
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
            Welcome back, <NeonText color="green" glow>Crypto Trader</NeonText>
          </h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>
            Here's what's happening with your DeFi portfolio today.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <NeonButton variant="outline" color="purple" onClick={() => onNavigate('vaults')}>
            Manage Vaults
          </NeonButton>
          <NeonButton color="green" onClick={() => onNavigate('payments')}>
            New Transfer
          </NeonButton>
        </div>
      </motion.div>

      {/* Portfolio Overview */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <GlassCard glow="green" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: colors.gradientGreen }}
              >
                <DollarSign size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: colors.textMuted }}>Total Balance</p>
                <p className="text-2xl font-bold text-white">$1,847.50</p>
              </div>
            </div>
            <div className="flex items-center space-x-1" style={{ color: colors.neonGreen }}>
              <TrendingUp size={16} />
              <span className="text-sm font-medium">+12.5%</span>
            </div>
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            vs last month: <span style={{ color: colors.neonGreen }}>+$205.30</span>
          </div>
        </GlassCard>

        <GlassCard glow="purple" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: colors.gradientPurple }}
              >
                <TrendingUp size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: colors.textMuted }}>Daily P&L</p>
                <p className="text-2xl font-bold" style={{ color: colors.neonGreen }}>+$47.23</p>
              </div>
            </div>
            <div className="flex items-center space-x-1" style={{ color: colors.neonGreen }}>
              <ArrowUpRight size={16} />
              <span className="text-sm font-medium">+2.6%</span>
            </div>
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            Best day this week
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: colors.gradientNeon }}
              >
                <PieChart size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: colors.textMuted }}>Active Vaults</p>
                <p className="text-2xl font-bold text-white">5</p>
              </div>
            </div>
            <div className="flex items-center space-x-1" style={{ color: colors.neonPurple }}>
              <Activity size={16} />
              <span className="text-sm font-medium">Running</span>
            </div>
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            Avg APY: <span style={{ color: colors.neonGreen }}>14.2%</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${colors.warning}, ${colors.warning}dd)` }}
              >
                <Users size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm" style={{ color: colors.textMuted }}>Group Pools</p>
                <p className="text-2xl font-bold text-white">3</p>
              </div>
            </div>
            <div className="flex items-center space-x-1" style={{ color: colors.warning }}>
              <TrendingUp size={16} />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            Total contributed: <span className="text-white">$420.00</span>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Chart */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">Portfolio Performance</h3>
                <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                  Last 6 months
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm" style={{ color: colors.textMuted }}>Current Value</p>
                  <p className="text-lg font-semibold" style={{ color: colors.neonGreen }}>
                    $1,847.50
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: colors.textMuted }}>Total Return</p>
                  <p className="text-lg font-semibold" style={{ color: colors.neonGreen }}>
                    +84.75%
                  </p>
                </div>
              </div>
            </div>
            <LineChart data={portfolioData} color="green" height={350} />
          </GlassCard>
        </motion.div>

        {/* Quick Actions & Progress */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {/* Quick Actions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <NeonButton 
                className="w-full justify-start" 
                variant="outline" 
                color="green"
                onClick={() => onNavigate('payments')}
              >
                Create Transfer
              </NeonButton>
              <NeonButton 
                className="w-full justify-start" 
                variant="outline" 
                color="purple"
                onClick={() => onNavigate('vaults')}
              >
                Deposit to Vault
              </NeonButton>
              <NeonButton 
                className="w-full justify-start" 
                variant="outline" 
                color="orange"
                onClick={() => onNavigate('groups')}
              >
                Join Group Pool
              </NeonButton>
              <NeonButton 
                className="w-full justify-start" 
                variant="outline" 
                color="green"
                onClick={() => onNavigate('pots')}
              >
                Create Savings Pot
              </NeonButton>
            </div>
          </GlassCard>

          {/* Savings Progress */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Savings Goals</h3>
            <div className="space-y-6">
              <div className="text-center">
                <CircularProgress progress={68} color="green" />
                <p className="text-sm mt-2 text-white font-medium">Vacation Fund</p>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  $680 / $1,000
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.textMuted }}>Car Fund</span>
                  <span className="text-sm text-white">$1,200 / $5,000</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ background: colors.gradientPurple }}
                    initial={{ width: 0 }}
                    animate={{ width: '24%' }}
                    transition={{ delay: 1, duration: 1 }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: colors.textMuted }}>House Down Payment</span>
                  <span className="text-sm text-white">$8,500 / $50,000</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ background: colors.gradientGreen }}
                    initial={{ width: 0 }}
                    animate={{ width: '17%' }}
                    transition={{ delay: 1.2, duration: 1 }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
            <NeonButton variant="outline" size="sm" color="green">
              View All
            </NeonButton>
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border"
                style={{
                  backgroundColor: colors.glass,
                  borderColor: colors.glassBorder,
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
              >
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ 
                      background: activity.type === 'deposit' ? colors.gradientGreen :
                                 activity.type === 'harvest' ? colors.gradientPurple :
                                 activity.type === 'transfer' ? colors.gradientNeon :
                                 `linear-gradient(135deg, ${colors.warning}, ${colors.warning}dd)`
                    }}
                  >
                    {activity.type === 'deposit' && <ArrowUpRight size={20} className="text-white" />}
                    {activity.type === 'harvest' && <TrendingUp size={20} className="text-white" />}
                    {activity.type === 'transfer' && <ArrowDownRight size={20} className="text-white" />}
                    {activity.type === 'group' && <Users size={20} className="text-white" />}
                  </div>
                  
                  <div>
                    <p className="text-white font-medium">
                      {activity.type === 'deposit' && `Deposited ${activity.amount}`}
                      {activity.type === 'harvest' && `Harvested ${activity.amount}`}
                      {activity.type === 'transfer' && `Transferred ${activity.amount}`}
                      {activity.type === 'group' && `Contributed ${activity.amount}`}
                    </p>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      {activity.type === 'deposit' && `to ${activity.vault}`}
                      {activity.type === 'harvest' && `from ${activity.vault}`}
                      {activity.type === 'transfer' && `to ${activity.recipient}`}
                      {activity.type === 'group' && `to ${activity.group}`}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    {activity.time}
                  </p>
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: activity.status === 'completed' ? `${colors.neonGreen}20` : `${colors.warning}20`,
                      color: activity.status === 'completed' ? colors.neonGreen : colors.warning,
                    }}
                  >
                    {activity.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Notifications */}
      <motion.div
        className="fixed bottom-6 right-6 max-w-sm"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <GlassCard glow="purple" className="p-4">
          <div className="flex items-start space-x-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: colors.gradientPurple }}
            >
              <Activity size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">
                Auto-compound ready!
              </p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                Your AI Vault Alpha has rewards ready for compounding.
              </p>
              <NeonButton 
                size="sm" 
                className="mt-2" 
                color="purple"
                onClick={() => onNavigate('vaults')}
              >
                Compound Now
              </NeonButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};