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
  onNavigate?: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { state, actions } = useApp();
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Demo mode when wallet is not connected
  const isDemoMode = !state.isWalletConnected;

  // Demo data for when wallet is not connected
  const demoData = {
    portfolioValue: '1,250.75',
    walletBalance: '1,250.75',
    dailyPnl: '+45.50',
    activeVaults: '3',
    groupPools: '2',
    activities: [
      { type: 'deposit', title: 'Deposited to Vault "High Yield SEI"', amount: '+125.50 SEI', time: '2 hours ago', status: 'completed' },
      { type: 'transfer', title: 'Sent to @alice_crypto', amount: '-50.00 SEI', time: '5 hours ago', status: 'completed' },
      { type: 'group', title: 'Joined Group Pool "Vacation Fund"', amount: '+200.00 SEI', time: '1 day ago', status: 'completed' },
      { type: 'pot', title: 'Auto-saved to "Emergency Fund"', amount: '+25.00 SEI', time: '2 days ago', status: 'completed' }
    ],
    chartData: [
      { name: 'Jan', value: 850 },
      { name: 'Feb', value: 920 },
      { name: 'Mar', value: 1050 },
      { name: 'Apr', value: 1150 },
      { name: 'May', value: 1200 },
      { name: 'Jun', value: 1250 }
    ]
  };

  // Calculate portfolio metrics
  const portfolioValue = useMemo(() => {
    if (isDemoMode) return demoData.portfolioValue;
    
    if (!state.wallet?.balance || typeof state.wallet.balance !== 'number') return '0.00';
    const value = state.wallet.balance;
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [state.wallet?.balance, isDemoMode]);

  const walletBalance = useMemo(() => {
    if (isDemoMode) return demoData.walletBalance;
    
    if (!state.wallet?.balance || typeof state.wallet.balance !== 'number') return '0.00';
    const balance = state.wallet.balance;
    return balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }, [state.wallet?.balance, isDemoMode]);

  const dailyPnl = useMemo(() => {
    if (isDemoMode) return demoData.dailyPnl;
    
    // Calculate based on last 24h activity
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTransfers = state.transfers.filter(t => new Date(t.timestamp) > oneDayAgo);
    const pnl = recentTransfers.reduce((acc, transfer) => acc + transfer.amount, 0);
    return pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2);
  }, [state.transfers, isDemoMode]);

  const recentActivities = useMemo(() => {
    if (isDemoMode) return demoData.activities;
    
    const allActivities: any[] = [
      ...state.transfers.map(t => ({
        type: 'transfer',
        title: `${t.type === 'received' ? 'Received from' : 'Sent to'} ${t.recipient || t.sender}`,
        amount: `${t.type === 'received' ? '+' : '-'}${t.amount} SEI`,
        time: new Date(t.timestamp).toLocaleString(),
        status: t.status
      })),
      ...state.groups.map(g => ({
        type: 'group',
        title: `Joined Group "${g.name}"`,
        amount: `+${g.contributedAmount} SEI`,
        time: new Date(g.createdAt).toLocaleString(),
        status: g.status
      })),
      ...state.vaults.map(v => ({
        type: 'vault',
        title: `Deposited to Vault "${v.name}"`,
        amount: `+${v.depositedAmount} SEI`,
        time: new Date(v.createdAt).toLocaleString(),
        status: v.status
      })),
    ];
    
    return allActivities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 4);
  }, [state.transfers, state.groups, state.vaults, isDemoMode]);

  // Generate portfolio chart data
  useEffect(() => {
    if (isDemoMode) {
      setPortfolioData(demoData.chartData);
      return;
    }

    const generatePortfolioHistory = () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const currentValue = Number(portfolioValue.replace(/,/g, ''));
      const data = months.map((month, index) => ({
        name: month,
        value: Math.max(100, currentValue * (0.6 + (index * 0.08))) // Mock growth curve
      }));
      setPortfolioData(data);
    };

    if (Number(portfolioValue.replace(/,/g, '')) > 0) {
      generatePortfolioHistory();
    }
  }, [portfolioValue, isDemoMode]);

  // Real-time data refresh
  const refreshData = async () => {
    if (!state.isWalletConnected && !isDemoMode) return;
    
    setIsRefreshing(true);
    try {
      if (!isDemoMode) {
        await Promise.all([
          actions.loadUserData(),
          actions.loadTransfers(),
          actions.loadVaults(),
          actions.loadGroups(),
          actions.loadPots(),
          actions.loadMarketData()
        ]);
      }
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

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, <span className="text-green-400">{isDemoMode ? 'DeFi Trader' : (state.user?.username || 'Trader')}</span>
            </h1>
            <p className="text-gray-400">
              {isDemoMode ? 
                "Here's your demo DeFi portfolio overview. Connect your wallet to see real data." :
                "Here's your real-time DeFi portfolio overview."
              }
            </p>
          </motion.div>
        </div>

        <div className="flex items-center space-x-4">
          {isDemoMode && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg px-4 py-2">
              <span className="text-yellow-400 text-sm font-medium">Demo Mode</span>
            </div>
          )}
          
          <NeonButton
            variant="outline"
            color="blue"
            onClick={refreshData}
            disabled={isRefreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </NeonButton>

          {!isDemoMode ? (
            <div className="space-y-2">
              <NeonButton color="green" onClick={() => onNavigate?.('payments')}>
                New Transfer
              </NeonButton>
              <NeonButton 
                variant="outline" 
                color="purple" 
                onClick={() => onNavigate?.('vaults')}
              >
                Manage Vaults
              </NeonButton>
            </div>
          ) : (
            <div className="space-y-2">
              <NeonButton 
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
                  'Connect Keplr'
                )}
              </NeonButton>
              <NeonButton 
                variant="outline" 
                color="purple"
                onClick={() => actions.connectWallet('leap')}
                disabled={state.isLoading}
              >
                Connect Leap
              </NeonButton>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Portfolio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Portfolio</p>
                  <p className="text-2xl font-bold text-white">{portfolioValue} SEI</p>
                  <p className="text-gray-400 text-xs">Wallet: {walletBalance} SEI</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">--</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Daily P&L */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Daily P&L</p>
                  <p className="text-2xl font-bold text-white">{dailyPnl} SEI</p>
                  <p className="text-gray-400 text-xs">Profitable today</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-green-400">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm">--</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Active Vaults */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Active Vaults</p>
                  <p className="text-2xl font-bold text-white">{isDemoMode ? demoData.activeVaults : state.vaults.length}</p>
                  <p className="text-purple-400 text-xs text-white">Running</p>
                  <p className="text-gray-400 text-xs">Avg APY: --</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Group Pools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Group Pools</p>
                  <p className="text-2xl font-bold text-white">{isDemoMode ? demoData.groupPools : state.groups.length}</p>
                  <p className="text-orange-400 text-xs">Active</p>
                  <p className="text-gray-400 text-xs">Total contributed: 0.00 SEI</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Portfolio Performance Chart */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Portfolio Performance</h3>
                  <p className="text-gray-400 text-sm">
                    {isDemoMode ? 'Demo portfolio tracking' : 'Real-time portfolio tracking'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Current Value</p>
                  <p className="text-2xl font-bold text-green-400">{portfolioValue} SEI</p>
                  <p className="text-gray-400 text-sm">Total Return</p>
                  <p className="text-lg font-bold text-white">--</p>
                </div>
              </div>

              {portfolioData.length > 0 ? (
                <LineChart 
                  data={portfolioData} 
                  height={300}
                  color={colors.green[400]}
                />
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                      <PieChart className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-500">No portfolio data available</p>
                    <p className="text-gray-600 text-sm">
                      {isDemoMode ? 
                        "Start using DeFi features to see your performance" :
                        "Connect your wallet and start trading to see performance"
                      }
                    </p>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* Quick Actions & Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <NeonButton 
                  className="w-full justify-start" 
                  variant="outline" 
                  color="green"
                  onClick={() => onNavigate?.('payments')}
                >
                  Create Transfer
                </NeonButton>
                <NeonButton 
                  className="w-full justify-start" 
                  variant="outline" 
                  color="purple"
                  onClick={() => onNavigate?.('vaults')}
                >
                  Deposit to Vault
                </NeonButton>
                <NeonButton 
                  className="w-full justify-start" 
                  variant="outline" 
                  color="orange"
                  onClick={() => onNavigate?.('groups')}
                >
                  Join Group Pool
                </NeonButton>
                <NeonButton 
                  className="w-full justify-start" 
                  variant="outline" 
                  color="blue"
                  onClick={() => onNavigate?.('pots')}
                >
                  Create Savings Pot
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* Savings Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Savings Goals</h3>
              {isDemoMode ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white text-sm">Emergency Fund</span>
                      <span className="text-gray-400 text-sm">65%</span>
                    </div>
                    <CircularProgress progress={65} color="green" size={60} />
                    <p className="text-gray-400 text-xs mt-2">650 / 1,000 SEI</p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white text-sm">Vacation Fund</span>
                      <span className="text-gray-400 text-sm">32%</span>
                    </div>
                    <CircularProgress progress={32} color="purple" size={60} />
                    <p className="text-gray-400 text-xs mt-2">160 / 500 SEI</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-6 h-6 text-gray-500" />
                  </div>
                  <p className="text-gray-500 text-sm">No savings goals yet</p>
                  <NeonButton 
                    size="sm" 
                    color="green" 
                    className="mt-3"
                    onClick={() => onNavigate?.('pots')}
                  >
                    Create Goal
                  </NeonButton>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            <NeonButton 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate?.('payments')}
            >
              View All
            </NeonButton>
          </div>

          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.type === 'transfer' ? 'bg-blue-500/20 text-blue-400' :
                      activity.type === 'group' ? 'bg-orange-500/20 text-orange-400' :
                      activity.type === 'vault' ? 'bg-purple-500/20 text-purple-400' :
                      activity.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                      'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {activity.type === 'transfer' ? <ArrowUpRight className="w-5 h-5" /> :
                       activity.type === 'group' ? <Users className="w-5 h-5" /> :
                       activity.type === 'vault' ? <PieChart className="w-5 h-5" /> :
                       activity.type === 'deposit' ? <TrendingUp className="w-5 h-5" /> :
                       <DollarSign className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{activity.title}</p>
                      <p className="text-gray-400 text-sm">{activity.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${activity.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {activity.amount}
                    </p>
                    <p className={`text-xs ${
                      activity.status === 'completed' ? 'text-green-400' :
                      activity.status === 'pending' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {activity.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-500">No recent activity</p>
              <p className="text-gray-600 text-sm">
                {isDemoMode ? 
                  "Your transactions and activities will appear here" :
                  "Start using DeFi features to see your activity"
                }
              </p>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Integration Status */}
      <IntegrationStatus />

      {/* Test Scenarios (Development Mode) */}
      {process.env.NODE_ENV === 'development' && (
        <TestScenarios onNavigate={onNavigate} />
      )}

      {/* Sei Network Guide */}
      <SeiNetworkGuide />

      {/* Refresh indicator */}
      {lastRefresh && (
        <div className="fixed bottom-4 right-4">
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2">
            <p className="text-green-400 text-sm">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
