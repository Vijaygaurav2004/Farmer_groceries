import React from 'react';
import { View, ViewStyle } from 'react-native';
import { palette, radii, shadows } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padding?: number;
  radius?: number;
  elevation?: 'sm' | 'md' | 'lg' | 'none';
  bordered?: boolean;
}

export function Card({ children, style, padding = 16, radius = radii.lg, elevation = 'md', bordered }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: palette.white,
          borderRadius: radius,
          padding,
          borderWidth: bordered ? 1 : 0,
          borderColor: palette.slate100,
        },
        elevation !== 'none' ? shadows[elevation] : undefined,
        style as any,
      ]}
    >
      {children}
    </View>
  );
}
