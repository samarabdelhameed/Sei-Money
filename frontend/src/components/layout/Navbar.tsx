import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, CreditCard, Users, PiggyBank, Vault, Shield, User, BarChart3, Settings, HelpCircle, Bot, TestTube } from 'lucide-react';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { WalletConnection } from '../ui/WalletConnection';
import { ConnectionStatus } from '../ui/ConnectionStatus';
import { useApp } from '../../contexts/AppContext';
import { colors } from '../../lib/colors';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'pots', label: 'Pots', icon: PiggyBank },
  { id: 'vaults', label: 'Vaults', icon: Vault },
  { id: 'escrow', label: 'Escrow', icon: Shield },
  { id: 'usernames', label: 'Usernames', icon: User },
  { id: 'ai-agent', label: 'AI Agent', icon: Bot },
];

const secondaryItems = [
  { id: 'wallet-test', label: 'Wallet Test', icon: TestTube },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { state, actions } = useApp();
  const [showWalletConnection, setShowWalletConnection] = useState(false);

  return (
    <motion.nav 
      className="sticky top-0 z-50 backdrop-blur-xl border-b"
      style={{
        backgroundColor: colors.glass,
        borderBottomColor: colors.glassBorder,
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-3 flex-shrink-0"
            whileHover={{ scale: 1.05 }}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: colors.gradientNeon }}
            >
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <NeonText size="xl" color="green" glow>
              SeiMoney
            </NeonText>
          </motion.div>

          {/* Navigation Items */}
          <div className="hidden lg:flex items-center space-x-1 flex-1 justify-center">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  className={`relative px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                    isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: isActive ? colors.glass : 'transparent',
                    border: isActive ? `1px solid ${colors.glassBorder}` : '1px solid transparent',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={16} />
                  <span className="hidden lg:inline">{item.label}</span>
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 rounded-full"
                      style={{ backgroundColor: colors.neonGreen }}
                      layoutId="activeTab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Secondary Items & Wallet */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Secondary Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: isActive ? colors.glass : 'transparent',
                      border: isActive ? `1px solid ${colors.glassBorder}` : '1px solid transparent',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onTabChange(item.id)}
                    title={item.label}
                  >
                    <Icon size={18} />
                  </motion.button>
                );
              })}
            </div>

            {/* Connection Status */}
            <ConnectionStatus className="hidden sm:block" />

            {/* Wallet Connection */}
            {state.isWalletConnected ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm text-white font-medium">
                    {state.wallet?.address ? `${state.wallet.address.slice(0, 8)}...${state.wallet.address.slice(-4)}` : 'sei1abc...xyz'}
                  </div>
                  <div className="text-xs" style={{ color: colors.neonGreen }}>
                    {state.wallet?.balance ? `${state.wallet.balance.toFixed(2)} SEI` : '0.00 SEI'}
                  </div>
                </div>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: colors.gradientGreen }}
                  onClick={() => onTabChange('settings')}
                >
                  <User size={20} className="text-white" />
                </div>
              </div>
            ) : (
              <NeonButton
                color="green"
                onClick={() => setShowWalletConnection(true)}
              >
                <span className="hidden sm:inline">Connect Wallet</span>
                <span className="sm:hidden">Connect</span>
              </NeonButton>
            )}

            {/* Wallet Connection Modal */}
            <WalletConnection
              isOpen={showWalletConnection}
              onClose={() => setShowWalletConnection(false)}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden pb-4">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {navigationItems.slice(0, 8).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
                    isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: isActive ? colors.glass : 'transparent',
                    border: isActive ? `1px solid ${colors.glassBorder}` : '1px solid transparent',
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={16} />
                  <span className="text-[10px]">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
          
          {/* Mobile Secondary Items */}
          <div className="flex justify-center space-x-4">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <motion.button
                  key={item.id}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: isActive ? colors.glass : 'transparent',
                    border: isActive ? `1px solid ${colors.glassBorder}` : '1px solid transparent',
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};