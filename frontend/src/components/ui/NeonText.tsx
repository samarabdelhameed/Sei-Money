import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../lib/colors';

interface NeonTextProps {
  children: React.ReactNode;
  color?: 'green' | 'purple' | 'blue' | 'orange' | 'white';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  glow?: boolean;
  animate?: boolean;
  gradient?: boolean;
  className?: string;
}

export const NeonText: React.FC<NeonTextProps> = ({
  children,
  color = 'green',
  size = 'md',
  weight = 'medium',
  glow = false,
  animate = false,
  gradient = false,
  className = ''
}) => {
  const colorMap = {
    green: colors.neonGreen,
    purple: colors.neonPurple,
    blue: colors.neonBlue,
    orange: colors.warning,
    white: colors.text
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const selectedColor = colorMap[color];

  const getGradientStyle = () => {
    if (!gradient) return {};
    
    switch (color) {
      case 'green':
        return {
          background: colors.gradientGreen,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        };
      case 'purple':
        return {
          background: colors.gradientPurple,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        };
      case 'blue':
        return {
          background: colors.gradientBlue,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        };
      default:
        return {
          background: colors.gradientNeon,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        };
    }
  };

  const baseStyle = gradient ? getGradientStyle() : {
    color: selectedColor,
    textShadow: glow ? `0 0 20px ${selectedColor}60, 0 0 40px ${selectedColor}30` : undefined,
  };

  return (
    <motion.span
      className={`${weightClasses[weight]} ${sizeClasses[size]} ${className}`}
      style={baseStyle}
      animate={animate ? {
        textShadow: glow ? [
          `0 0 20px ${selectedColor}60, 0 0 40px ${selectedColor}30`,
          `0 0 30px ${selectedColor}80, 0 0 60px ${selectedColor}40`,
          `0 0 20px ${selectedColor}60, 0 0 40px ${selectedColor}30`,
        ] : undefined
      } : undefined}
      transition={animate ? { 
        duration: 3, 
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1]
      } : undefined}
    >
      {children}
    </motion.span>
  );
};