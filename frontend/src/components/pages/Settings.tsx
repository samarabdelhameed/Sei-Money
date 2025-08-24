import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Smartphone, 
  Key, 
  Eye, 
  EyeOff,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Save,
  RotateCcw
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { NeonText } from '../ui/NeonText';
import { colors } from '../../lib/colors';

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: 'profile',
    title: 'Profile Settings',
    icon: User,
    description: 'Manage your personal information and preferences'
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: Shield,
    description: 'Configure security settings and privacy options'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Control how and when you receive notifications'
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Customize the look and feel of your interface'
  },
  {
    id: 'language',
    title: 'Language & Region',
    icon: Globe,
    description: 'Set your preferred language and regional settings'
  },
  {
    id: 'devices',
    title: 'Connected Devices',
    icon: Smartphone,
    description: 'Manage devices connected to your account'
  }
];

export const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState({
    // Profile
    displayName: 'Crypto Trader',
    email: 'trader@example.com',
    bio: 'DeFi enthusiast and yield farmer',
    
    // Security
    twoFactorEnabled: true,
    biometricEnabled: false,
    sessionTimeout: '30',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    transactionAlerts: true,
    priceAlerts: false,
    
    // Appearance
    darkMode: true,
    soundEnabled: true,
    animations: true,
    compactMode: false,
    
    // Language
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    
    // Privacy
    showBalance: true,
    publicProfile: false,
    analyticsEnabled: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // Here you would typically save to backend
  };

  const handleReset = () => {
    console.log('Resetting settings to default');
    // Reset to default values
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={settings.displayName}
          onChange={(e) => handleSettingChange('displayName', e.target.value)}
          className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
          style={{
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={settings.email}
          onChange={(e) => handleSettingChange('email', e.target.value)}
          className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400"
          style={{
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Bio
        </label>
        <textarea
          value={settings.bio}
          onChange={(e) => handleSettingChange('bio', e.target.value)}
          rows={3}
          className="w-full p-3 rounded-lg border bg-transparent text-white placeholder-gray-400 resize-none"
          style={{
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          }}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border" style={{
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
      }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.neonGreen}20` }}>
            {settings.showBalance ? <Eye size={20} style={{ color: colors.neonGreen }} /> : <EyeOff size={20} style={{ color: colors.textMuted }} />}
          </div>
          <div>
            <p className="text-white font-medium">Show Balance</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>Display your wallet balance publicly</p>
          </div>
        </div>
        <button
          onClick={() => handleSettingChange('showBalance', !settings.showBalance)}
          className={`w-12 h-6 rounded-full transition-colors ${settings.showBalance ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.showBalance ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg border" style={{
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
      }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.neonPurple}20` }}>
            <Key size={20} style={{ color: colors.neonPurple }} />
          </div>
          <div>
            <p className="text-white font-medium">Two-Factor Authentication</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>Add an extra layer of security</p>
          </div>
        </div>
        <button
          onClick={() => handleSettingChange('twoFactorEnabled', !settings.twoFactorEnabled)}
          className={`w-12 h-6 rounded-full transition-colors ${settings.twoFactorEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border" style={{
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
      }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.neonGreen}20` }}>
            <Smartphone size={20} style={{ color: colors.neonGreen }} />
          </div>
          <div>
            <p className="text-white font-medium">Biometric Authentication</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>Use fingerprint or face recognition</p>
          </div>
        </div>
        <button
          onClick={() => handleSettingChange('biometricEnabled', !settings.biometricEnabled)}
          className={`w-12 h-6 rounded-full transition-colors ${settings.biometricEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.biometricEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Session Timeout (minutes)
        </label>
        <select
          value={settings.sessionTimeout}
          onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
          className="w-full p-3 rounded-lg border bg-transparent text-white"
          style={{
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          }}
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="60">1 hour</option>
          <option value="120">2 hours</option>
          <option value="0">Never</option>
        </select>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg border" style={{
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
      }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.neonGreen}20` }}>
            <Bell size={20} style={{ color: colors.neonGreen }} />
          </div>
          <div>
            <p className="text-white font-medium">Email Notifications</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>Receive updates via email</p>
          </div>
        </div>
        <button
          onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
          className={`w-12 h-6 rounded-full transition-colors ${settings.emailNotifications ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border" style={{
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
      }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.neonPurple}20` }}>
            <Smartphone size={20} style={{ color: colors.neonPurple }} />
          </div>
          <div>
            <p className="text-white font-medium">Push Notifications</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>Receive push notifications on your device</p>
          </div>
        </div>
        <button
          onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
          className={`w-12 h-6 rounded-full transition-colors ${settings.pushNotifications ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.pushNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border" style={{
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
      }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.warning}20` }}>
            <Shield size={20} style={{ color: colors.warning }} />
          </div>
          <div>
            <p className="text-white font-medium">Transaction Alerts</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>Get notified of all transactions</p>
          </div>
        </div>
        <button
          onClick={() => handleSettingChange('transactionAlerts', !settings.transactionAlerts)}
          className={`w-12 h-6 rounded-full transition-colors ${settings.transactionAlerts ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.transactionAlerts ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg border" style={{
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
      }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.neonPurple}20` }}>
            {settings.darkMode ? <Moon size={20} style={{ color: colors.neonPurple }} /> : <Sun size={20} style={{ color: colors.warning }} />}
          </div>
          <div>
            <p className="text-white font-medium">Dark Mode</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>Use dark theme interface</p>
          </div>
        </div>
        <button
          onClick={() => handleSettingChange('darkMode', !settings.darkMode)}
          className={`w-12 h-6 rounded-full transition-colors ${settings.darkMode ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border" style={{
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
      }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.neonGreen}20` }}>
            {settings.soundEnabled ? <Volume2 size={20} style={{ color: colors.neonGreen }} /> : <VolumeX size={20} style={{ color: colors.textMuted }} />}
          </div>
          <div>
            <p className="text-white font-medium">Sound Effects</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>Play sounds for interactions</p>
          </div>
        </div>
        <button
          onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
          className={`w-12 h-6 rounded-full transition-colors ${settings.soundEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border" style={{
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
      }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.neonPurple}20` }}>
            <Palette size={20} style={{ color: colors.neonPurple }} />
          </div>
          <div>
            <p className="text-white font-medium">Animations</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>Enable smooth animations</p>
          </div>
        </div>
        <button
          onClick={() => handleSettingChange('animations', !settings.animations)}
          className={`w-12 h-6 rounded-full transition-colors ${settings.animations ? 'bg-green-500' : 'bg-gray-600'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.animations ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Language
        </label>
        <select
          value={settings.language}
          onChange={(e) => handleSettingChange('language', e.target.value)}
          className="w-full p-3 rounded-lg border bg-transparent text-white"
          style={{
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          }}
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="zh">中文</option>
          <option value="ja">日本語</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Timezone
        </label>
        <select
          value={settings.timezone}
          onChange={(e) => handleSettingChange('timezone', e.target.value)}
          className="w-full p-3 rounded-lg border bg-transparent text-white"
          style={{
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          }}
        >
          <option value="UTC">UTC</option>
          <option value="EST">Eastern Time</option>
          <option value="PST">Pacific Time</option>
          <option value="GMT">Greenwich Mean Time</option>
          <option value="CET">Central European Time</option>
          <option value="JST">Japan Standard Time</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Currency
        </label>
        <select
          value={settings.currency}
          onChange={(e) => handleSettingChange('currency', e.target.value)}
          className="w-full p-3 rounded-lg border bg-transparent text-white"
          style={{
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          }}
        >
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="JPY">JPY - Japanese Yen</option>
          <option value="CNY">CNY - Chinese Yuan</option>
          <option value="AED">AED - UAE Dirham</option>
        </select>
      </div>
    </div>
  );

  const renderDevicesSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-white font-medium">Connected Devices</h4>
        
        <div className="p-4 rounded-lg border" style={{
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.neonGreen}20` }}>
                <Smartphone size={20} style={{ color: colors.neonGreen }} />
              </div>
              <div>
                <p className="text-white font-medium">iPhone 15 Pro</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>Last active: 2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Wifi size={16} style={{ color: colors.neonGreen }} />
                <span className="text-xs" style={{ color: colors.neonGreen }}>Online</span>
              </div>
              <NeonButton size="sm" variant="outline" color="green">
                Manage
              </NeonButton>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border" style={{
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.textMuted}20` }}>
                <Smartphone size={20} style={{ color: colors.textMuted }} />
              </div>
              <div>
                <p className="text-white font-medium">MacBook Pro</p>
                <p className="text-sm" style={{ color: colors.textMuted }}>Last active: 1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <WifiOff size={16} style={{ color: colors.textMuted }} />
                <span className="text-xs" style={{ color: colors.textMuted }}>Offline</span>
              </div>
              <NeonButton size="sm" variant="outline" color="orange">
                Remove
              </NeonButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSettings();
      case 'security': return renderSecuritySettings();
      case 'notifications': return renderNotificationSettings();
      case 'appearance': return renderAppearanceSettings();
      case 'language': return renderLanguageSettings();
      case 'devices': return renderDevicesSettings();
      default: return renderProfileSettings();
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-white">
              <NeonText color="green" glow>Settings</NeonText>
            </h1>
            <p className="mt-2" style={{ color: colors.textMuted }}>
              Manage your account preferences and security settings
            </p>
          </div>
          
          <div className="flex space-x-3">
            <NeonButton variant="outline" color="orange" onClick={handleReset}>
              <RotateCcw size={20} className="mr-2" />
              Reset
            </NeonButton>
            <NeonButton color="green" onClick={handleSave}>
              <Save size={20} className="mr-2" />
              Save Changes
            </NeonButton>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <GlassCard className="p-4">
              <div className="space-y-2">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full p-3 rounded-lg text-left transition-all duration-200 flex items-center space-x-3 ${
                        isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: isActive ? colors.glassHover : 'transparent',
                        border: isActive ? `1px solid ${colors.glassBorder}` : '1px solid transparent',
                      }}
                    >
                      <Icon size={20} />
                      <div>
                        <p className="font-medium">{section.title}</p>
                        <p className="text-xs opacity-75">{section.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>

          {/* Settings Content */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <GlassCard className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {settingsSections.find(s => s.id === activeSection)?.title}
                </h2>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  {settingsSections.find(s => s.id === activeSection)?.description}
                </p>
              </div>
              
              {renderSectionContent()}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};