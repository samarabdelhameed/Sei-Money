import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../lib/colors';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'green' | 'purple' | 'blue' | 'white';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'green',
  text 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorMap = {
    green: colors.neonGreen,
    purple: colors.neonPurple,
    blue: colors.neonBlue,
    white: colors.text
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <motion.div
        className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full`}
        style={{ color: colorMap[color] }}
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm"
          style={{ color: colors.textMuted }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};
