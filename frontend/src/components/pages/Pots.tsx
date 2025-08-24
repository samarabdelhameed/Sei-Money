import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Plus, Target, TrendingUp, Calendar, Zap } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { CircularProgress } from '../charts/CircularProgress';
import { LineChart } from '../charts/LineChart';
import { colors } from '../../lib/colors';

const mockPots = [
  {
    id: '1',
    name: 'Vacation Fund',
    targetAmount: 5000,
    currentAmount: 3250,
    category: 'vacation',
    autoSaveEnabled: true,
    autoSaveAmount: 200,
    createdAt: '2024-01-15',
    targetDate: '2024-12-31',
    monthlyData: [
      { name: 'Jan', value: 500 },
      { name: 'Feb', value: 800 },
      { name: 'Mar', value: 1200 },
      { name: 'Apr', value: 1600 },
      { name: 'May', value: 2100 },
      { name: 'Jun', value: 2650 },
      { name: 'Jul', value: 3250 },
    ]
  },
  {
    id: '2',
    name: 'New Car',
    targetAmount: 15000,
    currentAmount: 4500,
    category: 'car',
    autoSaveEnabled: false,
    autoSaveAmount: 0,
    createdAt: '2024-03-01',
    targetDate: '2025-06-30',
    monthlyData: []
  },
  {
    id: '3',
    name: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 8750,
    category: 'investment',
    autoSaveEnabled: true,
    autoSaveAmount: 500,
    createdAt: '2023-12-01',
    targetDate: '2024-12-31',
    monthlyData: []
  }
];

const categoryIcons = {
  vacation: '🏖️',
  car: '🚗',
  house: '🏠',
  investment: '📈',
  other: '💰'
};

const categoryColors = {
  vacation: colors.neonGreen,
  car: colors.neonPurple,
  house: colors.warning,
  investment: colors.neonGreen,
  other: colors.textMuted
};

