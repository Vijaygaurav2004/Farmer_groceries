import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PressableScale } from './PressableScale';
import { palette, radii, shadows } from '../../theme';

type IconPair = [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap];

const ICONS: Record<string, IconPair> = {
  home: ['home', 'home-outline'],
  cart: ['cart', 'cart-outline'],
  orders: ['cube', 'cube-outline'],
  profile: ['person', 'person-outline'],
  dashboard: ['grid', 'grid-outline'],
  products: ['leaf', 'leaf-outline'],
  earnings: ['wallet', 'wallet-outline'],
  map: ['map', 'map-outline'],
};

const LABELS: Record<string, string> = {
  home: 'Home', cart: 'Cart', orders: 'Orders', profile: 'Profile',
  dashboard: 'Home', products: 'Products', earnings: 'Earnings', map: 'Map',
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={{ backgroundColor: 'transparent', paddingHorizontal: 14, paddingBottom: Platform.OS === 'web' ? 14 : 26, paddingTop: 6 }}>
      <View
        style={[
          {
            flexDirection: 'row', backgroundColor: palette.white, borderRadius: radii.pill,
            paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'space-around',
          },
          shadows.lg,
        ]}
      >
        {state.routes.map((route, index) => {
          const pair = ICONS[route.name];
          if (!pair) return null; // hidden routes (product/[id], payment, etc.)
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <PressableScale key={route.key} onPress={onPress} scaleTo={0.9} style={{ flex: 1 }}>
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}>
                <View
                  style={{
                    paddingHorizontal: focused ? 18 : 10, paddingVertical: 7, borderRadius: radii.pill,
                    backgroundColor: focused ? palette.green50 : 'transparent',
                  }}
                >
                  <Ionicons name={focused ? pair[0] : pair[1]} size={22} color={focused ? palette.green600 : palette.slate400} />
                </View>
                <Text style={{ fontSize: 10.5, fontWeight: focused ? '800' : '600', color: focused ? palette.green700 : palette.slate400, marginTop: 2 }}>
                  {LABELS[route.name] || route.name}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}
