import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { palette, radii, shadows } from '../../theme';

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: palette.ink, letterSpacing: -0.3 }}>{title}</Text>
      {action ? (
        <PressableScale onPress={onAction}>
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: palette.green600 }}>{action}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  color = palette.ink,
  bg = palette.white,
  size = 42,
  badge,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  bg?: string;
  size?: number;
  badge?: number;
  style?: ViewStyle;
}) {
  return (
    <PressableScale onPress={onPress} style={style}>
      <View
        style={[
          { width: size, height: size, borderRadius: radii.pill, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
          shadows.sm,
        ]}
      >
        <Ionicons name={icon} size={size * 0.5} color={color} />
        {badge != null && badge > 0 ? (
          <View
            style={{
              position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10,
              backgroundColor: palette.coral, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
              borderWidth: 2, borderColor: palette.white,
            }}
          >
            <Text style={{ color: palette.white, fontSize: 11, fontWeight: '800' }}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

export function Avatar({ emoji, name, size = 52, tint = palette.green100 }: { emoji?: string; name?: string; size?: number; tint?: string }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || '🙂';
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.42 }}>{emoji || initial}</Text>
    </View>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  compact,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  compact?: boolean;
}) {
  const btn = compact ? 30 : 38;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.slate100, borderRadius: radii.pill, padding: 3 }}>
      <PressableScale onPress={() => onChange(Math.max(min, value - 1))} scaleTo={0.85}>
        <View style={{ width: btn, height: btn, borderRadius: btn / 2, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="remove" size={compact ? 16 : 20} color={palette.slate700} />
        </View>
      </PressableScale>
      <Text style={{ minWidth: compact ? 26 : 34, textAlign: 'center', fontSize: compact ? 14 : 16, fontWeight: '800', color: palette.ink }}>
        {value}
      </Text>
      <PressableScale onPress={() => onChange(value + 1)} scaleTo={0.85}>
        <View style={{ width: btn, height: btn, borderRadius: btn / 2, backgroundColor: palette.green600, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="add" size={compact ? 16 : 20} color={palette.white} />
        </View>
      </PressableScale>
    </View>
  );
}

export function EmptyState({ icon = '🧺', title, subtitle, children }: { icon?: string; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 60 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: palette.green50, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Text style={{ fontSize: 44 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 19, fontWeight: '800', color: palette.ink, textAlign: 'center', marginBottom: 8 }}>{title}</Text>
      {subtitle ? <Text style={{ fontSize: 14.5, color: palette.slate500, textAlign: 'center', lineHeight: 21 }}>{subtitle}</Text> : null}
      {children ? <View style={{ marginTop: 22, alignSelf: 'stretch' }}>{children}</View> : null}
    </View>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: 1, backgroundColor: palette.slate100 }, style]} />;
}