export const Pots: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPot, setSelectedPot] = useState(mockPots[0]);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    category: 'vacation',
    targetDate: '',
    autoSaveEnabled: false,
    autoSaveAmount: ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating pot:', formData);
    setShowCreateForm(false);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
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
        <GlassCard glow="green" className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientGreen }}
            >
              <PiggyBank size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Total Saved</p>
              <p className="text-xl font-bold text-white">$16,500</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard glow="purple" className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: colors.gradientPurple }}
            >
              <Target size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Active Pots</p>
              <p className="text-xl font-bold text-white">3</p>
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
              <p className="text-sm" style={{ color: colors.textMuted }}>Monthly Growth</p>
              <p className="text-xl font-bold text-white">+12.5%</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${colors.warning}, ${colors.warning}dd)` }}
            >
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm" style={{ color: colors.textMuted }}>Auto-Save</p>
              <p className="text-xl font-bold text-white">$700/mo</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockPots.map((pot, index) => {
              const progress = getProgressPercentage(pot.currentAmount, pot.targetAmount);
              const categoryColor = categoryColors[pot.category as keyof typeof categoryColors];
              
              return (
                <motion.div
                  key={pot.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                >
                  <GlassCard 
                    glow={progress >= 100 ? 'green' : 'purple'} 
                    className="p-6 cursor-pointer"
                    onClick={() => setSelectedPot(pot)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                          style={{ backgroundColor: `${categoryColor}20` }}
                        >
                          {categoryIcons[pot.category as keyof typeof categoryIcons]}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {pot.name}
                          </h3>
                          <p className="text-sm" style={{ color: colors.textMuted }}>
                            {pot.category.charAt(0).toUpperCase() + pot.category.slice(1)}
                          </p>
                        </div>
                      </div>
                      
                      {pot.autoSaveEnabled && (
                        <div 
                          className="px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1"
                          style={{ 
                            backgroundColor: `${colors.neonGreen}20`, 
                            color: colors.neonGreen 
                          }}
                        >
                          <Zap size={12} />
                          <span>Auto</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm" style={{ color: colors.textMuted }}>
                          Progress
                        </span>
                        <span className="text-sm font-medium text-white">
                          ${pot.currentAmount.toLocaleString()} / ${pot.targetAmount.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                        <motion.div
                          className="h-3 rounded-full"
                          style={{ 
                            background: progress >= 100 ? colors.gradientGreen : colors.gradientPurple 
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ delay: 0.8 + index * 0.1, duration: 1 }}
                        />
                      </div>
                      
                      <div className="text-right">
                        <span 
                          className="text-sm font-medium"
                          style={{ color: progress >= 100 ? colors.neonGreen : colors.neonPurple }}
                        >
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm" style={{ color: colors.textMuted }}>
                      <span>Target: {pot.targetDate ? new Date(pot.targetDate).toLocaleDateString() : 'No date'}</span>
                      {pot.autoSaveEnabled && (
                        <span>${pot.autoSaveAmount}/month</span>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <NeonButton size="sm" color="green" className="flex-1">
                        Add Funds
                      </NeonButton>
                      <NeonButton size="sm" variant="outline" color="purple">
                        Settings
                      </NeonButton>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Selected Pot Details */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ 
                  backgroundColor: `${categoryColors[selectedPot.category as keyof typeof categoryColors]}20` 
                }}
              >
                {categoryIcons[selectedPot.category as keyof typeof categoryIcons]}
              </div>
              <div>
                <NeonText size="lg" color="green">{selectedPot.name}</NeonText>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Created {new Date(selectedPot.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="text-center mb-6">
              <CircularProgress 
                progress={getProgressPercentage(selectedPot.currentAmount, selectedPot.targetAmount)}
                color="green"
                size={150}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Current Amount</span>
                <span className="text-white font-medium">
                  ${selectedPot.currentAmount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Target Amount</span>
                <span className="text-white font-medium">
                  ${selectedPot.targetAmount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span style={{ color: colors.textMuted }}>Remaining</span>
                <span style={{ color: colors.neonPurple }} className="font-medium">
                  ${(selectedPot.targetAmount - selectedPot.currentAmount).toLocaleString()}
                </span>
              </div>
              
              {selectedPot.targetDate && (
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Target Date</span>
                  <span className="text-white font-medium">
                    {new Date(selectedPot.targetDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {selectedPot.autoSaveEnabled && (
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Auto-Save</span>
                  <div className="flex items-center space-x-2">
                    <Zap size={16} style={{ color: colors.neonGreen }} />
                    <span style={{ color: colors.neonGreen }} className="font-medium">
                      ${selectedPot.autoSaveAmount}/month
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2 mt-6">
              <NeonButton className="flex-1" color="green">
                Add Funds
              </NeonButton>
              <NeonButton variant="outline" color="purple">
                Withdraw
              </NeonButton>
            </div>
          </GlassCard>

          {/* Progress Chart */}
          {selectedPot.monthlyData.length > 0 && (
            <GlassCard className="p-6">
              <NeonText size="lg" color="purple" className="mb-4">
                Savings Progress
              </NeonText>
              <LineChart 
                data={selectedPot.monthlyData} 
                color="green" 
                height={200}
                showGrid={false}
              />
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
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Pot Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter pot name"
                    className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Target Amount
                    </label>
                    <input
                      type="number"
                      value={formData.targetAmount}
                      onChange={(e) => handleInputChange('targetAmount', e.target.value)}
                      placeholder="0"
                      className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full p-3 rounded-lg border bg-transparent text-white"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                    >
                      <option value="vacation">Vacation</option>
                      <option value="car">Car</option>
                      <option value="house">House</option>
                      <option value="investment">Investment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => handleInputChange('targetDate', e.target.value)}
                    className="w-full p-3 rounded-lg border bg-transparent text-white"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoSave"
                    checked={formData.autoSaveEnabled}
                    onChange={(e) => handleInputChange('autoSaveEnabled', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="autoSave" className="text-sm text-white">
                    Enable Auto-Save
                  </label>
                </div>

                {formData.autoSaveEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Monthly Auto-Save Amount
                    </label>
                    <input
                      type="number"
                      value={formData.autoSaveAmount}
                      onChange={(e) => handleInputChange('autoSaveAmount', e.target.value)}
                      placeholder="0"
                      className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                    />
                  </div>
                )}

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
                    Create Pot
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};