// Central design tokens for the app's premium look & feel.
// Kept framework-agnostic (plain values) so both NativeWind classes and inline
// styles can share the same source of truth.

import { Platform, ViewStyle } from 'react-native';

export const palette = {
  // Brand — fresh farm green
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green300: '#86efac',
  green400: '#4ade80',
  green500: '#22c55e',
  green600: '#16a34a',
  green700: '#15803d',
  green800: '#166534',
  green900: '#14532d',

  // Warm accent — harvest amber
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber600: '#d97706',

  // Supporting
  coral: '#fb7185',
  sky: '#38bdf8',
  violet: '#8b5cf6',

  ink: '#0f172a',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  white: '#ffffff',
};

// Signature gradients (used on headers, hero cards, primary buttons)
export const gradients = {
  brand: ['#16a34a', '#22c55e', '#4ade80'] as const,
  brandDeep: ['#15803d', '#16a34a'] as const,
  sunrise: ['#f59e0b', '#fb7185'] as const,
  mint: ['#dcfce7', '#f0fdf4'] as const,
  night: ['#0f172a', '#15803d'] as const,
};

// Cross-platform elevation. On web NativeWind maps to box-shadow; here we return
// style objects so any component can float consistently.
const shadow = (
  y: number,
  blur: number,
  opacity: number,
  radius = 0,
): ViewStyle =>
  Platform.select({
    web: { boxShadow: `0px ${y}px ${blur}px rgba(15, 23, 42, ${opacity})` } as unknown as ViewStyle,
    default: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: y },
      shadowOpacity: opacity,
      shadowRadius: radius || blur / 2,
      elevation: y + 2,
    },
  }) as ViewStyle;

export const shadows = {
  sm: shadow(2, 8, 0.06),
  md: shadow(6, 18, 0.1),
  lg: shadow(12, 30, 0.14),
  glow: Platform.select({
    web: { boxShadow: '0px 10px 24px rgba(22, 163, 74, 0.35)' } as unknown as ViewStyle,
    default: {
      shadowColor: '#16a34a',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 10,
    },
  }) as ViewStyle,
};

export const radii = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

// Emoji + tint pairing per category, reused across cards for a cohesive palette.
export const categoryTheme: Record<string, { tint: string; ink: string; emoji: string }> = {
  vegetables: { tint: '#dcfce7', ink: '#15803d', emoji: '🥬' },
  fruits: { tint: '#fee2e2', ink: '#dc2626', emoji: '🍎' },
  dairy: { tint: '#e0f2fe', ink: '#0369a1', emoji: '🥛' },
  grains: { tint: '#fef3c7', ink: '#b45309', emoji: '🌾' },
  herbs: { tint: '#dcfce7', ink: '#15803d', emoji: '🌿' },
  eggs: { tint: '#fef9c3', ink: '#a16207', emoji: '🥚' },
  honey: { tint: '#fef3c7', ink: '#d97706', emoji: '🍯' },
  other: { tint: '#f1f5f9', ink: '#475569', emoji: '🛒' },
};

export const categoryStyle = (category?: string) =>
  categoryTheme[category || 'other'] || categoryTheme.other;
