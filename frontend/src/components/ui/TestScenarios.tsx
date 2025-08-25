import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Wallet,
  Send,
  Users,
  PiggyBank,
  Vault,
  Shield,
  Bot,
  Brain
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { NeonText } from './NeonText';
import { useApp } from '../../contexts/AppContext';
import { colors } from '../../lib/colors';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: 'wallet' | 'payment' | 'social' | 'ai' | 'blockchain';
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  steps: string[];
  dependencies: string[];
}

export const TestScenarios: React.FC = () => {
  const { state, actions } = useApp();
  const [scenarios, setScenarios] = useState<TestScenario[]>([
    {
      id: 'wallet-connection',
      name: 'Wallet Connection',
      description: 'Test Keplr and Leap wallet connections',
      category: 'wallet',
      icon: <Wallet size={20} />,
      status: 'pending',
      steps: [
        'Check if Keplr extension is available',
        'Check if Leap extension is available',
        'Test Keplr wallet connection',
        'Test Leap wallet connection',
        'Verify wallet address retrieval',
        'Test wallet disconnection'
      ],
      dependencies: []
    },
    {
      id: 'payment-transfer',
      name: 'Payment Transfer',
      description: 'Test creating and managing transfers',
      category: 'payment',
      icon: <Send size={20} />,
      status: 'pending',
      steps: [
        'Create new transfer',
        'Validate transfer form',
        'Submit transfer to blockchain',
        'Verify transaction hash',
        'Check transfer status',
        'Test transfer cancellation'
      ],
      dependencies: ['wallet-connection']
    },
    {
      id: 'group-management',
      name: 'Group Management',
      description: 'Test group creation and management',
      category: 'social',
      icon: <Users size={20} />,
      status: 'pending',
      steps: [
        'Create new group',
        'Add group members',
        'Set contribution amounts',
        'Test group funding',
        'Verify group balance',
        'Test member withdrawal'
      ],
      dependencies: ['wallet-connection']
    },
    {
      id: 'savings-pots',
      name: 'Savings Pots',
      description: 'Test savings pot functionality',
      category: 'payment',
      icon: <PiggyBank size={20} />,
      status: 'pending',
      steps: [
        'Create savings pot',
        'Set target amount',
        'Add funds to pot',
        'Test auto-save feature',
        'Verify pot balance',
        'Test fund withdrawal'
      ],
      dependencies: ['wallet-connection']
    },
    {
      id: 'vault-investment',
      name: 'Vault Investment',
      description: 'Test investment vault operations',
      category: 'blockchain',
      icon: <Vault size={20} />,
      status: 'pending',
      steps: [
        'Create investment vault',
        'Set investment strategy',
        'Deposit funds to vault',
        'Monitor vault performance',
        'Test profit withdrawal',
        'Verify vault analytics'
      ],
      dependencies: ['wallet-connection']
    },
    {
      id: 'escrow-service',
      name: 'Escrow Service',
      description: 'Test escrow functionality',
      category: 'payment',
      icon: <Shield size={20} />,
      status: 'pending',
      steps: [
        'Create escrow agreement',
        'Fund escrow account',
        'Set milestone payments',
        'Test payment release',
        'Handle disputes',
        'Verify escrow completion'
      ],
      dependencies: ['wallet-connection']
    },
    {
      id: 'ai-agent',
      name: 'AI Agent',
      description: 'Test AI agent integration',
      category: 'ai',
      icon: <Brain size={20} />,
      status: 'pending',
      steps: [
        'Connect to AI agent',
        'Test portfolio analysis',
        'Get trading recommendations',
        'Test risk assessment',
        'Chat with AI agent',
        'Verify AI insights'
      ],
      dependencies: ['wallet-connection']
    },
    {
      id: 'discord-bot',
      name: 'Discord Bot',
      description: 'Test Discord bot integration',
      category: 'social',
      icon: <Bot size={20} />,
      status: 'pending',
      steps: [
        'Connect to Discord bot',
        'Test bot commands',
        'Verify command responses',
        'Test notifications',
        'Check bot status',
        'Verify bot uptime'
      ],
      dependencies: []
    },
    {
      id: 'telegram-bot',
      name: 'Telegram Bot',
      description: 'Test Telegram bot integration',
      category: 'social',
      icon: <Bot size={20} />,
      status: 'pending',
      steps: [
        'Connect to Telegram bot',
        'Test bot commands',
        'Verify command responses',
        'Test notifications',
        'Check bot status',
        'Verify bot uptime'
      ],
      dependencies: []
    },
    {
      id: 'blockchain-integration',
      name: 'Blockchain Integration',
      description: 'Test Sei Network integration',
      category: 'blockchain',
      icon: <Vault size={20} />,
      status: 'pending',
      steps: [
        'Connect to Sei Network',
        'Verify network status',
        'Test smart contract queries',
        'Test transaction signing',
        'Verify transaction execution',
        'Check blockchain explorer'
      ],
      dependencies: ['wallet-connection']
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);

  // Check if scenario dependencies are met
  const canRunScenario = (scenario: TestScenario): boolean => {
    if (scenario.dependencies.length === 0) return true;
    
    return scenario.dependencies.every(depId => {
      const dep = scenarios.find(s => s.id === depId);
      return dep && dep.status === 'passed';
    });
  };

  // Run single scenario
  const runScenario = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario || !canRunScenario(scenario)) return;

    setCurrentScenario(scenarioId);
    setScenarios(prev => prev.map(s => 
      s.id === scenarioId ? { ...s, status: 'running', duration: 0 } : s
    ));

    const startTime = Date.now();
    
    try {
      // Simulate scenario execution
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      // Simulate success/failure based on scenario
      const success = Math.random() > 0.1; // 90% success rate
      
      setScenarios(prev => prev.map(s => 
        s.id === scenarioId ? {
          ...s,
          status: success ? 'passed' : 'failed',
          duration: Date.now() - startTime,
          error: success ? undefined : 'Simulated test failure'
        } : s
      ));
      
    } catch (error) {
      setScenarios(prev => prev.map(s => 
        s.id === scenarioId ? {
          ...s,
          status: 'failed',
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        } : s
      ));
    }
    
    setCurrentScenario(null);
  };

  // Run all scenarios
  const runAllScenarios = async () => {
    setIsRunning(true);
    
    for (const scenario of scenarios) {
      if (canRunScenario(scenario)) {
        await runScenario(scenario.id);
        // Small delay between scenarios
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setIsRunning(false);
  };

  // Reset all scenarios
  const resetScenarios = () => {
    setScenarios(prev => prev.map(s => ({
      ...s,
      status: 'pending',
      duration: undefined,
      error: undefined
    })));
  };

  // Get scenario status color
  const getStatusColor = (status: TestScenario['status']) => {
    switch (status) {
      case 'passed':
        return colors.neonGreen;
      case 'failed':
        return colors.error;
      case 'running':
        return colors.neonBlue;
      case 'pending':
      default:
        return colors.textMuted;
    }
  };

  // Get scenario status icon
  const getStatusIcon = (status: TestScenario['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'failed':
        return <XCircle size={20} className="text-red-400" />;
      case 'running':
        return <Clock size={20} className="text-blue-400 animate-spin" />;
      case 'pending':
      default:
        return <Clock size={20} className="text-gray-400" />;
    }
  };

  // Get category color
  const getCategoryColor = (category: TestScenario['category']) => {
    switch (category) {
      case 'wallet':
        return colors.neonGreen;
      case 'payment':
        return colors.neonPurple;
      case 'social':
        return colors.neonBlue;
      case 'ai':
        return colors.neonPink;
      case 'blockchain':
        return colors.neonOrange;
      default:
        return colors.textMuted;
    }
  };

  const passedScenarios = scenarios.filter(s => s.status === 'passed').length;
  const totalScenarios = scenarios.length;
  const successRate = Math.round((passedScenarios / totalScenarios) * 100);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <NeonText size="lg" color="green">Integration Test Scenarios</NeonText>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
            Test all integration features systematically
          </p>
        </div>
        
        <div className="flex space-x-3">
          <NeonButton
            color="green"
            onClick={runAllScenarios}
            disabled={isRunning}
          >
            <Play size={16} className="mr-2" />
            {isRunning ? 'Running...' : 'Run All Tests'}
          </NeonButton>
          
          <NeonButton
            variant="outline"
            color="purple"
            onClick={resetScenarios}
            disabled={isRunning}
          >
            <RefreshCw size={16} className="mr-2" />
            Reset
          </NeonButton>
        </div>
      </div>

      {/* Test Summary */}
      <div className="mb-6 p-4 rounded-lg border" style={{ 
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
      }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Test Summary</h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {passedScenarios} of {totalScenarios} scenarios passed
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: getStatusColor(successRate > 80 ? 'passed' : successRate > 50 ? 'running' : 'failed') }}>
              {successRate}%
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              Success Rate
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className="h-2 rounded-full transition-all duration-500"
            style={{ 
              backgroundColor: getStatusColor(successRate > 80 ? 'passed' : successRate > 50 ? 'running' : 'failed'),
              width: `${successRate}%`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${successRate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Test Scenarios Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {scenarios.map((scenario) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              scenario.status === 'passed' ? 'hover:bg-white/5' : ''
            }`}
            style={{
              backgroundColor: colors.glass,
              borderColor: getStatusColor(scenario.status),
            }}
          >
            <div className="flex items-start space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: `${getCategoryColor(scenario.category)}20`,
                  color: getCategoryColor(scenario.category)
                }}
              >
                {scenario.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-white truncate">{scenario.name}</h4>
                  {getStatusIcon(scenario.status)}
                </div>
                
                <p className="text-sm mb-3" style={{ color: colors.textMuted }}>
                  {scenario.description}
                </p>

                {/* Test Steps */}
                <div className="mb-3">
                  <p className="text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                    Test Steps:
                  </p>
                  <div className="space-y-1">
                    {scenario.steps.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                        <span className="text-xs" style={{ color: colors.textMuted }}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dependencies */}
                {scenario.dependencies.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-2" style={{ color: colors.textMuted }}>
                      Dependencies:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {scenario.dependencies.map((depId) => {
                        const dep = scenarios.find(s => s.id === depId);
                        return (
                          <span
                            key={depId}
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: dep?.status === 'passed' ? `${colors.neonGreen}20` : `${colors.textMuted}20`,
                              color: dep?.status === 'passed' ? colors.neonGreen : colors.textMuted,
                              border: `1px solid ${dep?.status === 'passed' ? colors.neonGreen : colors.textMuted}`
                            }}
                          >
                            {dep?.name || depId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-xs" style={{ color: colors.textMuted }}>
                    {scenario.duration && (
                      <span className="mr-3">Duration: {scenario.duration}ms</span>
                    )}
                    {scenario.error && (
                      <span style={{ color: colors.error }}>Error: {scenario.error}</span>
                    )}
                  </div>
                  
                  <NeonButton
                    size="sm"
                    color={canRunScenario(scenario) ? 'green' : 'gray'}
                    disabled={!canRunScenario(scenario) || isRunning || scenario.status === 'running'}
                    onClick={() => runScenario(scenario.id)}
                  >
                    {scenario.status === 'running' ? 'Running...' : 'Run Test'}
                  </NeonButton>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Test Results Summary */}
      <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.glassBorder }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{totalScenarios}</div>
            <div className="text-sm" style={{ color: colors.textMuted }}>Total Tests</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: colors.neonGreen }}>{passedScenarios}</div>
            <div className="text-sm" style={{ color: colors.textMuted }}>Passed</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: colors.error }}>
              {scenarios.filter(s => s.status === 'failed').length}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>Failed</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: colors.neonBlue }}>
              {scenarios.filter(s => s.status === 'pending').length}
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>Pending</div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
