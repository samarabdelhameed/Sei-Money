import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { colors } from '../../lib/colors';
import { motion } from 'framer-motion';

interface LineChartProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  color?: 'green' | 'purple';
  height?: number;
  showGrid?: boolean;
  animate?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  color = 'green',
  height = 300,
  showGrid = true,
  animate = true
}) => {
  const strokeColor = color === 'green' ? colors.neonGreen : colors.neonPurple;
  
  return (
    <motion.div 
      style={{ height }}
      initial={animate ? { opacity: 0 } : undefined}
      animate={animate ? { opacity: 1 } : undefined}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={colors.glassBorder}
              opacity={0.3}
            />
          )}
          <XAxis 
            dataKey="name" 
            stroke={colors.textMuted}
            fontSize={12}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke={colors.textMuted}
            fontSize={12}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.glassBorder}`,
              borderRadius: '8px',
              color: colors.text,
              backdropFilter: 'blur(10px)',
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={strokeColor}
            strokeWidth={3}
            dot={{ fill: strokeColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: strokeColor, stroke: 'white', strokeWidth: 2 }}
            animationDuration={animate ? 1500 : 0}
            style={{
              filter: `drop-shadow(0 0 6px ${strokeColor}60)`,
            }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};