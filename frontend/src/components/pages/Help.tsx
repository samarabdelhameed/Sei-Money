import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  Search, 
  Book, 
  MessageCircle, 
  Mail, 
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  Video,
  Users
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { colors } from '../../lib/colors';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpResource {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'video' | 'api' | 'community';
  icon: React.ComponentType<any>;
  link: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I connect my wallet to SeiMoney?',
    answer: 'Click the "Connect Wallet" button in the top right corner and select your preferred wallet (Keplr, Leap, etc.). Make sure you have the Sei Network added to your wallet.',
    category: 'getting-started'
  },
  {
    id: '2',
    question: 'What are AI Vaults and how do they work?',
    answer: 'AI Vaults are automated investment strategies that use artificial intelligence to optimize your DeFi yields. They automatically rebalance your portfolio and compound rewards for maximum returns.',
    category: 'features'
  },
  {
    id: '3',
    question: 'How secure are my funds in SeiMoney?',
    answer: 'SeiMoney uses military-grade encryption, smart contract audits, and non-custodial architecture. Your funds remain in your control at all times, and we never have access to your private keys.',
    category: 'security'
  },
  {
    id: '4',
    question: 'What fees does SeiMoney charge?',
    answer: 'SeiMoney charges a small performance fee (typically 2-5%) only on profits generated. There are no deposit or withdrawal fees, and you only pay when you earn.',
    category: 'fees'
  },
  {
    id: '5',
    question: 'Can I withdraw my funds at any time?',
    answer: 'Yes, you can withdraw your funds at any time. Some strategies may have a small delay (usually 24-48 hours) to ensure optimal execution, but your funds are never locked.',
    category: 'features'
  }
];

const helpResources: HelpResource[] = [
  {
    id: '1',
    title: 'Getting Started Guide',
    description: 'Complete walkthrough for new users',
    type: 'guide',
    icon: Book,
    link: '#'
  },
  {
    id: '2',
    title: 'Video Tutorials',
    description: 'Step-by-step video guides',
    type: 'video',
    icon: Video,
    link: '#'
  },
  {
    id: '3',
    title: 'API Documentation',
    description: 'Technical documentation for developers',
    type: 'api',
    icon: FileText,
    link: '#'
  },
  {
    id: '4',
    title: 'Community Forum',
    description: 'Connect with other users',
    type: 'community',
    icon: Users,
    link: '#'
  }
];

export const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'features', label: 'Features' },
    { id: 'security', label: 'Security' },
    { id: 'fees', label: 'Fees & Pricing' }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen p-6 space-y-8">
      {/* Header */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: colors.gradientNeon }}
          >
            <HelpCircle size={32} className="text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white">
          Help & <NeonText color="green" glow>Support</NeonText>
        </h1>
        <p className="text-xl max-w-2xl mx-auto" style={{ color: colors.textMuted }}>
          Find answers to your questions and get the help you need
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <GlassCard glow="green" className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: colors.gradientGreen }}
            >
              <MessageCircle size={24} className="text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Live Chat</h3>
          <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
            Get instant help from our support team
          </p>
          <NeonButton size="sm" color="green">
            Start Chat
          </NeonButton>
        </GlassCard>

        <GlassCard glow="purple" className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: colors.gradientPurple }}
            >
              <Mail size={24} className="text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Email Support</h3>
          <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
            Send us a detailed message
          </p>
          <NeonButton size="sm" color="purple">
            Send Email
          </NeonButton>
        </GlassCard>

        <GlassCard glow="blue" className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: colors.gradientBlue }}
            >
              <Phone size={24} className="text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Phone Support</h3>
          <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
            Call us for urgent issues
          </p>
          <NeonButton size="sm" color="blue">
            Call Now
          </NeonButton>
        </GlassCard>
      </motion.div>

      {/* Help Resources */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white text-center">
          Help <NeonText color="purple" glow>Resources</NeonText>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {helpResources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
              >
                <GlassCard className="p-6 h-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: resource.type === 'guide' ? `${colors.neonGreen}20` :
                                        resource.type === 'video' ? `${colors.neonPurple}20` :
                                        resource.type === 'api' ? `${colors.neonBlue}20` :
                                        `${colors.warning}20`
                      }}
                    >
                      <Icon 
                        size={20} 
                        style={{ 
                          color: resource.type === 'guide' ? colors.neonGreen :
                                resource.type === 'video' ? colors.neonPurple :
                                resource.type === 'api' ? colors.neonBlue :
                                colors.warning
                        }} 
                      />
                    </div>
                    <ExternalLink size={16} style={{ color: colors.textMuted }} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: colors.textMuted }}>
                    {resource.description}
                  </p>
                  
                  <NeonButton 
                    size="sm" 
                    variant="outline"
                    color={resource.type === 'guide' ? 'green' :
                           resource.type === 'video' ? 'purple' :
                           resource.type === 'api' ? 'blue' : 'orange'}
                  >
                    <Play size={16} className="mr-2" />
                    Explore
                  </NeonButton>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white text-center">
          Frequently Asked <NeonText color="green" glow>Questions</NeonText>
        </h2>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQs..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border bg-transparent text-white placeholder-gray-400"
              style={{
                backgroundColor: colors.glass,
                borderColor: colors.glassBorder,
              }}
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 rounded-xl border bg-transparent text-white"
            style={{
              backgroundColor: colors.glass,
              borderColor: colors.glassBorder,
            }}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFAQs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
            >
              <GlassCard className="overflow-hidden">
                <button
                  className="w-full p-6 text-left flex items-center justify-between"
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                >
                  <h3 className="text-lg font-semibold text-white pr-4">
                    {faq.question}
                  </h3>
                  {expandedFAQ === faq.id ? (
                    <ChevronDown size={20} style={{ color: colors.neonGreen }} />
                  ) : (
                    <ChevronRight size={20} style={{ color: colors.textMuted }} />
                  )}
                </button>
                
                <motion.div
                  initial={false}
                  animate={{
                    height: expandedFAQ === faq.id ? 'auto' : 0,
                    opacity: expandedFAQ === faq.id ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <div 
                      className="w-full h-px mb-4"
                      style={{ backgroundColor: colors.glassBorder }}
                    />
                    <p style={{ color: colors.textMuted }} className="leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </motion.div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
            <p style={{ color: colors.textMuted }}>
              Try adjusting your search terms or category filter
            </p>
          </div>
        )}
      </motion.div>

      {/* Contact Section */}
      <motion.div
        className="text-center space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <GlassCard className="p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">
            Still need help?
          </h3>
          <p className="text-lg mb-6" style={{ color: colors.textMuted }}>
            Our support team is here to help you 24/7
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NeonButton color="green">
              <MessageCircle size={20} className="mr-2" />
              Contact Support
            </NeonButton>
            <NeonButton variant="outline" color="purple">
              <Users size={20} className="mr-2" />
              Join Community
            </NeonButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};