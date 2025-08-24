import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap, 
  Target, 
  Bot,
  Twitter,
  Github,
  MessageCircle,
  Mail,
  ExternalLink,
  Heart
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { LineChart } from '../charts/LineChart';
import { colors } from '../../lib/colors';

interface HomeProps {
  onNavigate: (tab: string) => void;
}

const mockChartData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
];

const features = [
  {
    icon: TrendingUp,
    title: 'Smart Payments',
    description: 'Send & receive with expiry, auto-refunds, and smart contracts',
    color: 'green' as const,
    route: 'payments'
  },
  {
    icon: Users,
    title: 'Group Pools',
    description: 'Collaborative savings with friends and community',
    color: 'purple' as const,
    route: 'groups'
  },
  {
    icon: Target,
    title: 'Savings Pots',
    description: 'Goal-based savings with auto-deposit features',
    color: 'green' as const,
    route: 'pots'
  },
  {
    icon: Zap,
    title: 'AI Vaults',
    description: 'Automated DeFi strategies with AI optimization',
    color: 'purple' as const,
    route: 'vaults'
  },
  {
    icon: Shield,
    title: 'Escrow Service',
    description: 'Secure transactions with dispute resolution',
    color: 'green' as const,
    route: 'escrow'
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    description: 'Intelligent DeFi guidance and market analysis',
    color: 'purple' as const,
    route: 'ai-agent'
  },
];

