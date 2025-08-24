export const colors = {
  // Background
  cosmic: '#0A0E1A',
  cosmicLight: '#0F1419',
  card: '#111827',
  cardHover: '#1F2937',
  
  // Primary Brand Colors
  neonGreen: '#00F5A0',
  neonGreenDark: '#00D084',
  neonGreenLight: '#33F7B3',
  neonPurple: '#8B5CF6',
  neonPurpleDark: '#7C3AED',
  neonPurpleLight: '#A78BFA',
  neonBlue: '#06B6D4',
  neonBlueDark: '#0891B2',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Text colors
  text: '#F9FAFB',
  textMuted: '#D1D5DB',
  textDim: '#9CA3AF',
  textFaded: '#6B7280',
  
  // Accent colors
  accent1: '#00F5A0',
  accent2: '#8B5CF6',
  accent3: '#F59E0B',
  accent4: '#06B6D4',
  
  // Enhanced Gradients
  gradientNeon: 'linear-gradient(135deg, #00F5A0 0%, #8B5CF6 50%, #06B6D4 100%)',
  gradientGreen: 'linear-gradient(135deg, #00F5A0 0%, #00D084 100%)',
  gradientPurple: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  gradientBlue: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
  gradientWarm: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  
  // Enhanced Glassmorphism
  glass: 'rgba(17, 24, 39, 0.75)',
  glassHover: 'rgba(31, 41, 55, 0.85)',
  glassLight: 'rgba(249, 250, 251, 0.05)',
  glassBorder: 'rgba(0, 245, 160, 0.15)',
  glassBorderPurple: 'rgba(139, 92, 246, 0.15)',
  glassBorderBlue: 'rgba(6, 182, 212, 0.15)',
  
  // Surface colors
  surface: 'rgba(17, 24, 39, 0.6)',
  surfaceHover: 'rgba(31, 41, 55, 0.7)',
  surfaceActive: 'rgba(55, 65, 81, 0.8)',
} as const;

export const shadows = {
  neonGreen: '0 0 30px rgba(0, 245, 160, 0.4), 0 0 60px rgba(0, 245, 160, 0.2)',
  neonPurple: '0 0 30px rgba(139, 92, 246, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)',
  neonBlue: '0 0 30px rgba(6, 182, 212, 0.4), 0 0 60px rgba(6, 182, 212, 0.2)',
  card: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  cardHover: '0 20px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  glow: '0 0 20px rgba(0, 245, 160, 0.3)',
  glowPurple: '0 0 20px rgba(139, 92, 246, 0.3)',
  glowBlue: '0 0 20px rgba(6, 182, 212, 0.3)',
  inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
} as const;