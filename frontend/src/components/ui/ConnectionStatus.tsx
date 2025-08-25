import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Server, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { colors } from '../../lib/colors';
import { apiService } from '../../lib/api';

interface ConnectionStatusProps {
  className?: string;
}

interface ConnectionState {
  backend: 'online' | 'offline' | 'checking';
  sei: 'online' | 'offline' | 'checking';
  lastCheck: Date | null;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    backend: 'checking',
    sei: 'checking',
    lastCheck: null
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const checkConnections = async () => {
    setConnectionState(prev => ({
      ...prev,
      backend: 'checking',
      sei: 'checking'
    }));

    // Check backend
    let backendStatus: 'online' | 'offline' = 'offline';
    try {
      await apiService.checkHealth();
      backendStatus = 'online';
    } catch (error) {
      backendStatus = 'offline';
    }

    // Check Sei network
    let seiStatus: 'online' | 'offline' = 'offline';
    try {
      const response = await fetch('https://rpc.sei-apis.com/status', { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      seiStatus = response.ok ? 'online' : 'offline';
    } catch (error) {
      seiStatus = 'offline';
    }

    setConnectionState({
      backend: backendStatus,
      sei: seiStatus,
      lastCheck: new Date()
    });
  };

  useEffect(() => {
    checkConnections();
    
    // Check every 30 seconds
    const interval = setInterval(checkConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'offline':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'checking':
        return <RefreshCw size={16} className="text-yellow-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online':
        return 'text-green-400';
      case 'offline':
        return 'text-red-400';
      case 'checking':
        return 'text-yellow-400';
    }
  };

  const overallStatus = connectionState.backend === 'online' && connectionState.sei === 'online' 
    ? 'online' 
    : connectionState.backend === 'checking' || connectionState.sei === 'checking'
    ? 'checking'
    : 'offline';

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 hover:bg-white hover:bg-opacity-5"
        style={{
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {overallStatus === 'online' ? (
          <Wifi size={16} className="text-green-400" />
        ) : overallStatus === 'checking' ? (
          <RefreshCw size={16} className="text-yellow-400 animate-spin" />
        ) : (
          <WifiOff size={16} className="text-red-400" />
        )}
        
        <span className={`text-sm font-medium ${getStatusColor(overallStatus)}`}>
          {overallStatus === 'online' ? 'Connected' : 
           overallStatus === 'checking' ? 'Checking...' : 
           'Offline'}
        </span>
      </motion.button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute top-full right-0 mt-2 w-64 p-4 rounded-lg border shadow-lg z-50"
          style={{
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Connection Status</h4>
              <button
                onClick={checkConnections}
                className="text-gray-400 hover:text-white transition-colors"
                disabled={connectionState.backend === 'checking' || connectionState.sei === 'checking'}
              >
                <RefreshCw 
                  size={14} 
                  className={connectionState.backend === 'checking' || connectionState.sei === 'checking' ? 'animate-spin' : ''} 
                />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-300">Backend API</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(connectionState.backend)}
                  <span className={`text-xs ${getStatusColor(connectionState.backend)}`}>
                    {connectionState.backend}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">S</span>
                  </div>
                  <span className="text-sm text-gray-300">Sei Network</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(connectionState.sei)}
                  <span className={`text-xs ${getStatusColor(connectionState.sei)}`}>
                    {connectionState.sei}
                  </span>
                </div>
              </div>
            </div>

            {connectionState.lastCheck && (
              <div className="pt-2 border-t border-gray-600">
                <p className="text-xs text-gray-400">
                  Last checked: {connectionState.lastCheck.toLocaleTimeString()}
                </p>
              </div>
            )}

            {connectionState.backend === 'offline' && (
              <div className="pt-2 border-t border-gray-600">
                <p className="text-xs text-yellow-400">
                  ⚠️ Backend offline - using demo data
                </p>
              </div>
            )}

            {connectionState.sei === 'offline' && (
              <div className="pt-2 border-t border-gray-600">
                <p className="text-xs text-red-400">
                  ❌ Sei network unreachable
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};