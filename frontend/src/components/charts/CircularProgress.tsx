import React from 'react';
import { motion } from 'framer-motion';
import { colors } from '../../lib/colors';

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'green' | 'purple';
  showPercentage?: boolean;
  animate?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'green',
  showPercentage = true,
  animate = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  const strokeColor = color === 'green' ? colors.neonGreen : colors.neonPurple;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.glassBorder}
          strokeWidth={strokeWidth}
          fill="transparent"
          opacity={0.3}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: animate ? circumference : offset,
            filter: `drop-shadow(0 0 8px ${strokeColor}60)`,
          }}
          animate={animate ? { strokeDashoffset: offset } : undefined}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
      {showPercentage && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          initial={animate ? { scale: 0 } : undefined}
          animate={animate ? { scale: 1 } : undefined}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <span 
            className="text-xl font-bold"
            style={{ color: strokeColor }}
          >
            {Math.round(progress)}%
          </span>
        </motion.div>
      )}
    </div>
  );
};