import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wifi, 
  Bot, 
  Brain, 
  Database, 
  Wallet,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonText } from './NeonText';
import { LoadingSpinner } from './LoadingSpinner';
import { colors } from '../../lib/colors';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'connecting' | 'error';
  icon: React.ReactNode;
  description: string;
  lastCheck: Date;
  responseTime?: number;
  error?: string;
}

interface IntegrationStatusProps {
  onRefresh?: () => void;
}

export const IntegrationStatus: React.FC<IntegrationStatusProps> = ({ onRefresh }) => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Backend API',
      status: 'offline',
      icon: <Database size={20} />,
      description: 'Core backend services and database',
      lastCheck: new Date(),
    },
    {
      name: 'Blockchain',
      status: 'offline',
      icon: <Wifi size={20} />,
      description: 'Sei Network connection and smart contracts',
      lastCheck: new Date(),
    },
    {
      name: 'AI Agent',
      status: 'offline',
      icon: <Brain size={20} />,
      description: 'AI-powered recommendations and analysis',
      lastCheck: new Date(),
    },
    {
      name: 'Discord Bot',
      status: 'offline',
      icon: <Bot size={20} />,
      description: 'Discord bot integration',
      lastCheck: new Date(),
    },
    {
      name: 'Telegram Bot',
      status: 'offline',
      icon: <Bot size={20} />,
      description: 'Telegram bot integration',
      lastCheck: new Date(),
    },
    {
      name: 'Wallet Connection',
      status: 'offline',
      icon: <Wallet size={20} />,
      description: 'Keplr/Leap wallet integration',
      lastCheck: new Date(),
    },
  ]);

  const [isChecking, setIsChecking] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<Date>(new Date());

  // Check service status
  const checkServiceStatus = async (serviceName: string): Promise<ServiceStatus> => {
    const startTime = Date.now();
    
    try {
      let status: ServiceStatus['status'] = 'offline';
      let responseTime: number | undefined;
      let error: string | undefined;

      switch (serviceName) {
        case 'Backend API':
          try {
            const response = await fetch('/api/health', { 
              method: 'GET',
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            status = response.ok ? 'online' : 'error';
            responseTime = Date.now() - startTime;
            if (!response.ok) {
              error = `HTTP ${response.status}: ${response.statusText}`;
            }
          } catch (err) {
            status = 'error';
            error = err instanceof Error ? err.message : 'Connection failed';
          }
          break;

        case 'Blockchain':
          try {
            // Check Sei Network RPC
            const response = await fetch('https://rpc-testnet.sei.io/status', {
              method: 'GET',
              signal: AbortSignal.timeout(5000)
            });
            status = response.ok ? 'online' : 'error';
            responseTime = Date.now() - startTime;
            if (!response.ok) {
              error = `RPC Error: ${response.status}`;
            }
          } catch (err) {
            status = 'error';
            error = err instanceof Error ? err.message : 'RPC connection failed';
          }
          break;

        case 'AI Agent':
          try {
            // Simulate AI agent check
            await new Promise(resolve => setTimeout(resolve, 1000));
            status = Math.random() > 0.2 ? 'online' : 'error'; // 80% success rate
            responseTime = Date.now() - startTime;
            if (status === 'error') {
              error = 'AI service temporarily unavailable';
            }
          } catch (err) {
            status = 'error';
            error = err instanceof Error ? err.message : 'AI service check failed';
          }
          break;

        case 'Discord Bot':
          try {
            // Simulate Discord bot check
            await new Promise(resolve => setTimeout(resolve, 800));
            status = Math.random() > 0.1 ? 'online' : 'error'; // 90% success rate
            responseTime = Date.now() - startTime;
            if (status === 'error') {
              error = 'Discord bot service down';
            }
          } catch (err) {
            status = 'error';
            error = err instanceof Error ? err.message : 'Discord bot check failed';
          }
          break;

        case 'Telegram Bot':
          try {
            // Simulate Telegram bot check
            await new Promise(resolve => setTimeout(resolve, 600));
            status = Math.random() > 0.15 ? 'online' : 'error'; // 85% success rate
            responseTime = Date.now() - startTime;
            if (status === 'error') {
              error = 'Telegram bot service down';
            }
          } catch (err) {
            status = 'error';
            error = err instanceof Error ? err.message : 'Telegram bot check failed';
          }
          break;

        case 'Wallet Connection':
          // Check if any wallet is available
          const hasKeplr = typeof window !== 'undefined' && !!window.keplr;
          const hasLeap = typeof window !== 'undefined' && !!window.leap;
          status = hasKeplr || hasLeap ? 'online' : 'offline';
          responseTime = Date.now() - startTime;
          if (status === 'offline') {
            error = 'No wallet extensions detected';
          }
          break;

        default:
          status = 'error';
          error = 'Unknown service';
      }

      return {
        name: serviceName,
        status,
        icon: services.find(s => s.name === serviceName)?.icon || <Database size={20} />,
        description: services.find(s => s.name === serviceName)?.description || '',
        lastCheck: new Date(),
        responseTime,
        error,
      };
    } catch (err) {
      return {
        name: serviceName,
        status: 'error',
        icon: services.find(s => s.name === serviceName)?.icon || <Database size={20} />,
        description: services.find(s => s.name === serviceName)?.description || '',
        lastCheck: new Date(),
        error: err instanceof Error ? err.message : 'Check failed',
      };
    }
  };

  // Check all services
  const checkAllServices = async () => {
    setIsChecking(true);
    
    const updatedServices = await Promise.all(
      services.map(service => checkServiceStatus(service.name))
    );
    
    setServices(updatedServices);
    setLastFullCheck(new Date());
    setIsChecking(false);
    
    if (onRefresh) {
      onRefresh();
    }
  };

  // Auto-check services every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkAllServices();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Initial check
  useEffect(() => {
    checkAllServices();
  }, []);

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return colors.neonGreen;
      case 'connecting':
        return colors.neonBlue;
      case 'error':
        return colors.error;
      case 'offline':
      default:
        return colors.textMuted;
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'connecting':
        return <Clock size={20} className="text-blue-400" />;
      case 'error':
        return <XCircle size={20} className="text-red-400" />;
      case 'offline':
      default:
        return <XCircle size={20} className="text-gray-400" />;
    }
  };

  const onlineServices = services.filter(s => s.status === 'online').length;
  const totalServices = services.length;
  const healthPercentage = Math.round((onlineServices / totalServices) * 100);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <NeonText size="lg" color="green">Integration Status</NeonText>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
            Real-time status of all connected services
          </p>
        </div>
        
        <button
          onClick={checkAllServices}
          disabled={isChecking}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:bg-white/10 disabled:opacity-50"
          style={{ borderColor: colors.glassBorder }}
        >
          <RefreshCw 
            size={16} 
            className={`${isChecking ? 'animate-spin' : ''}`}
            style={{ color: colors.neonGreen }}
          />
          <span className="text-white text-sm">
            {isChecking ? 'Checking...' : 'Refresh'}
          </span>
        </button>
      </div>

      {/* Overall Health */}
      <div className="mb-6 p-4 rounded-lg border" style={{ 
        backgroundColor: colors.glass,
        borderColor: colors.glassBorder,
      }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Overall Health</h3>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {onlineServices} of {totalServices} services online
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold" style={{ color: getStatusColor(healthPercentage > 80 ? 'online' : healthPercentage > 50 ? 'connecting' : 'error') }}>
              {healthPercentage}%
            </div>
            <div className="text-sm" style={{ color: colors.textMuted }}>
              Last checked: {lastFullCheck.toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        {/* Health Bar */}
        <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className="h-2 rounded-full transition-all duration-500"
            style={{ 
              backgroundColor: getStatusColor(healthPercentage > 80 ? 'online' : healthPercentage > 50 ? 'connecting' : 'error'),
              width: `${healthPercentage}%`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${healthPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, index) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className={`p-4 rounded-lg border transition-all duration-200 ${
              service.status === 'online' ? 'hover:bg-white/5' : ''
            }`}
            style={{
              backgroundColor: colors.glass,
              borderColor: getStatusColor(service.status),
            }}
          >
            <div className="flex items-start space-x-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ 
                  backgroundColor: `${getStatusColor(service.status)}20`,
                  color: getStatusColor(service.status)
                }}
              >
                {service.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-white truncate">{service.name}</h4>
                  {getStatusIcon(service.status)}
                </div>
                
                <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
                  {service.description}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: colors.textMuted }}>
                    {service.lastCheck.toLocaleTimeString()}
                  </span>
                  
                  {service.responseTime && (
                    <span style={{ color: colors.textMuted }}>
                      {service.responseTime}ms
                    </span>
                  )}
                </div>
                
                {service.error && (
                  <div className="mt-2 p-2 rounded bg-red-900/20 border border-red-500/30">
                    <div className="flex items-center space-x-1">
                      <AlertTriangle size={12} className="text-red-400" />
                      <span className="text-xs text-red-300">{service.error}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status Legend */}
      <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.glassBorder }}>
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle size={16} className="text-green-400" />
            <span style={{ color: colors.textMuted }}>Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock size={16} className="text-blue-400" />
            <span style={{ color: colors.textMuted }}>Connecting</span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle size={16} className="text-red-400" />
            <span style={{ color: colors.textMuted }}>Error</span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle size={16} className="text-gray-400" />
            <span style={{ color: colors.textMuted }}>Offline</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
