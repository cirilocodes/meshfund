// MeshFund Brand Colors - Based on design specifications
export const COLORS = {
  // Primary brand colors
  primary: '#0B5E71',        // Deep teal - primary brand color
  primaryLight: '#1E8A9B',   // Lighter teal
  primaryDark: '#094D5E',    // Darker teal
  
  // Secondary colors
  secondary: '#F0B800',      // Golden yellow - secondary brand color
  secondaryLight: '#F5C842', // Lighter yellow
  secondaryDark: '#D19F00',  // Darker yellow
  
  // Neutral colors
  background: '#FAF9F6',     // Warm white background
  surface: '#FFFFFF',        // Pure white for cards/surfaces
  surfaceLight: '#F8F8F8',   // Light gray for subtle surfaces
  
  // Text colors
  textPrimary: '#1A1A1A',    // Almost black for primary text
  textSecondary: '#6B7280',  // Gray for secondary text
  textTertiary: '#9CA3AF',   // Light gray for tertiary text
  textInverse: '#FFFFFF',    // White text for dark backgrounds
  
  // Status colors
  success: '#10B981',        // Green for success states
  successLight: '#34D399',   // Light green
  successDark: '#059669',    // Dark green
  
  warning: '#F59E0B',        // Orange for warning states
  warningLight: '#FBBF24',   // Light orange
  warningDark: '#D97706',    // Dark orange
  
  error: '#EF4444',          // Red for error states
  errorLight: '#F87171',     // Light red
  errorDark: '#DC2626',      // Dark red
  
  info: '#3B82F6',          // Blue for info states
  infoLight: '#60A5FA',     // Light blue
  infoDark: '#2563EB',      // Dark blue
  
  // Border colors
  border: '#E5E7EB',        // Default border color
  borderLight: '#F3F4F6',   // Light border
  borderDark: '#D1D5DB',    // Dark border
  
  // Special colors
  overlay: 'rgba(0, 0, 0, 0.5)',     // For modals/overlays
  disabled: '#9CA3AF',               // For disabled states
  placeholder: '#6B7280',            // For placeholder text
  
  // Financial/monetary colors
  positive: '#10B981',      // For positive amounts/gains
  negative: '#EF4444',      // For negative amounts/losses
  pending: '#F59E0B',       // For pending transactions
} as const;

// Color themes for different group types or categories
export const GROUP_THEMES = {
  savings: {
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: '#F0F9FF',
  },
  investment: {
    primary: '#7C3AED',
    secondary: '#A78BFA',
    background: '#F5F3FF',
  },
  community: {
    primary: '#059669',
    secondary: '#34D399',
    background: '#F0FDF4',
  },
  family: {
    primary: '#DC2626',
    secondary: '#F87171',
    background: '#FEF2F2',
  },
} as const;

export type ColorTheme = keyof typeof GROUP_THEMES;