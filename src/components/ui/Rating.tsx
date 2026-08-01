import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme';

export function Rating({ value, reviews, size = 13 }: { value: number; reviews?: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="star" size={size} color={palette.amber500} />
      <Text style={{ fontSize: size, fontWeight: '700', color: palette.slate700, marginLeft: 3 }}>
        {value.toFixed(1)}
      </Text>
      {reviews != null ? (
        <Text style={{ fontSize: size - 1, color: palette.slate400, marginLeft: 3 }}>({reviews})</Text>
      ) : null}
    </View>
  );
}
