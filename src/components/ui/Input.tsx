import React, { useState } from 'react';
import { Text, View, TextInput, TextInputProps, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radii } from '../../theme';

interface Props extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  prefix?: string;
  error?: string;
  isPassword?: boolean;
}

export function Input({ label, icon, prefix, error, isPassword, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!isPassword);

  return (
    <View style={{ marginBottom: 16 }}>
      {label ? (
        <Text style={{ fontSize: 13, fontWeight: '700', color: palette.slate700, marginBottom: 8 }}>{label}</Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: palette.white,
          borderRadius: radii.md,
          borderWidth: 1.5,
          borderColor: error ? palette.coral : focused ? palette.green500 : palette.slate200,
          paddingHorizontal: 14,
          height: 54,
        }}
      >
        {icon ? <Ionicons name={icon} size={19} color={focused ? palette.green600 : palette.slate400} style={{ marginRight: 10 }} /> : null}
        {prefix ? <Text style={{ fontSize: 15.5, color: palette.slate700, marginRight: 6, fontWeight: '600' }}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={palette.slate400}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={hidden}
          style={[{ flex: 1, fontSize: 15.5, color: palette.ink, height: '100%' }, style as any]}
          {...rest}
        />
        {isPassword ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={palette.slate400} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={{ color: palette.coral, fontSize: 12.5, marginTop: 6, marginLeft: 4 }}>{error}</Text> : null}
    </View>
  );
}
