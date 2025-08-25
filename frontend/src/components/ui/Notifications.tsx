import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { colors } from '../../lib/colors';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
}

interface NotificationsProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onRemove }) => {
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-white" />;
      case 'error':
        return <AlertCircle size={20} className="text-white" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-white" />;
      case 'info':
        return <Info size={20} className="text-white" />;
      default:
        return <Info size={20} className="text-white" />;
    }
  };

  const getBackgroundColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return colors.neonGreen;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'info':
        return colors.neonBlue;
      default:
        return colors.neonBlue;
    }
  };

  const getBorderColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return colors.glassBorder;
      case 'error':
        return 'rgba(239, 68, 68, 0.3)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.3)';
      case 'info':
        return 'rgba(6, 182, 212, 0.3)';
      default:
        return colors.glassBorder;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative max-w-sm"
          >
            <div
              className="p-4 rounded-lg border backdrop-blur-xl shadow-lg"
              style={{
                backgroundColor: colors.glass,
                borderColor: getBorderColor(notification.type),
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px ${getBorderColor(notification.type)}`,
              }}
            >
              <div className="flex items-start space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: getBackgroundColor(notification.type) }}
                >
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium leading-relaxed">
                    {notification.message}
                  </p>
                  <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                
                <button
                  onClick={() => onRemove(notification.id)}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
                  style={{ color: colors.textMuted }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
