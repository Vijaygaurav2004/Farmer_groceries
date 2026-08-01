import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Text, View, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radii, shadows } from '../../theme';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; type: ToastType; message: string; }

const cfg: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: palette.green600 },
  error: { icon: 'alert-circle', color: palette.coral },
  info: { icon: 'information-circle', color: palette.sky },
};

const ToastCtx = createContext<{ show: (message: string, type?: ToastType) => void }>({ show: () => {} });
export const useToast = () => useContext(ToastCtx);

let counter = 1;

function ToastRow({ item }: { item: ToastItem }) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(p, { toValue: 1, useNativeDriver: Platform.OS !== 'web', damping: 15, stiffness: 180 }).start();
  }, []);
  const c = cfg[item.type];
  return (
    <Animated.View
      style={[
        {
          opacity: p,
          transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: palette.white,
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: radii.pill,
          marginBottom: 8,
          maxWidth: 360,
          borderLeftWidth: 4,
          borderLeftColor: c.color,
        },
        shadows.lg,
      ]}
    >
      <Ionicons name={c.icon} size={20} color={c.color} />
      <Text style={{ marginLeft: 10, fontSize: 14, fontWeight: '600', color: palette.ink, flexShrink: 1 }}>{item.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = counter++;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <View pointerEvents="none" style={{ position: 'absolute', top: Platform.OS === 'web' ? 20 : 54, left: 0, right: 0, alignItems: 'center', zIndex: 9999 }}>
        {toasts.map((t) => <ToastRow key={t.id} item={t} />)}
      </View>
    </ToastCtx.Provider>
  );
}
