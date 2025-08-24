import React from 'react';
import { motion } from 'framer-motion';
import { colors, shadows } from '../../lib/colors';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'green' | 'purple' | 'blue' | 'orange' | 'none';
  variant?: 'default' | 'elevated' | 'flat';
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hover = true, 
  glow = 'none',
  variant = 'default',
  onClick 
}) => {
  const getGlowColor = () => {
    switch (glow) {
      case 'green': return colors.neonGreen;
      case 'purple': return colors.neonPurple;
      case 'blue': return colors.neonBlue;
      case 'orange': return colors.warning;
      default: return colors.neonGreen;
    }
  };

  const getGlowShadow = () => {
    switch (glow) {
      case 'green': return shadows.neonGreen;
      case 'purple': return shadows.neonPurple;
      case 'blue': return shadows.neonBlue;
      case 'orange': return '0 0 30px rgba(245, 158, 11, 0.4), 0 0 60px rgba(245, 158, 11, 0.2)';
      default: return shadows.glow;
    }
  };

  const getBorderColor = () => {
    switch (glow) {
      case 'green': return colors.glassBorder;
      case 'purple': return colors.glassBorderPurple;
      case 'blue': return colors.glassBorderBlue;
      case 'orange': return 'rgba(245, 158, 11, 0.15)';
      default: return colors.glassBorder;
    }
  };

  const baseStyles = {
    backgroundColor: colors.glass,
    borderColor: getBorderColor(),
    boxShadow: variant === 'elevated' ? shadows.cardHover : 
               variant === 'flat' ? 'none' : shadows.card,
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={baseStyles}
      whileHover={hover ? { 
        scale: variant === 'flat' ? 1.01 : 1.02,
        boxShadow: glow !== 'none' ? getGlowShadow() : shadows.cardHover,
        backgroundColor: colors.glassHover,
        borderColor: glow !== 'none' ? `${getGlowColor()}40` : getBorderColor(),
      } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
      onClick={onClick}
    >
      {/* Subtle inner glow */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(135deg, ${colors.glassLight} 0%, transparent 50%)`
        }}
      />
      
      {/* Hover glow effect */}
      {glow !== 'none' && (
        <motion.div 
          className="absolute inset-0 opacity-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${getGlowColor()}08, transparent 70%)`
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Bottom highlight */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-px opacity-50"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.glassLight}, transparent)`
        }}
      />
    </motion.div>
  );
};