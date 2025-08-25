import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { LineChart } from '../charts/LineChart';
import { useApp } from '../../contexts/AppContext';
import { colors } from '../../lib/colors';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownLeft,
  Loader2,
  RefreshCw,
  AlertCircle,
  Info,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';

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
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const [depositModal, setDepositModal] = useState<DepositModalData | null>(null);
  const [withdrawModal, setWithdrawModal] = useState<WithdrawModalData | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [userPositions, setUserPositions] = useState<VaultPosition[]>([]);

  // Calculate total portfolio value in vaults
  const totalVaultValue = useMemo(() => {
    return userPositions.reduce((total, position) => total + position.value, 0);
  }, [userPositions]);

  // Calculate total PnL
  const totalPnL = useMemo(() => {
    return userPositions.reduce((total, position) => total + position.pnl, 0);
  }, [userPositions]);

  // Get vault statistics
  const vaultStats = useMemo(() => {
    const activeVaults = state.vaults.filter(v => v.isActive);
    const totalTvl = activeVaults.reduce((sum, v) => sum + v.tvl, 0);
    const avgApy = activeVaults.length > 0 ? 
      activeVaults.reduce((sum, v) => sum + v.apy, 0) / activeVaults.length : 0;
    
    return {
      totalVaults: activeVaults.length,
      totalTvl,
      avgApy,
      userPositions: userPositions.length
    };
  }, [state.vaults, userPositions]);

  // Mock user positions (replace with real data from contracts)
  useEffect(() => {
    if (state.isWalletConnected && state.vaults.length > 0) {
      // Mock positions - replace with real contract queries
      const mockPositions: VaultPosition[] = state.vaults.slice(0, 2).map((vault, index) => ({
        vaultId: vault.id,
        shares: 100 + index * 50,
        value: (100 + index * 50) * 1.15, // Mock 15% gain
        entryPrice: 1.0,
        pnl: (100 + index * 50) * 0.15,
        pnlPercentage: 15,
        depositedAt: new Date(Date.now() - (index + 1) * 7 * 24 * 60 * 60 * 1000)
      }));
      setUserPositions(mockPositions);
    }
  }, [state.isWalletConnected, state.vaults]);

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

    if (state.wallet && amount > state.wallet.balance) {
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

  // Auto-refresh vault data
  useEffect(() => {
    if (state.isWalletConnected) {
      const interval = setInterval(() => {
        actions.loadVaults();
      }, 60000); // Refresh every minute
      
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
            AI <NeonText color="purple" glow>Vaults</NeonText>
          </h1>
          <p className="mt-2" style={{ color: colors.textMuted }}>
            Automated DeFi strategies with AI-powered optimization
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => actions.loadVaults()}
            disabled={state.isLoading}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-gray-400 hover:text-white"
          >
            <RefreshCw 
              size={16} 
              className={state.isLoading ? 'animate-spin' : ''} 
            />
          </button>
          <div className="text-right">
            <p className="text-sm" style={{ color: colors.textMuted }}>Total Portfolio</p>
            <p className="text-xl font-bold" style={{ color: colors.neonPurple }}>
              {totalVaultValue.toFixed(2)} SEI
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
                  `${vaultStats.totalTvl.toFixed(0)} SEI`
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
                  `${vaultStats.avgApy.toFixed(1)}%`
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
                    {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} SEI
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
                          {position.value.toFixed(2)} SEI
                        </p>
                        <p className={`text-sm ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {position.pnl >= 0 ? '+' : ''}{position.pnl.toFixed(2)} SEI ({position.pnlPercentage >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(1)}%)
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
          ) : state.vaults.length === 0 ? (
            <div className="text-center py-12">
              <PieChart size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
              <p className="text-lg text-white mb-2">No vaults available</p>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Vaults will appear here when they are deployed
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.vaults.filter(vault => vault.isActive).map((vault, index) => {
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
                            {vault.apy.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm" style={{ color: colors.textMuted }}>TVL</span>
                          <span className="text-sm text-white">
                            {vault.tvl.toFixed(0)} SEI
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm" style={{ color: colors.textMuted }}>Min Deposit</span>
                          <span className="text-sm text-white">
                            {vault.minDeposit} SEI
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
                                {userPosition.value.toFixed(2)} SEI
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs" style={{ color: colors.textMuted }}>P&L</span>
                              <span className={`text-xs font-medium ${userPosition.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {userPosition.pnl >= 0 ? '+' : ''}{userPosition.pnl.toFixed(2)} SEI
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
                          disabled={!state.isWalletConnected}
                          onClick={() => setDepositModal({ vaultId: vault.id, amount: vault.minDeposit.toString(), isProcessing: false })}
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