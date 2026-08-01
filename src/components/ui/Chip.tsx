import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { palette, radii, shadows } from '../../theme';

interface Props {
  label: string;
  emoji?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, emoji, icon, active, onPress }: Props) {
  return (
    <PressableScale onPress={onPress} style={{ marginRight: 10 }} scaleTo={0.93}>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: radii.pill,
            backgroundColor: active ? palette.green600 : palette.white,
            borderWidth: 1,
            borderColor: active ? palette.green600 : palette.slate200,
          },
          active ? shadows.sm : undefined,
        ]}
      >
        {emoji ? <Text style={{ fontSize: 15, marginRight: 6 }}>{emoji}</Text> : null}
        {icon ? (
          <Ionicons name={icon} size={15} color={active ? palette.white : palette.slate500} style={{ marginRight: 6 }} />
        ) : null}
        <Text style={{ fontSize: 13.5, fontWeight: '700', color: active ? palette.white : palette.slate700 }}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
