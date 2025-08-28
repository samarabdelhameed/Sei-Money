import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Plus, Target, TrendingUp, Calendar, Zap, X, Edit, Trash2 } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { CircularProgress } from '../charts/CircularProgress';
import { colors } from '../../lib/colors';
import { useApp } from '../../contexts/AppContext';
import { 
  formatSeiAmount, 
  formatPercentage,
  formatTime 
} from '../../lib/utils/formatters';

export function Pots() {
  const { state, actions } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPot, setSelectedPot] = useState<any>(null);

  // Demo pots data for display
  const demoPots = useMemo(() => [
    {
      id: '1',
      name: 'Emergency Fund',
      description: 'Building a 6-month emergency fund for financial security',
      targetAmount: 15000,
      currentAmount: 8250,
      autoSaveAmount: 500,
      autoSaveFrequency: 'monthly',
      status: 'active',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'safety',
      color: 'green'
    },
    {
      id: '2',
      name: 'New Car Fund',
      description: 'Saving for a new electric vehicle upgrade',
      targetAmount: 25000,
      currentAmount: 12750,
      autoSaveAmount: 750,
      autoSaveFrequency: 'monthly',
      status: 'active',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'transportation',
      color: 'purple'
    },
    {
      id: '3',
      name: 'Vacation to Japan',
      description: 'Dream trip to Tokyo and Kyoto for 2 weeks',
      targetAmount: 8000,
      currentAmount: 6400,
      autoSaveAmount: 400,
      autoSaveFrequency: 'monthly',
      status: 'active',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'travel',
      color: 'pink'
    },
    {
      id: '4',
      name: 'Home Down Payment',
      description: 'Saving 20% down payment for first home purchase',
      targetAmount: 50000,
      currentAmount: 18500,
      autoSaveAmount: 1200,
      autoSaveFrequency: 'monthly',
      status: 'active',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'housing',
      color: 'orange'
    },
    {
      id: '5',
      name: 'Education Fund',
      description: 'Professional development courses and certifications',
      targetAmount: 5000,
      currentAmount: 4200,
      autoSaveAmount: 200,
      autoSaveFrequency: 'monthly',
      status: 'active',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'education',
      color: 'blue'
    },
    {
      id: '6',
      name: 'Wedding Fund',
      description: 'Perfect wedding celebration with family and friends',
      targetAmount: 30000,
      currentAmount: 30000,
      autoSaveAmount: 1000,
      autoSaveFrequency: 'monthly',
      status: 'completed',
      createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'life-events',
      color: 'green'
    }
  ], []);

  // Calculate pot statistics
  const potStats = useMemo(() => {
    // Use demo data if no real pots available
    const pots = (Array.isArray(state.pots) && state.pots.length > 0 ? state.pots : demoPots) as any[];
    
    const activePots = pots.filter(p => p.status === 'active');
    const totalSaved = pots.reduce((sum, p) => sum + p.currentAmount, 0);
    const totalAutoSave = activePots.reduce((sum, p) => sum + p.autoSaveAmount, 0);
    
    // Calculate monthly growth (simplified)
    const totalTarget = pots.reduce((sum, p) => sum + p.targetAmount, 0);
    const progressRate = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    const monthlyGrowth = progressRate > 0 ? Math.min(progressRate * 0.1, 15) : 0;

    return {
      activePots: activePots.length,
      totalSaved,
      monthlyGrowth,
      totalAutoSave
    };
  }, [state.pots, demoPots]);

  // Get filtered pots
  const displayPots = useMemo(() => {
    return Array.isArray(state.pots) && state.pots.length > 0 ? state.pots : demoPots;
  }, [state.pots, demoPots]) as any[];

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
          onClick={() => setShowCreateForm(true)}
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
                {formatSeiAmount(potStats.totalSaved)}
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
                {potStats.activePots}
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
                +{formatPercentage(potStats.monthlyGrowth)}
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
                {formatSeiAmount(potStats.totalAutoSave)} per month
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
          {/* Pots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayPots.map((pot, index) => (
              <motion.div
                key={pot.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <GlassCard 
                  className="p-6 cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => setSelectedPot(pot)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ 
                          background: pot.color === 'green' ? colors.gradientGreen : 
                                    pot.color === 'purple' ? colors.gradientPurple :
                                    pot.color === 'pink' ? colors.gradientPink :
                                    pot.color === 'orange' ? colors.gradientOrange :
                                    pot.color === 'blue' ? colors.gradientBlue :
                                    colors.gradientGreen
                        }}
                      >
                        <PiggyBank size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{pot.name}</h3>
                        <p className="text-sm" style={{ color: colors.textMuted }}>
                          {pot.description.length > 40 ? pot.description.substring(0, 40) + '...' : pot.description}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pot.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}>
                      {pot.status === 'completed' ? '✓ Complete' : '🎯 Active'}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: colors.textMuted }}>Progress</span>
                      <span className="text-sm text-white font-medium">
                        {Math.round((pot.currentAmount / pot.targetAmount) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          background: pot.color === 'green' ? colors.gradientGreen : 
                                    pot.color === 'purple' ? colors.gradientPurple :
                                    pot.color === 'pink' ? colors.gradientPink :
                                    pot.color === 'orange' ? colors.gradientOrange :
                                    pot.color === 'blue' ? colors.gradientBlue :
                                    colors.gradientGreen,
                          width: `${Math.min((pot.currentAmount / pot.targetAmount) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Amount Info */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-bold">{formatSeiAmount(pot.currentAmount)}</p>
                      <p className="text-sm" style={{ color: colors.textMuted }}>
                        of {formatSeiAmount(pot.targetAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-400">+{formatSeiAmount(pot.autoSaveAmount)}</p>
                      <p className="text-xs" style={{ color: colors.textMuted }}>per month</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* No Wallet Connected (for when wallet is not connected) */}
          {!state.wallet?.address && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <GlassCard className="p-6 text-center mt-6">
              <PiggyBank size={48} className="mx-auto mb-4" style={{ color: colors.textMuted }} />
              <p className="text-white mb-2">Connect Your Wallet</p>
              <p style={{ color: colors.textMuted }} className="mb-4">
                  Connect your wallet to create and manage your own savings pots
              </p>
              <NeonButton onClick={() => actions.connectWallet('metamask')} color="green">
                Connect Wallet
              </NeonButton>
            </GlassCard>
            </motion.div>
          )}
        </motion.div>

        {/* Selected Pot Details */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {selectedPot ? (
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ 
                      background: selectedPot.color === 'green' ? colors.gradientGreen : 
                                selectedPot.color === 'purple' ? colors.gradientPurple :
                                selectedPot.color === 'pink' ? colors.gradientPink :
                                selectedPot.color === 'orange' ? colors.gradientOrange :
                                selectedPot.color === 'blue' ? colors.gradientBlue :
                                colors.gradientGreen
                    }}
                  >
                    <PiggyBank size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">{selectedPot.name}</h3>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      Created {formatTime(selectedPot.createdAt)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPot(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-white font-medium mb-2">Description</h4>
                  <p style={{ color: colors.textMuted }}>{selectedPot.description}</p>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-white font-medium">Progress</h4>
                    <span className="text-purple-400 font-bold">
                      {Math.round((selectedPot.currentAmount / selectedPot.targetAmount) * 100)}%
                    </span>
                  </div>
                  <CircularProgress 
                    progress={Math.round((selectedPot.currentAmount / selectedPot.targetAmount) * 100)}
                    color="green"
                    size={120}
                  />
                  <div className="text-center mt-4">
                    <p className="text-white font-bold text-lg">{formatSeiAmount(selectedPot.currentAmount)}</p>
                    <p className="text-sm" style={{ color: colors.textMuted }}>
                      of {formatSeiAmount(selectedPot.targetAmount)} goal
                    </p>
                  </div>
                </div>

                {/* Auto-Save Info */}
                <div className="bg-gray-800/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Zap size={16} className="text-yellow-400" />
                      <span className="text-white font-medium">Auto-Save</span>
                    </div>
                    <span className="text-green-400 font-bold">
                      {formatSeiAmount(selectedPot.autoSaveAmount)}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    Automatically saved every {selectedPot.autoSaveFrequency}
                  </p>
                </div>

                {/* Target Date */}
                <div className="bg-gray-800/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} className="text-blue-400" />
                      <span className="text-white font-medium">Target Date</span>
                    </div>
                    <span className="text-white">
                      {formatTime(selectedPot.targetDate)}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    {selectedPot.status === 'completed' ? 'Goal achieved!' : 'Estimated completion date'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {selectedPot.status === 'active' && (
                    <>
                      <NeonButton color="green" className="w-full">
                        <Plus size={16} className="mr-2" />
                        Add Money
                      </NeonButton>
                      <div className="grid grid-cols-2 gap-3">
                        <NeonButton variant="outline" color="purple" size="sm">
                          <Edit size={16} className="mr-2" />
                          Edit
                        </NeonButton>
                        <NeonButton variant="outline" color="orange" size="sm">
                          <Trash2 size={16} className="mr-2" />
                          Delete
                        </NeonButton>
                      </div>
                    </>
                  )}
                  {selectedPot.status === 'completed' && (
                    <div className="text-center p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 font-bold">🎉 Goal Achieved!</p>
                      <p className="text-sm" style={{ color: colors.textMuted }}>
                        Congratulations on reaching your savings target
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ) : (
          <GlassCard className="p-6 text-center">
            <PiggyBank size={48} className="mx-auto mb-4" style={{ color: colors.textMuted }} />
            <p className="text-white mb-2">Select a Pot</p>
            <p style={{ color: colors.textMuted }}>
              Choose a savings pot to view details and manage funds
            </p>
          </GlassCard>
          )}
        </motion.div>
      </div>

      {/* Create Pot Modal */}
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
            <GlassCard className="p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <NeonText size="lg" color="green">Create New Pot</NeonText>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Pot Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Emergency Fund"
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
                    placeholder="What are you saving for?"
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
                      Target Amount (SEI)
                    </label>
                    <input
                      type="number"
                      placeholder="10000"
                      className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Auto-Save (SEI)
                    </label>
                    <input
                      type="number"
                      placeholder="500"
                      className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Auto-Save Frequency
                  </label>
                  <select
                    className="w-full p-3 rounded-lg border bg-transparent text-white"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly" selected>Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Target Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-3 rounded-lg border bg-transparent text-white"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <NeonButton
                    variant="outline"
                    color="purple"
                    size="md"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </NeonButton>
                  <NeonButton
                    color="green"
                    size="md"
                    onClick={() => {
                      // Handle create pot
                      setShowCreateForm(false);
                      alert('Create Pot functionality will be implemented with backend integration!');
                    }}
                    className="flex-1"
                  >
                    <Plus size={16} className="mr-2" />
                    Create Pot
                  </NeonButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}