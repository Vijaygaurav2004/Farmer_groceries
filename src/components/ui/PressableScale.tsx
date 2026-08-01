import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, Platform, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

type Props = PressableProps & {
  children: React.ReactNode;
  scaleTo?: number;
  haptic?: boolean;
  style?: ViewStyle | ViewStyle[];
};

/** A Pressable that gently scales down on press for tactile feedback. */
export function PressableScale({
  children,
  scaleTo = 0.96,
  haptic = true,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: Platform.OS !== 'web', speed: 40, bounciness: 6 }).start();

  return (
    <Pressable
      onPressIn={(e) => {
        animate(scaleTo);
        if (haptic && Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animate(1);
        onPressOut?.(e);
      }}
      style={style as any}
      {...rest}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}
