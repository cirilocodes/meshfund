export const COLORS = {
  // Primary colors from MeshFund design
  primary: '#1E40AF',
  secondary: '#0F172A',
  
  // Text colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textInverse: '#FFFFFF',
  
  // Background colors
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceLight: '#F3F4F6',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Input colors
  placeholder: '#9CA3AF',
  
  // Special colors
  accent: '#8B5CF6',
  gold: '#F59E0B',
  
  // Gradients (for special UI elements)
  primaryGradient: ['#1E40AF', '#3B82F6'],
  secondaryGradient: ['#0F172A', '#374151'],
} as const;

export type ColorKey = keyof typeof COLORS;