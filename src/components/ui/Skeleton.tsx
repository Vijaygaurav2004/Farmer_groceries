import React from 'react';
import { View, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { palette, radii } from '../../theme';

export function Skeleton({ width = '100%', height = 20, radius = 10, style }: { width?: number | string; height?: number; radius?: number; style?: ViewStyle }) {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ loop: true, type: 'timing', duration: 800, repeatReverse: true }}
      style={[{ width: width as any, height, borderRadius: radius, backgroundColor: palette.slate200 }, style]}
    />
  );
}

/** A product-card shaped skeleton for grid loading states. */
export function ProductCardSkeleton() {
  return (
    <View style={{ width: '48%', marginBottom: 16, backgroundColor: palette.white, borderRadius: radii.lg, padding: 10 }}>
      <Skeleton height={110} radius={14} />
      <Skeleton height={14} width="80%" style={{ marginTop: 12 }} />
      <Skeleton height={12} width="55%" style={{ marginTop: 8 }} />
      <Skeleton height={28} width="100%" style={{ marginTop: 12 }} />
    </View>
  );
}