const stats = [
  { label: 'Total TVL', value: '$12.4M', change: '+15.2%' },
  { label: 'Active Users', value: '8,942', change: '+8.7%' },
  { label: 'Success Rate', value: '99.1%', change: '+0.3%' },
  { label: 'Avg APY', value: '12.8%', change: '+2.1%' },
];

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Hero Section */}
      <motion.div 
        className="text-center space-y-6 py-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1 
          className="text-5xl md:text-7xl font-bold"
          style={{ color: colors.text }}
        >
          <NeonText size="2xl" color="green" glow animate>
            SeiMoney
          </NeonText>
          <br />
          <span style={{ color: colors.text }}>Next-Gen DeFi Platform</span>
        </motion.h1>
        
        <motion.p 
          className="text-xl max-w-2xl mx-auto"
          style={{ color: colors.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Experience the future of decentralized finance with AI-powered strategies, 
          collaborative savings, and secure escrow services on the Sei Network.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <NeonButton 
            size="xl" 
            color="green" 
            onClick={() => onNavigate('dashboard')}
            className="min-w-[180px] shadow-2xl"
          >
            <span className="flex items-center">
              Get Started 
              <ArrowRight className="ml-2" size={20} />
            </span>
          </NeonButton>
          <NeonButton 
            size="xl" 
            variant="outline" 
            color="purple" 
            onClick={() => onNavigate('help')}
            className="min-w-[180px]"
          >
            Learn More
          </NeonButton>
        </motion.div>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        {stats.map((stat, index) => (
          <GlassCard key={stat.label} glow="green" className="p-6 text-center">
            <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              {stat.label}
            </div>
            <div className="text-xs mt-2" style={{ color: colors.neonGreen }}>
              {stat.change}
            </div>
          </GlassCard>
        ))}
      </motion.div>

      {/* TVL Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Total Value Locked</h3>
            <NeonText color="green" glow>$12.4M</NeonText>
          </div>
          <LineChart data={mockChartData} color="green" />
        </GlassCard>
      </motion.div>

      {/* Features Grid */}
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-center text-white">
          Explore <NeonText color="green" glow>Features</NeonText>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + index * 0.1, duration: 0.6 }}
              >
                <GlassCard 
                  glow={feature.color} 
                  className="p-6 h-full"
                  onClick={() => onNavigate(feature.route)}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ 
                        background: feature.color === 'green' ? colors.gradientGreen : colors.gradientPurple 
                      }}
                    >
                      <Icon size={24} className="text-white" />
                    </div>
                    <NeonText size="lg" color={feature.color}>
                      {feature.title}
                    </NeonText>
                  </div>
                  <p style={{ color: colors.textMuted }} className="text-sm">
                    {feature.description}
                  </p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Getting Started */}
      <motion.div
        className="text-center space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <GlassCard className="p-12 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6">
            Start Your DeFi Journey in 3 Steps
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold"
                style={{ background: colors.gradientGreen }}
              >
                1
              </div>
              <h4 className="font-semibold text-white mb-2">Connect Wallet</h4>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Connect your Keplr or Leap wallet to get started
              </p>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold"
                style={{ background: colors.gradientPurple }}
              >
                2
              </div>
              <h4 className="font-semibold text-white mb-2">Choose Strategy</h4>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Select from payments, savings, or investment options
              </p>
            </div>
            
            <div className="text-center">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold"
                style={{ background: colors.gradientNeon }}
              >
                3
              </div>
              <h4 className="font-semibold text-white mb-2">Start Earning</h4>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Begin your DeFi journey with AI-optimized returns
              </p>
            </div>
          </div>
          
          <div className="mt-8">
            <NeonButton size="lg" color="green" onClick={() => onNavigate('help')}>
              View Documentation
            </NeonButton>
          </div>
        </GlassCard>
      </motion.div>

      {/* Footer */}
      <motion.footer
        className="mt-20 pt-16 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.0, duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: colors.gradientNeon }}
                >
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <NeonText size="xl" color="green" glow>
                  SeiMoney
                </NeonText>
              </div>
              <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
                The next generation DeFi platform built on Sei Network. 
                Experience AI-powered yield optimization, collaborative savings, 
                and secure escrow services.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {[
                  { icon: Twitter, label: 'Twitter', color: colors.neonBlue },
                  { icon: Github, label: 'GitHub', color: colors.text },
                  { icon: MessageCircle, label: 'Discord', color: colors.neonPurple },
                  { icon: Mail, label: 'Email', color: colors.neonGreen }
                ].map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <motion.button
                      key={social.label}
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor: colors.glass,
                        borderColor: colors.glassBorder,
                        border: '1px solid'
                      }}
                      whileHover={{
                        backgroundColor: colors.glassHover,
                        boxShadow: `0 0 20px ${social.color}30`,
                        scale: 1.1
                      }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.2 + index * 0.1, duration: 0.3 }}
                    >
                      <Icon size={18} style={{ color: social.color }} />
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Products</h4>
              <ul className="space-y-3">
                {[
                  { name: 'Smart Payments', route: 'payments' },
                  { name: 'AI Vaults', route: 'vaults' },
                  { name: 'Group Pools', route: 'groups' },
                  { name: 'Savings Pots', route: 'pots' },
                  { name: 'Escrow Service', route: 'escrow' },
                  { name: 'AI Assistant', route: 'ai-agent' }
                ].map((item, index) => (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.3 + index * 0.05, duration: 0.3 }}
                  >
                    <button
                      onClick={() => onNavigate(item.route)}
                      className="text-sm transition-colors duration-200 hover:text-white flex items-center group"
                      style={{ color: colors.textMuted }}
                    >
                      {item.name}
                      <ExternalLink 
                        size={12} 
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                      />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-3">
                {[
                  { name: 'Documentation', route: 'help' },
                  { name: 'API Reference', route: 'help' },
                  { name: 'Tutorials', route: 'help' },
                  { name: 'Community', route: 'help' },
                  { name: 'Blog', route: 'help' },
                  { name: 'Whitepaper', route: 'help' }
                ].map((item, index) => (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.4 + index * 0.05, duration: 0.3 }}
                  >
                    <button
                      onClick={() => onNavigate(item.route)}
                      className="text-sm transition-colors duration-200 hover:text-white flex items-center group"
                      style={{ color: colors.textMuted }}
                    >
                      {item.name}
                      <ExternalLink 
                        size={12} 
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                      />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                {[
                  { name: 'About Us', route: 'help' },
                  { name: 'Careers', route: 'help' },
                  { name: 'Press Kit', route: 'help' },
                  { name: 'Privacy Policy', route: 'help' },
                  { name: 'Terms of Service', route: 'help' },
                  { name: 'Contact', route: 'help' }
                ].map((item, index) => (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.5 + index * 0.05, duration: 0.3 }}
                  >
                    <button
                      onClick={() => onNavigate(item.route)}
                      className="text-sm transition-colors duration-200 hover:text-white flex items-center group"
                      style={{ color: colors.textMuted }}
                    >
                      {item.name}
                      <ExternalLink 
                        size={12} 
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                      />
                    </button>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter Signup */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8, duration: 0.6 }}
          >
            <GlassCard className="p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Stay Updated with <NeonText color="green" glow>SeiMoney</NeonText>
              </h3>
              <p className="text-lg mb-6" style={{ color: colors.textMuted }}>
                Get the latest updates on new features, partnerships, and DeFi insights
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-xl border bg-transparent text-white placeholder-gray-400"
                  style={{
                    backgroundColor: colors.glass,
                    borderColor: colors.glassBorder,
                  }}
                />
                <NeonButton color="green">
                  Subscribe
                </NeonButton>
              </div>
            </GlassCard>
          </motion.div>

          {/* Bottom Bar */}
          <motion.div
            className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0"
            style={{ borderTopColor: colors.glassBorder }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.0, duration: 0.6 }}
          >
            <div className="flex items-center space-x-2 text-sm" style={{ color: colors.textMuted }}>
              <span>© 2024 SeiMoney. All rights reserved.</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm" style={{ color: colors.textMuted }}>
              <span>Made with</span>
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  color: [colors.error, colors.neonGreen, colors.error]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Heart size={16} fill="currentColor" />
              </motion.div>
              <span>on Sei Network</span>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <button 
                className="transition-colors duration-200 hover:text-white"
                style={{ color: colors.textMuted }}
                onClick={() => onNavigate('help')}
              >
                Privacy
              </button>
              <button 
                className="transition-colors duration-200 hover:text-white"
                style={{ color: colors.textMuted }}
                onClick={() => onNavigate('help')}
              >
                Terms
              </button>
              <button 
                className="transition-colors duration-200 hover:text-white"
                style={{ color: colors.textMuted }}
                onClick={() => onNavigate('settings')}
              >
                Settings
              </button>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
};