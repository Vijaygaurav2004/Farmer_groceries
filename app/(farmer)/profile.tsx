import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { APP_CONFIG } from '../../src/constants';
import { PressableScale, useToast, FadeInUp, Divider } from '../../src/components/ui';
import { palette, radii, shadows, gradients } from '../../src/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function FarmerProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } },
    ]);
  };

  const items: { icon: IoniconName; label: string; color: string }[] = [
    { icon: 'leaf-outline', label: 'Farm Details', color: palette.green600 },
    { icon: 'document-attach-outline', label: 'Verification Documents', color: palette.sky },
    { icon: 'wallet-outline', label: 'Earnings & Payouts', color: palette.amber600 },
    { icon: 'star-outline', label: 'Reviews & Ratings', color: palette.violet },
    { icon: 'notifications-outline', label: 'Notifications', color: palette.coral },
    { icon: 'help-circle-outline', label: 'Help & Support', color: palette.slate500 },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <LinearGradient colors={gradients.brand as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 60, paddingBottom: 28, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
          <View style={[{ width: 92, height: 92, borderRadius: 46, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, shadows.md]}>
            <Text style={{ fontSize: 46 }}>🧑‍🌾</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: palette.white }}>{user?.name || 'Farmer'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radii.pill }}>
            <Ionicons name="shield-checkmark" size={14} color={palette.white} />
            <Text style={{ fontSize: 12.5, color: palette.white, marginLeft: 5, fontWeight: '700' }}>Verified Farmer</Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 18, marginTop: 20 }}>
          <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, overflow: 'hidden' }, shadows.sm]}>
            {items.map((item, idx) => (
              <View key={item.label}>
                <PressableScale onPress={() => toast.show(`${item.label} — coming soon`, 'info')} scaleTo={0.99} haptic={false}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: item.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={item.icon} size={19} color={item.color} />
                    </View>
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: palette.ink, marginLeft: 14 }}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color={palette.slate300} />
                  </View>
                </PressableScale>
                {idx < items.length - 1 ? <Divider style={{ marginLeft: 68 }} /> : null}
              </View>
            ))}
          </View>

          <View style={{ marginTop: 22 }}>
            <PressableScale onPress={handleSignOut}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderRadius: radii.pill, paddingVertical: 16 }}>
                <Ionicons name="log-out-outline" size={20} color={palette.coral} />
                <Text style={{ fontSize: 15.5, fontWeight: '800', color: palette.coral, marginLeft: 8 }}>Sign Out</Text>
              </View>
            </PressableScale>
            <Text style={{ textAlign: 'center', fontSize: 12, color: palette.slate400, marginTop: 18 }}>{APP_CONFIG.name} · v{APP_CONFIG.version}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
