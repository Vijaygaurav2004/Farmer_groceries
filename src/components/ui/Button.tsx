import React from 'react';
import { Text, View, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { gradients, palette, radii, shadows } from '../../theme';

type Variant = 'primary' | 'solid' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const heights: Record<Size, number> = { sm: 40, md: 50, lg: 58 };
const fontSizes: Record<Size, number> = { sm: 14, md: 16, lg: 17 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth = true,
  style,
}: Props) {
  const height = heights[size];
  const isGradient = variant === 'primary';
  const textColor =
    variant === 'outline' || variant === 'ghost' ? palette.green700 : palette.white;

  const bg: Record<Variant, string> = {
    primary: 'transparent',
    solid: palette.green600,
    outline: 'transparent',
    ghost: palette.green50,
    danger: palette.coral,
  };

  const inner = (
    <View
      style={{
        height,
        borderRadius: radii.pill,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: 22,
        backgroundColor: isGradient ? 'transparent' : bg[variant],
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor: palette.green200,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={fontSizes[size] + 3} color={textColor} style={{ marginRight: 8 }} />}
          <Text style={{ color: textColor, fontSize: fontSizes[size], fontWeight: '700', letterSpacing: 0.2 }}>
            {label}
          </Text>
          {iconRight && <Ionicons name={iconRight} size={fontSizes[size] + 3} color={textColor} style={{ marginLeft: 8 }} />}
        </>
      )}
    </View>
  );

  return (
    <PressableScale
      onPress={disabled || loading ? undefined : onPress}
      style={[{ width: fullWidth ? '100%' : undefined }, variant === 'primary' ? shadows.glow : undefined, style] as any}
    >
      {isGradient ? (
        <LinearGradient
          colors={disabled ? [palette.slate300, palette.slate400] : gradients.brand as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: radii.pill }}
        >
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </PressableScale>
  );
}
