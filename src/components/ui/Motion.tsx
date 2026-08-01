import React, { useEffect, useRef } from 'react';
import { Animated, Platform, ViewStyle } from 'react-native';

/**
 * Reliable entrance animation built on React Native's Animated API.
 * Moti/reanimated occasionally stalls at the `from` state on web (leaving
 * content invisible), so we use the classic Animated driver which always
 * resolves to the final state.
 */
export function FadeInUp({
  children,
  delay = 0,
  distance = 16,
  duration = 420,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, delay);
    return () => clearTimeout(id);
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
        style as any,
      ]}
    >
      {children}
    </Animated.View>
  );
}
