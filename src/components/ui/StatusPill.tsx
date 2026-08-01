import React from 'react';
import { Text, View } from 'react-native';
import { ORDER_STATUS } from '../../constants';
import { radii } from '../../theme';

/** Lightens a hex color toward white for soft pill backgrounds. */
function tint(hex: string, amount = 0.85) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function StatusPill({ status, size = 'md' }: { status: keyof typeof ORDER_STATUS; size?: 'sm' | 'md' }) {
  const s = ORDER_STATUS[status] || ORDER_STATUS.placed;
  const pad = size === 'sm' ? { px: 9, py: 4, fs: 11 } : { px: 12, py: 6, fs: 12.5 };
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: tint(s.color),
        paddingHorizontal: pad.px,
        paddingVertical: pad.py,
        borderRadius: radii.pill,
      }}
    >
      <Text style={{ fontSize: pad.fs, marginRight: 4 }}>{s.icon}</Text>
      <Text style={{ fontSize: pad.fs, fontWeight: '700', color: s.color }}>{s.label}</Text>
    </View>
  );
}
