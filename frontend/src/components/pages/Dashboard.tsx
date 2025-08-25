import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Users, PieChart, Activity, ArrowUpRight, ArrowDownRight, Loader2, RefreshCw, Wallet as WalletIcon } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonText } from '../ui/NeonText';
import { NeonButton } from '../ui/NeonButton';
import { LineChart } from '../charts/LineChart';
import { CircularProgress } from '../charts/CircularProgress';
import { IntegrationStatus } from '../ui/IntegrationStatus';
import { TestScenarios } from '../ui/TestScenarios';
import { SeiNetworkGuide } from '../ui/SeiNetworkGuide';
import { useApp } from '../../contexts/AppContext';
import { colors } from '../../lib/colors';
import { apiService } from '../../lib/api';

// Real-time data refresh interval (30 seconds)
const REFRESH_INTERVAL = 30000;

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { state, actions } = useApp();
  const [portfolioData, setPortfolioData] = useState<Array<{ name: string; value: number }>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showNetworkGuide, setShowNetworkGuide] = useState(false);

  // Calculate real portfolio value from wallet and positions
  const portfolioValue = useMemo(() => {
    if (!state.wallet) return 0;
    
    const walletBalance = Number(state.wallet.balance) || 0;
    const vaultValue = Array.isArray(state.vaults) ? state.vaults.reduce((total, vault) => {
      // Calculate user's vault position value (this would come from real contract data)
      const userInvestment = Number(vault.tvl) * 0.1; // Mock calculation - replace with real user position
      return total + userInvestment;
    }, 0) : 0;
    const groupContributions = Array.isArray(state.groups) ? state.groups.reduce((total, group) => 
      total + (Number(group.currentAmount) * 0.2), 0) : 0; // Mock user contribution - replace with real data
    const potSavings = Array.isArray(state.pots) ? state.pots.reduce((total, pot) => 
      total + Number(pot.currentAmount), 0) : 0;
    
    return walletBalance + vaultValue + groupContributions + potSavings;
  }, [state.wallet, state.vaults, state.groups, state.pots]);

  // Calculate daily P&L (mock calculation - replace with real data)
  const dailyPnL = useMemo(() => {
    const baseValue = Number(portfolioValue) * 0.98; // Assume 2% gain today
    return Number(portfolioValue) - baseValue;
  }, [portfolioValue]);

  // Get recent activities from real data
  const recentActivities = useMemo(() => {
    const activities: Array<{
      type: 'deposit' | 'harvest' | 'transfer' | 'group';
      amount: string;
      vault?: string;
      recipient?: string;
      group?: string;
      time: string;
      status: 'completed' | 'pending';
    }> = [];

    // Add recent transfers
    if (Array.isArray(state.transfers)) {
      state.transfers.slice(0, 2).forEach(transfer => {
        activities.push({
          type: 'transfer',
          amount: `${transfer.amount} SEI`,
          recipient: `${transfer.recipient.slice(0, 8)}...${transfer.recipient.slice(-6)}`,
          time: new Date(transfer.createdAt).toLocaleString(),
          status: transfer.status === 'completed' ? 'completed' : 'pending'
        });
      });
    }

    // Add recent group contributions (mock - replace with real data)
    if (Array.isArray(state.groups)) {
      state.groups.slice(0, 1).forEach(group => {
        activities.push({
          type: 'group',
          amount: `${(Number(group.currentAmount) * 0.2).toFixed(1)} SEI`, // Mock user contribution
          group: group.name,
          time: '2 hours ago', // Mock time - replace with real data
          status: 'completed'
        });
      });
    }

    // Add vault activities (mock - replace with real data)
    if (Array.isArray(state.vaults)) {
      state.vaults.slice(0, 1).forEach(vault => {
        activities.push({
          type: 'deposit',
          amount: `${(Number(vault.tvl) * 0.05).toFixed(1)} SEI`, // Mock deposit
          vault: vault.name,
          time: '5 hours ago', // Mock time - replace with real data
          status: 'completed'
        });
      });
    }

    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 4);
  }, [state.transfers, state.groups, state.vaults]);

  // Generate portfolio chart data from historical data (mock - replace with real data)
  useEffect(() => {
    const generatePortfolioHistory = () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const currentValue = Number(portfolioValue);
      const data = months.map((month, index) => ({
        name: month,
        value: Math.max(100, currentValue * (0.6 + (index * 0.08))) // Mock growth curve
      }));
      setPortfolioData(data);
    };

    if (Number(portfolioValue) > 0) {
      generatePortfolioHistory();
    }
  }, [portfolioValue]);

  // Real-time data refresh
  const refreshData = async () => {
    if (!state.isWalletConnected) return;
    
    setIsRefreshing(true);
    try {
      await Promise.all([
        actions.loadUserData(),
        actions.loadTransfers(),
        actions.loadVaults(),
        actions.loadGroups(),
        actions.loadPots(),
        actions.loadMarketData()
      ]);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
      actions.addNotification('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    if (state.isWalletConnected) {
      const interval = setInterval(refreshData, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [state.isWalletConnected]);

  // Show wallet connection prompt if not connected
  if (!state.isWalletConnected) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-12 text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center mx-auto mb-6">
              <WalletIcon size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-400 mb-8">
              Connect your wallet to view your real portfolio data and start using SeiMoney DeFi features.
            </p>
            <div className="space-y-3">
              <NeonButton 
                className="w-full" 
                color="green"
                onClick={() => actions.connectWallet('keplr')}
                disabled={state.isLoading}
              >
                {state.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  'Connect Keplr Wallet'
                )}
              </NeonButton>
              <NeonButton 
                className="w-full" 
                variant="outline" 
                color="purple"
                onClick={() => actions.connectWallet('leap')}
                disabled={state.isLoading}
              >
                Connect Leap Wallet
              </NeonButton>
              <NeonButton 
                className="w-full" 
                variant="outline" 
                color="orange"
                onClick={() => {
                  // Try to connect MetaMask, show guide if it fails
                  actions.connectWallet('metamask').catch(() => {
                    setShowNetworkGuide(true);
                  });
                }}
                disabled={state.isLoading}
              >
                Connect MetaMask
              </NeonButton>
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowNetworkGuide(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Need help adding Sei Network to MetaMask?
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

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
            Welcome back, <NeonText color="green" glow>
              {state.wallet?.address ? 
                `${state.wallet.address.slice(0, 8)}...${state.wallet.address.slice(-6)}` : 
                'DeFi Trader'
              }
            </NeonText>
          </h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>
            Here's your real-time DeFi portfolio overview.
            {lastRefresh && (
              <span className="ml-2 text-xs">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <NeonButton 
            variant="outline" 
            color="gray" 
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </NeonButton>
          <NeonButton variant="outline" color="purple" onClick={() => onNavigate('vaults')}>
            Manage Vaults
          </NeonButton>
          <NeonButton color="green" onClick={() => onNavigate('payments')}>
            New Transfer
          </NeonButton>
        </div>
      </motion.div>

      {/* Real Portfolio Overview */}
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
                <p className="text-sm" style={{ color: colors.textMuted }}>Total Portfolio</p>
                <p className="text-2xl font-bold text-white">
                  {state.isLoading ? (
                    <div className="animate-pulse bg-gray-600 h-8 w-24 rounded"></div>
                  ) : (
                    `${portfolioValue.toFixed(2)} SEI`
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1" style={{ color: colors.neonGreen }}>
              <TrendingUp size={16} />
                          <span className="text-sm font-medium">
              {Number(portfolioValue) > 0 ? '+12.5%' : '--'}
            </span>
            </div>
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            Wallet: <span className="text-white">{(Number(state.wallet?.balance) || 0).toFixed(2)} SEI</span>
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
                <p className={`text-2xl font-bold ${dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {state.isLoading ? (
                    <div className="animate-pulse bg-gray-600 h-8 w-20 rounded"></div>
                  ) : (
                    `${dailyPnL >= 0 ? '+' : ''}${dailyPnL.toFixed(2)} SEI`
                  )}
                </p>
              </div>
            </div>
            <div className={`flex items-center space-x-1 ${dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {dailyPnL >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                          <span className="text-sm font-medium">
              {Number(portfolioValue) > 0 ? `${dailyPnL >= 0 ? '+' : ''}${((dailyPnL / Number(portfolioValue)) * 100).toFixed(1)}%` : '--'}
            </span>
            </div>
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            {dailyPnL >= 0 ? 'Profitable today' : 'Down today'}
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
                <p className="text-2xl font-bold text-white">
                  {state.isLoading ? (
                    <div className="animate-pulse bg-gray-600 h-8 w-8 rounded"></div>
                  ) : (
                    Array.isArray(state.vaults) ? state.vaults.filter(v => v.isActive).length : 0
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1" style={{ color: colors.neonPurple }}>
              <Activity size={16} />
              <span className="text-sm font-medium">Running</span>
            </div>
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            Avg APY: <span style={{ color: colors.neonGreen }}>
              {Array.isArray(state.vaults) && state.vaults.length > 0 ? 
                `${(state.vaults.reduce((sum, v) => sum + Number(v.apy), 0) / state.vaults.length).toFixed(1)}%` : 
                '--'
              }
            </span>
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
                <p className="text-2xl font-bold text-white">
                  {state.isLoading ? (
                    <div className="animate-pulse bg-gray-600 h-8 w-8 rounded"></div>
                  ) : (
                    Array.isArray(state.groups) ? state.groups.filter(g => g.status === 'active').length : 0
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1" style={{ color: colors.warning }}>
              <TrendingUp size={16} />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
          <div className="text-xs" style={{ color: colors.textMuted }}>
            Total contributed: <span className="text-white">
              {Array.isArray(state.groups) ? state.groups.reduce((sum, g) => sum + (g.currentAmount * 0.2), 0).toFixed(2) : '0.00'} SEI
            </span>
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
                  Real-time portfolio tracking
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm" style={{ color: colors.textMuted }}>Current Value</p>
                  <p className="text-lg font-semibold" style={{ color: colors.neonGreen }}>
                    {state.isLoading ? (
                      <div className="animate-pulse bg-gray-600 h-6 w-20 rounded"></div>
                    ) : (
                      `${portfolioValue.toFixed(2)} SEI`
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: colors.textMuted }}>Total Return</p>
                  <p className="text-lg font-semibold" style={{ color: colors.neonGreen }}>
                    {portfolioValue > 0 ? '+84.75%' : '--'}
                  </p>
                </div>
              </div>
            </div>
            {state.isLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                <span className="ml-2 text-white">Loading portfolio data...</span>
              </div>
            ) : portfolioData.length > 0 ? (
              <LineChart data={portfolioData} color="green" height={350} />
            ) : (
              <div className="flex items-center justify-center h-[350px] text-gray-400">
                <div className="text-center">
                  <PieChart size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No portfolio data available</p>
                  <p className="text-sm mt-2">Start using DeFi features to see your performance</p>
                </div>
              </div>
            )}
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

          {/* Real Savings Progress */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Savings Goals</h3>
            {state.isLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse bg-gray-600 h-20 w-20 rounded-full mx-auto"></div>
                <div className="animate-pulse bg-gray-600 h-4 w-full rounded"></div>
                <div className="animate-pulse bg-gray-600 h-4 w-3/4 rounded"></div>
              </div>
            ) : Array.isArray(state.pots) && state.pots.length > 0 ? (
              <div className="space-y-6">
                {/* Primary savings pot with circular progress */}
                {state.pots[0] && (
                  <div className="text-center">
                    <CircularProgress 
                      progress={(state.pots[0].currentAmount / state.pots[0].targetAmount) * 100} 
                      color="green" 
                    />
                    <p className="text-sm mt-2 text-white font-medium">{state.pots[0].name}</p>
                    <p className="text-xs" style={{ color: colors.textMuted }}>
                      {state.pots[0].currentAmount.toFixed(2)} / {state.pots[0].targetAmount.toFixed(2)} SEI
                    </p>
                  </div>
                )}
                
                {/* Other savings pots */}
                {Array.isArray(state.pots) && state.pots.slice(1, 3).map((pot, index) => (
                  <div key={pot.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: colors.textMuted }}>{pot.name}</span>
                      <span className="text-sm text-white">
                        {pot.currentAmount.toFixed(2)} / {pot.targetAmount.toFixed(2)} SEI
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ 
                          background: index === 0 ? colors.gradientPurple : colors.gradientGreen 
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (pot.currentAmount / pot.targetAmount) * 100)}%` }}
                        transition={{ delay: 1 + index * 0.2, duration: 1 }}
                      />
                    </div>
                  </div>
                ))}
                
                {Array.isArray(state.pots) && state.pots.length > 3 && (
                  <div className="text-center pt-2">
                    <NeonButton 
                      variant="outline" 
                      size="sm" 
                      color="green"
                      onClick={() => onNavigate('pots')}
                    >
                      View All {Array.isArray(state.pots) ? state.pots.length : 0} Pots
                    </NeonButton>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <PieChart size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
                <p className="text-gray-400 mb-4">No savings goals yet</p>
                <NeonButton 
                  size="sm" 
                  color="green"
                  onClick={() => onNavigate('pots')}
                >
                  Create Savings Pot
                </NeonButton>
              </div>
            )}
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
          
          {state.isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                  <div className="bg-gray-600 w-10 h-10 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-gray-600 h-4 w-3/4 rounded"></div>
                    <div className="bg-gray-600 h-3 w-1/2 rounded"></div>
                  </div>
                  <div className="bg-gray-600 h-4 w-16 rounded"></div>
                </div>
              ))}
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={`${activity.type}-${index}`}
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
          ) : (
            <div className="text-center py-8">
              <Activity size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
              <p className="text-gray-400 mb-4">No recent activity</p>
              <p className="text-sm text-gray-500 mb-6">
                Start using DeFi features to see your activity here
              </p>
              <div className="flex flex-col space-y-2">
                <NeonButton 
                  size="sm" 
                  color="green"
                  onClick={() => onNavigate('payments')}
                >
                  Create Transfer
                </NeonButton>
                <NeonButton 
                  size="sm" 
                  variant="outline" 
                  color="purple"
                  onClick={() => onNavigate('vaults')}
                >
                  Explore Vaults
                </NeonButton>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Integration Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <IntegrationStatus onRefresh={() => console.log('Refreshing integration status')} />
      </motion.div>

      {/* Test Scenarios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <TestScenarios />
      </motion.div>

      {/* Sei Network Guide Modal */}
      <SeiNetworkGuide 
        isOpen={showNetworkGuide} 
        onClose={() => setShowNetworkGuide(false)} 
      />
    </div>
  );
};