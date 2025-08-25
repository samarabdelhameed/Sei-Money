import React from 'react';
import { motion } from 'framer-motion';
import { colors, shadows } from '../../lib/colors';

interface NeonButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'green' | 'purple' | 'blue' | 'orange';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  color = 'green',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button'
}) => {
  const baseClasses = "relative font-semibold rounded-xl transition-all duration-300 border overflow-hidden group";
  
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const colorMap = {
    green: {
      primary: colors.neonGreen,
      gradient: colors.gradientGreen,
      shadow: shadows.neonGreen
    },
    purple: {
      primary: colors.neonPurple,
      gradient: colors.gradientPurple,
      shadow: shadows.neonPurple
    },
    blue: {
      primary: colors.neonBlue,
      gradient: colors.gradientBlue,
      shadow: shadows.neonBlue
    },
    orange: {
      primary: colors.warning,
      gradient: colors.gradientWarm,
      shadow: '0 0 30px rgba(245, 158, 11, 0.4), 0 0 60px rgba(245, 158, 11, 0.2)'
    }
  };

  const selectedColor = colorMap[color] || colorMap.green; // Fallback to green if color is invalid
  const isDisabled = disabled || loading;

  const getVariantStyles = () => {
    if (isDisabled) {
      return {
        backgroundColor: colors.surface,
        borderColor: colors.textFaded,
        color: colors.textFaded,
        cursor: 'not-allowed'
      };
    }
    
    // Safety check for selectedColor
    if (!selectedColor) {
      return {
        backgroundColor: colors.surface,
        borderColor: colors.textFaded,
        color: colors.textFaded,
      };
    }
    
    switch (variant) {
      case 'primary':
        return {
          background: selectedColor.gradient,
          borderColor: 'transparent',
          color: '#ffffff',
          boxShadow: shadows.card
        };
      case 'secondary':
        return {
          backgroundColor: `${selectedColor.primary}15`,
          borderColor: `${selectedColor.primary}30`,
          color: selectedColor.primary
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: selectedColor.primary,
          color: selectedColor.primary
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          color: selectedColor.primary
        };
      default:
        return {};
    }
  };

  return (
    <motion.button
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={getVariantStyles()}
      whileHover={!isDisabled ? { 
        scale: 1.02,
        boxShadow: variant === 'primary' ? (selectedColor?.shadow || shadows.neonGreen) : 
                   `0 0 20px ${selectedColor?.primary || colors.neonGreen}30`,
      } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      disabled={isDisabled}
      onClick={onClick}
      transition={{
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {/* Shimmer effect for primary buttons */}
      {variant === 'primary' && !isDisabled && (
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          style={{
            background: `linear-gradient(45deg, transparent 30%, ${colors.glassLight} 50%, transparent 70%)`
          }}
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 3
          }}
        />
      )}
      
      {/* Hover glow effect */}
      {!isDisabled && (
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 rounded-xl"
          style={{
            background: `radial-gradient(circle at center, ${selectedColor?.primary || colors.neonGreen}10, transparent 70%)`
          }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center space-x-2">
        {loading && (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        <span>{children}</span>
      </span>
    </motion.button>
  );
};