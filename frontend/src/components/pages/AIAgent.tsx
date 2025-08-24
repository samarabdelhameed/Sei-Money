import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, TrendingUp, AlertCircle, Settings, Zap, BarChart3, Target } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { LineChart } from '../charts/LineChart';
import { colors } from '../../lib/colors';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface MarketContext {
  bnbPrice: number;
  totalTvl: string;
  avgApy: string;
  healthyProtocols: string;
  topStrategy: {
    name: string;
    apy: string;
  };
}

interface PortfolioStatus {
  vaultBalance: string;
  shares: number;
  usdValue: string;
  status: string;
}

interface AISuggestion {
  type: 'optimize' | 'alert' | 'action';
  title: string;
  description: string;
  action?: string;
}

const mockMarketData = [
  { name: '12:00', value: 326.12 },
  { name: '13:00', value: 328.45 },
  { name: '14:00', value: 325.67 },
  { name: '15:00', value: 330.21 },
  { name: '16:00', value: 332.15 },
  { name: '17:00', value: 329.88 },
];

export const AIAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm AION, your intelligent DeFi assistant. I can help you optimize your yield farming strategies, analyze market conditions, and make smart investment decisions. What would you like to explore today?",
      timestamp: new Date(),
      suggestions: ['Analyze My Portfolio', 'Find Best Strategy', 'Market Analysis', 'DeFi Beginner Guide']
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const marketContext: MarketContext = {
    bnbPrice: 326.12,
    totalTvl: '$990.3M',
    avgApy: '9.3%',
    healthyProtocols: '8/8',
    topStrategy: {
      name: 'PancakeSwap',
      apy: '12.14% APY'
    }
  };

  const portfolioStatus: PortfolioStatus = {
    vaultBalance: '0 BNB',
    shares: 0,
    usdValue: '$0.00',
    status: 'Ready'
  };

  const aiSuggestions: AISuggestion[] = [
    {
      type: 'optimize',
      title: 'Optimize Strategy',
      description: 'Based on current market conditions, consider rebalancing your portfolio.',
      action: 'Review Portfolio'
    },
    {
      type: 'alert',
      title: 'Market Opportunity',
      description: 'New high-yield farming opportunity detected with 15.2% APY.',
      action: 'View Details'
    },
    {
      type: 'action',
      title: 'Auto-Compound Ready',
      description: 'Your vault rewards are ready for auto-compounding.',
      action: 'Compound Now'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on current market conditions, I recommend diversifying your portfolio across multiple yield farming strategies. The PancakeSwap strategy is showing strong performance with 12.14% APY.",
        "I've analyzed 8 different strategies for you. The optimal allocation would be 40% in stable farming, 30% in blue-chip DeFi tokens, and 30% in emerging opportunities.",
        "Market sentiment is currently bullish with BNB at $326.12. This could be a good time to increase your DeFi exposure, but always consider your risk tolerance.",
        "Your portfolio health looks good! I suggest enabling auto-compound for maximum efficiency. Would you like me to set up an automated rebalancing schedule?"
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: randomResponse,
        timestamp: new Date(),
        suggestions: ['Show More Details', 'Execute Strategy', 'Set Alerts', 'Risk Analysis']
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Interface - Main Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: colors.gradientNeon }}
              >
                <Bot size={24} className="text-white" />
              </div>
              <div>
                <NeonText size="xl" color="green" glow>
                  AI Agent Studio
                </NeonText>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Your intelligent DeFi assistant with real-time market analysis
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.neonGreen }}></div>
                <span className="text-sm" style={{ color: colors.neonGreen }}>AI Online</span>
              </div>
              <div className="flex items-center space-x-2 text-sm" style={{ color: colors.textMuted }}>
                <Zap size={16} />
                <span>Analyzing 8 strategies</span>
              </div>
              <div className="text-sm" style={{ color: colors.textMuted }}>
                Last update: 7:30:33 PM
              </div>
            </div>
          </motion.div>

          {/* Chat Messages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <GlassCard className="h-[600px] flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ 
                            background: message.type === 'user' ? colors.gradientPurple : colors.gradientGreen 
                          }}
                        >
                          {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                        </div>
                        
                        <div className="space-y-2">
                          <div 
                            className={`p-4 rounded-xl ${message.type === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                            style={{
                              backgroundColor: message.type === 'user' ? colors.glassHover : colors.glass,
                              border: `1px solid ${colors.glassBorder}`,
                            }}
                          >
                            <p className="text-white text-sm leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                          
                          {message.suggestions && (
                            <div className="flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion) => (
                                <button
                                  key={suggestion}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="px-3 py-1 rounded-full text-xs border transition-all duration-200 hover:scale-105"
                                  style={{
                                    backgroundColor: colors.glass,
                                    borderColor: colors.glassBorder,
                                    color: colors.neonGreen,
                                  }}
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-3"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: colors.gradientGreen }}
                    >
                      <Bot size={16} />
                    </div>
                    <div 
                      className="p-4 rounded-xl rounded-tl-sm"
                      style={{
                        backgroundColor: colors.glass,
                        border: `1px solid ${colors.glassBorder}`,
                      }}
                    >
                      <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: colors.neonGreen }}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ 
                              duration: 1, 
                              repeat: Infinity, 
                              delay: i * 0.2 
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t p-4" style={{ borderTopColor: colors.glassBorder }}>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask AION about strategies, market analysis, or DeFi guidance..."
                      className="w-full p-3 rounded-lg resize-none border bg-transparent text-white placeholder-gray-400"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                      }}
                      rows={1}
                    />
                  </div>
                  <NeonButton
                    color="green"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                  >
                    <Send size={18} />
                  </NeonButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Market Context */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <GlassCard glow="green" className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 size={20} style={{ color: colors.neonGreen }} />
                <NeonText color="green">Market Context</NeonText>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>BNB Price</span>
                  <NeonText color="green">${marketContext.bnbPrice}</NeonText>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Total TVL</span>
                  <span className="text-white">{marketContext.totalTvl}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Avg APY</span>
                  <NeonText color="green">{marketContext.avgApy}</NeonText>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Healthy Protocols</span>
                  <span className="text-white">{marketContext.healthyProtocols}</span>
                </div>
                
                <div className="pt-2 mt-4 border-t" style={{ borderColor: colors.glassBorder }}>
                  <div className="text-xs" style={{ color: colors.textMuted }}>Top Strategy</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-white font-medium">{marketContext.topStrategy.name}</span>
                    <NeonText color="green" size="sm">{marketContext.topStrategy.apy}</NeonText>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <LineChart data={mockMarketData} height={150} showGrid={false} />
              </div>
            </GlassCard>
          </motion.div>

          {/* Portfolio Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <GlassCard glow="purple" className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Target size={20} style={{ color: colors.neonPurple }} />
                <NeonText color="purple">Portfolio Status</NeonText>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Vault Balance</span>
                  <span className="text-white">{portfolioStatus.vaultBalance}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Shares</span>
                  <span className="text-white">{portfolioStatus.shares}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>USD Value</span>
                  <span className="text-white">{portfolioStatus.usdValue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: colors.textMuted }}>Status</span>
                  <span 
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: `${colors.neonGreen}20`, 
                      color: colors.neonGreen 
                    }}
                  >
                    {portfolioStatus.status}
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* AI Suggestions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <GlassCard className="p-4">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle size={20} style={{ color: colors.warning }} />
                <NeonText color="orange">AI Suggestions</NeonText>
              </div>
              
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    className="p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      backgroundColor: colors.glass,
                      borderColor: colors.glassBorder,
                    }}
                    whileHover={{
                      backgroundColor: colors.glassHover,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">
                        {suggestion.title}
                      </h4>
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ 
                          backgroundColor: suggestion.type === 'optimize' ? colors.neonGreen :
                                         suggestion.type === 'alert' ? colors.warning :
                                         colors.neonPurple
                        }}
                      />
                    </div>
                    <p className="text-xs mb-3" style={{ color: colors.textMuted }}>
                      {suggestion.description}
                    </p>
                    {suggestion.action && (
                      <NeonButton 
                        size="sm" 
                        variant="outline"
                        color={suggestion.type === 'optimize' ? 'green' : 
                               suggestion.type === 'alert' ? 'orange' : 'purple'}
                      >
                        {suggestion.action}
                      </NeonButton>
                    )}
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};