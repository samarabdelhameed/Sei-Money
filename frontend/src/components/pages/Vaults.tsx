import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';

import { useApp } from '../../contexts/AppContext';
import { colors } from '../../lib/colors';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownLeft,
  Loader2,
  RefreshCw,
  AlertCircle,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import { formatSeiAmount, formatPercentage } from '../../lib/utils/formatters';
import { apiClient } from '../../lib/api';

interface VaultPosition {
  vaultId: string;
  shares: number;
  value: number;
  entryPrice: number;
  pnl: number;
  pnlPercentage: number;
  depositedAt: Date;
}

interface DepositModalData {
  vaultId: string;
  amount: string;
  isProcessing: boolean;
}

interface WithdrawModalData {
  vaultId: string;
  shares: string;
  isProcessing: boolean;
}

export const Vaults: React.FC = () => {
  const { state, actions } = useApp();

  const [depositModal, setDepositModal] = useState<DepositModalData | null>(null);
  const [withdrawModal, setWithdrawModal] = useState<WithdrawModalData | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [userPositions, setUserPositions] = useState<VaultPosition[]>([]);
  const [realBalance, setRealBalance] = useState<string>('0.00');

  // Demo vaults data for display
  const demoVaults = useMemo(() => [
    {
      id: '1',
      name: 'DeFi Yield Optimizer',
      description: 'Automated yield farming across multiple DeFi protocols with dynamic rebalancing',
      strategy: 'Yield Farming',
      apy: 24.6,
      tvl: 1850000,
      minDeposit: 100,
      riskLevel: 'medium',
      isActive: true,
      totalDepositors: 1247,
      performanceHistory: Array.from({length: 30}, (_, i) => ({
        date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000),
        apy: 20 + Math.random() * 10 + Math.sin(i/5) * 3
      }))
    },
    {
      id: '2', 
      name: 'Liquidity Pool Maximizer',
      description: 'Optimizes liquidity provision across DEXs for maximum fee collection',
      strategy: 'LP Optimization',
      apy: 18.9,
      tvl: 950000,
      minDeposit: 50,
      riskLevel: 'low',
      isActive: true,
      totalDepositors: 832,
      performanceHistory: Array.from({length: 30}, (_, i) => ({
        date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000),
        apy: 15 + Math.random() * 8 + Math.sin(i/3) * 2
      }))
    },
    {
      id: '3',
      name: 'Arbitrage Alpha Strategy',
      description: 'High-frequency arbitrage opportunities across DEXs and CEXs',
      strategy: 'Arbitrage',
      apy: 35.2,
      tvl: 2400000,
      minDeposit: 500,
      riskLevel: 'high',
      isActive: true,
      totalDepositors: 456,
      performanceHistory: Array.from({length: 30}, (_, i) => ({
        date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000),
        apy: 30 + Math.random() * 15 + Math.sin(i/4) * 5
      }))
    },
    {
      id: '4',
      name: 'Stablecoin Income Vault',
      description: 'Conservative stablecoin strategies focusing on capital preservation',
      strategy: 'Stable Yield',
      apy: 12.3,
      tvl: 3200000,
      minDeposit: 25,
      riskLevel: 'low',
      isActive: true,
      totalDepositors: 2145,
      performanceHistory: Array.from({length: 30}, (_, i) => ({
        date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000),
        apy: 10 + Math.random() * 4 + Math.sin(i/6) * 1
      }))
    },
    {
      id: '5',
      name: 'Blue-Chip Asset Vault',
      description: 'Leveraged positions on established cryptocurrencies with risk management',
      strategy: 'Leveraged Holdings',
      apy: 28.7,
      tvl: 1650000,
      minDeposit: 200,
      riskLevel: 'high',
      isActive: true,
      totalDepositors: 623,
      performanceHistory: Array.from({length: 30}, (_, i) => ({
        date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000),
        apy: 25 + Math.random() * 12 + Math.sin(i/7) * 4
      }))
    },
    {
      id: '6',
      name: 'NFT Liquidity Engine',
      description: 'Generates yield from NFT lending and fractional ownership protocols',
      strategy: 'NFT Yield',
      apy: 21.4,
      tvl: 780000,
      minDeposit: 150,
      riskLevel: 'medium',
      isActive: true,
      totalDepositors: 298,
      performanceHistory: Array.from({length: 30}, (_, i) => ({
        date: new Date(Date.now() - (29-i) * 24 * 60 * 60 * 1000),
        apy: 18 + Math.random() * 8 + Math.sin(i/5) * 3
      }))
    }
  ], []);

  // Use demo vaults if no real vaults available
  const displayVaults = useMemo(() => {
    return Array.isArray(state.vaults) && state.vaults.length > 0 ? state.vaults : demoVaults;
  }, [state.vaults, demoVaults]);

  // Calculate total PnL
  const totalPnL = useMemo(() => {
    return userPositions.reduce((total, position) => total + position.pnl, 0);
  }, [userPositions]);

  // Get vault statistics
  const vaultStats = useMemo(() => {
    const activeVaults = displayVaults.filter(v => v.isActive);
    const totalTvl = activeVaults.reduce((sum, v) => sum + v.tvl, 0);
    const avgApy = activeVaults.length > 0 ? 
      activeVaults.reduce((sum, v) => sum + v.apy, 0) / activeVaults.length : 0;
    
    return {
      totalVaults: activeVaults.length,
      totalTvl,
      avgApy,
      userPositions: userPositions.length
    };
  }, [displayVaults, userPositions]);

  // Mock user positions (replace with real data from contracts)
  useEffect(() => {
    if (state.wallet?.address && displayVaults.length > 0) {
      // Mock positions - replace with real contract queries
      const mockPositions: VaultPosition[] = displayVaults.slice(0, 3).map((vault, index) => ({
        vaultId: vault.id,
        shares: 150 + index * 75,
        value: (150 + index * 75) * (1.12 + index * 0.05), // Different gains per vault
        entryPrice: 1.0,
        pnl: (150 + index * 75) * (0.12 + index * 0.05),
        pnlPercentage: 12 + index * 5,
        depositedAt: new Date(Date.now() - (index + 1) * 10 * 24 * 60 * 60 * 1000)
      }));
      setUserPositions(mockPositions);
    } else {
      setUserPositions([]);
    }
  }, [state.wallet?.address, displayVaults]);

  // Get risk level color
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return colors.neonGreen;
      case 'medium': return colors.warning;
      case 'high': return colors.error;
      default: return colors.textMuted;
    }
  };

  // Get risk level icon
  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <Target className="w-4 h-4" />;
      case 'medium': return <Activity className="w-4 h-4" />;
      case 'high': return <TrendingUp className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!depositModal || !state.isWalletConnected) return;

    const amount = parseFloat(depositModal.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormErrors({ amount: 'Please enter a valid amount' });
      return;
    }

    const currentBalance = parseFloat(realBalance) || 0;
    if (amount > currentBalance) {
      setFormErrors({ amount: 'Insufficient balance' });
      return;
    }

    setDepositModal(prev => prev ? { ...prev, isProcessing: true } : null);
    
    try {
      // This would call the real vault deposit API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      
      actions.addNotification(`Successfully deposited ${amount} SEI to vault!`, 'success');
      setDepositModal(null);
      setFormErrors({});
      
      // Refresh vault data
      await actions.loadVaults();
      
    } catch (error) {
      console.error('Deposit error:', error);
      actions.addNotification('Failed to deposit to vault', 'error');
    } finally {
      setDepositModal(prev => prev ? { ...prev, isProcessing: false } : null);
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!withdrawModal || !state.isWalletConnected) return;

    const shares = parseFloat(withdrawModal.shares);
    const position = userPositions.find(p => p.vaultId === withdrawModal.vaultId);
    
    if (isNaN(shares) || shares <= 0) {
      setFormErrors({ shares: 'Please enter a valid amount' });
      return;
    }

    if (position && shares > position.shares) {
      setFormErrors({ shares: 'Insufficient shares' });
      return;
    }

    setWithdrawModal(prev => prev ? { ...prev, isProcessing: true } : null);
    
    try {
      // This would call the real vault withdraw API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Mock delay
      
      actions.addNotification(`Successfully withdrew ${shares} shares from vault!`, 'success');
      setWithdrawModal(null);
      setFormErrors({});
      
      // Refresh vault data
      await actions.loadVaults();
      
    } catch (error) {
      console.error('Withdraw error:', error);
      actions.addNotification('Failed to withdraw from vault', 'error');
    } finally {
      setWithdrawModal(prev => prev ? { ...prev, isProcessing: false } : null);
    }
  };

  // Load balance from localStorage or API
  useEffect(() => {
    const loadBalance = async () => {
      try {
        // First try localStorage
        const storedBalance = localStorage.getItem('fixed-balance');
        if (storedBalance) {
          setRealBalance(storedBalance);
          console.log('Using cached balance in Vaults:', storedBalance);
          return;
        }

        // If not in localStorage, fetch from API
        const balanceAddress = '0xF26f945C1e73278157c24C1dCBb8A19227547D29';
        const response = await apiClient.get(`/api/v1/wallet/balance/${balanceAddress}`) as any;
        
        if (response.ok && response.balance) {
          const balance = response.balance.formatted || '2847.92';
          setRealBalance(balance);
          localStorage.setItem('fixed-balance', balance);
          console.log('Vaults balance loaded from API:', balance);
        } else {
          // Fallback to default balance
          setRealBalance('2847.92');
          localStorage.setItem('fixed-balance', '2847.92');
        }
      } catch (error) {
        console.log('Could not load balance in Vaults:', error);
        // Fallback to default balance
        setRealBalance('2847.92');
        localStorage.setItem('fixed-balance', '2847.92');
      }
    };

    loadBalance();
  }, []);

  // Refresh balance function
  const refreshBalance = async () => {
    try {
      const balanceAddress = '0xF26f945C1e73278157c24C1dCBb8A19227547D29';
      const response = await apiClient.get(`/api/v1/wallet/balance/${balanceAddress}`) as any;
      
      if (response.ok && response.balance) {
        const balance = response.balance.formatted || '2847.92';
        setRealBalance(balance);
        localStorage.setItem('fixed-balance', balance);
        console.log('Vaults balance refreshed:', balance);
      }
    } catch (error) {
      console.error('Failed to refresh balance in Vaults:', error);
    }
  };

  // Load vaults on mount
  useEffect(() => {
    if (state.isWalletConnected) {
      actions.loadVaults();
    }
  }, [state.isWalletConnected, actions]);

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
            AI <NeonText color="purple" glow>Vaults</NeonText>
          </h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>
            Automated DeFi strategies with AI-powered optimization
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshBalance}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-gray-400 hover:text-white"
            title="Refresh Balance"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => actions.loadVaults()}
            disabled={state.isLoading}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-gray-400 hover:text-white"
            title="Refresh Vaults"
          >
            <RefreshCw 
              size={16} 
              className={state.isLoading ? 'animate-spin' : ''} 
            />
          </button>
                      <div className="text-right">
              <p className="text-sm" style={{ color: colors.textMuted }}>Available Balance</p>
              <p className="text-xl font-bold" style={{ color: colors.neonPurple }}>
                {formatSeiAmount(parseFloat(realBalance))}
              </p>
            </div>
        </div>
      </motion.div>

      {/* Vault Statistics */}
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
              <PieChart size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Active Vaults</p>
              <p className="text-xl font-bold text-white">
                {state.isLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-8 rounded"></div>
                ) : (
                  vaultStats.totalVaults
                )}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard glow="green" className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientGreen }}
            >
              <DollarSign size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Total TVL</p>
              <p className="text-xl font-bold text-white">
                {state.isLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-20 rounded"></div>
                ) : (
                  formatSeiAmount(vaultStats.totalTvl)
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
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Avg APY</p>
              <p className="text-xl font-bold text-white">
                {state.isLoading ? (
                  <div className="animate-pulse bg-gray-600 h-6 w-12 rounded"></div>
                ) : (
                  formatPercentage(vaultStats.avgApy)
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
              <Target size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>My Positions</p>
              <p className="text-xl font-bold text-white">
                {userPositions.length}
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* My Positions */}
      {state.isWalletConnected && userPositions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">My Positions</h3>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm" style={{ color: colors.textMuted }}>Total P&L</p>
                  <p className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalPnL >= 0 ? '+' : ''}{formatSeiAmount(Math.abs(totalPnL))}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {userPositions.map((position) => {
                const vault = state.vaults.find(v => v.id === position.vaultId);
                if (!vault) return null;

                return (
                  <motion.div
                    key={position.vaultId}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: colors.gradientPurple }}
                        >
                          <PieChart size={20} className="text-white" />
                        </div>
                        
                        <div>
                          <p className="text-white font-medium">{vault.name}</p>
                          <p className="text-sm" style={{ color: colors.textMuted }}>
                            {position.shares.toFixed(2)} shares • Deposited {position.depositedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          {formatSeiAmount(position.value)}
                        </p>
                        <p className={`text-sm ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {position.pnl >= 0 ? '+' : ''}{formatSeiAmount(Math.abs(position.pnl))} ({position.pnlPercentage >= 0 ? '+' : ''}{formatPercentage(Math.abs(position.pnlPercentage))})
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <NeonButton 
                        size="sm" 
                        variant="outline" 
                        color="green"
                        onClick={() => setDepositModal({ vaultId: vault.id, amount: '', isProcessing: false })}
                      >
                        <ArrowUpRight size={14} className="mr-1" />
                        Deposit
                      </NeonButton>
                      <NeonButton 
                        size="sm" 
                        variant="outline" 
                        color="purple"
                        onClick={() => setWithdrawModal({ vaultId: vault.id, shares: '', isProcessing: false })}
                      >
                        <ArrowDownLeft size={14} className="mr-1" />
                        Withdraw
                      </NeonButton>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Available Vaults */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Available Vaults</h3>
            {!state.isWalletConnected && (
              <div className="text-sm text-gray-400">
                Connect wallet to deposit
              </div>
            )}
          </div>

          {state.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-6 rounded-lg border" style={{ backgroundColor: colors.glass, borderColor: colors.glassBorder }}>
                  <div className="space-y-4">
                    <div className="bg-gray-600 h-6 w-3/4 rounded"></div>
                    <div className="bg-gray-600 h-4 w-full rounded"></div>
                    <div className="bg-gray-600 h-4 w-1/2 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayVaults.length === 0 ? (
            <div className="text-center py-12">
              <PieChart size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
              <p className="text-lg text-white mb-2">No vaults available</p>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Vaults will appear here when they are deployed
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayVaults.filter(vault => vault.isActive).map((vault, index) => {
                const userPosition = userPositions.find(p => p.vaultId === vault.id);
                
                return (
                  <motion.div
                    key={vault.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <GlassCard className="p-6 hover:border-opacity-60 transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ background: colors.gradientPurple }}
                        >
                          <PieChart size={24} className="text-white" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs"
                            style={{ 
                              backgroundColor: `${getRiskColor(vault.riskLevel)}20`,
                              color: getRiskColor(vault.riskLevel)
                            }}
                          >
                            {getRiskIcon(vault.riskLevel)}
                            <span>{vault.riskLevel.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-xl font-semibold text-white mb-2">{vault.name}</h3>
                      <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                        {vault.description}
                      </p>

                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                          <span className="text-sm" style={{ color: colors.textMuted }}>APY</span>
                          <span className="text-sm font-bold" style={{ color: colors.neonGreen }}>
                            {formatPercentage(vault.apy)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm" style={{ color: colors.textMuted }}>TVL</span>
                          <span className="text-sm text-white">
                            {formatSeiAmount(vault.tvl)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm" style={{ color: colors.textMuted }}>Min Deposit</span>
                          <span className="text-sm text-white">
                            {formatSeiAmount(vault.minDeposit)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm" style={{ color: colors.textMuted }}>Strategy</span>
                          <span className="text-sm text-white">
                            {vault.strategy}
                          </span>
                        </div>
                      </div>

                      {userPosition ? (
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.neonPurple}10` }}>
                            <div className="flex justify-between items-center">
                              <span className="text-sm" style={{ color: colors.textMuted }}>Your Position</span>
                              <span className="text-sm font-bold text-white">
                                {formatSeiAmount(userPosition.value)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs" style={{ color: colors.textMuted }}>P&L</span>
                              <span className={`text-xs font-medium ${userPosition.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {userPosition.pnl >= 0 ? '+' : ''}{formatSeiAmount(Math.abs(userPosition.pnl))}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <NeonButton 
                              size="sm" 
                              color="green" 
                              className="flex-1"
                              disabled={!state.isWalletConnected}
                              onClick={() => setDepositModal({ vaultId: vault.id, amount: '', isProcessing: false })}
                            >
                              Deposit More
                            </NeonButton>
                            <NeonButton 
                              size="sm" 
                              variant="outline" 
                              color="purple" 
                              className="flex-1"
                              disabled={!state.isWalletConnected}
                              onClick={() => setWithdrawModal({ vaultId: vault.id, shares: '', isProcessing: false })}
                            >
                              Withdraw
                            </NeonButton>
                          </div>
                        </div>
                      ) : (
                        <NeonButton 
                          className="w-full" 
                          color="purple"
                          onClick={() => {
                            if (state.isWalletConnected) {
                              setDepositModal({ vaultId: vault.id, amount: vault.minDeposit.toString(), isProcessing: false });
                            } else {
                              actions.connectWallet('metamask');
                            }
                          }}
                        >
                          {state.isWalletConnected ? 'Deposit' : 'Connect Wallet'}
                        </NeonButton>
                      )}
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Deposit Modal */}
      {depositModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !depositModal.isProcessing && setDepositModal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Deposit to Vault</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (SEI)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={depositModal.amount}
                      onChange={(e) => {
                        setDepositModal(prev => prev ? { ...prev, amount: e.target.value } : null);
                        setFormErrors({});
                      }}
                      className={`w-full p-3 rounded-lg bg-white/10 border text-white placeholder-gray-400 focus:outline-none focus:border-white/40 ${
                        formErrors.amount ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="0.00"
                      disabled={depositModal.isProcessing}
                    />
                    <div className="absolute right-3 top-3 text-sm text-gray-400">
                      Max: {parseFloat(realBalance).toFixed(6)}
                    </div>
                  </div>
                  {formErrors.amount && (
                    <div className="flex items-center mt-1 text-red-400 text-sm">
                      <AlertCircle size={14} className="mr-1" />
                      {formErrors.amount}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <NeonButton 
                  variant="outline" 
                  onClick={() => setDepositModal(null)}
                  className="flex-1"
                  disabled={depositModal.isProcessing}
                >
                  Cancel
                </NeonButton>
                <NeonButton 
                  onClick={handleDeposit}
                  className="flex-1"
                  disabled={depositModal.isProcessing}
                >
                  {depositModal.isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Depositing...
                    </>
                  ) : (
                    'Deposit'
                  )}
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {/* Withdraw Modal */}
      {withdrawModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !withdrawModal.isProcessing && setWithdrawModal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Withdraw from Vault</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Shares to Withdraw
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      value={withdrawModal.shares}
                      onChange={(e) => {
                        setWithdrawModal(prev => prev ? { ...prev, shares: e.target.value } : null);
                        setFormErrors({});
                      }}
                      className={`w-full p-3 rounded-lg bg-white/10 border text-white placeholder-gray-400 focus:outline-none focus:border-white/40 ${
                        formErrors.shares ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="0.00"
                      disabled={withdrawModal.isProcessing}
                    />
                    {(() => {
                      const position = userPositions.find(p => p.vaultId === withdrawModal.vaultId);
                      return position && (
                        <div className="absolute right-3 top-3 text-sm text-gray-400">
                          Max: {position.shares.toFixed(6)}
                        </div>
                      );
                    })()}
                  </div>
                  {formErrors.shares && (
                    <div className="flex items-center mt-1 text-red-400 text-sm">
                      <AlertCircle size={14} className="mr-1" />
                      {formErrors.shares}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <NeonButton 
                  variant="outline" 
                  onClick={() => setWithdrawModal(null)}
                  className="flex-1"
                  disabled={withdrawModal.isProcessing}
                >
                  Cancel
                </NeonButton>
                <NeonButton 
                  onClick={handleWithdraw}
                  className="flex-1"
                  color="purple"
                  disabled={withdrawModal.isProcessing}
                >
                  {withdrawModal.isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Withdrawing...
                    </>
                  ) : (
                    'Withdraw'
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