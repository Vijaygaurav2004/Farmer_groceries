import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert, Modal } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order } from '../../src/types';
import { APP_CONFIG, SUCCESS_MESSAGES } from '../../src/constants';
import { formatCompactCurrency, validatePhone } from '../../src/utils/helpers';
import { Button, Input, PressableScale, useToast, FadeInUp, Divider } from '../../src/components/ui';
import { palette, radii, shadows, gradients } from '../../src/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function ProfileScreen() {
  const { user, signOut, refreshUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  // Reload on focus so the header reflects orders placed earlier in the session.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let cancelled = false;
      SupabaseService.getCustomerOrders(user.id)
        .then((data) => { if (!cancelled) setOrders(data); })
        .catch((error) => console.error('Profile: failed to load orders', error));
      return () => { cancelled = true; };
    }, [user])
  );

  const deliveredOrders = orders.filter((o) => o.orderStatus === 'delivered');
  const stats = [
    { label: 'Orders', value: `${orders.length}`, color: palette.green700 },
    { label: 'Delivered', value: `${deliveredOrders.length}`, color: palette.coral },
    { label: 'Spent', value: formatCompactCurrency(deliveredOrders.reduce((sum, o) => sum + o.total, 0)),
      color: palette.amber600 },
  ];

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) return toast.show('Please enter your name', 'error');
    if (phone && !validatePhone(phone.replace(/\D/g, '').slice(-10))) return toast.show('Enter a valid 10-digit number', 'error');
    if (!user) return;
    setSaving(true);
    try {
      await SupabaseService.updateUser(user.id, { name: name.trim(), phoneNumber: phone });
      await refreshUser();
      toast.show(SUCCESS_MESSAGES.profileUpdated, 'success');
      setEditModalVisible(false);
    } catch { toast.show('Failed to update profile', 'error'); }
    finally { setSaving(false); }
  };

  const menuGroups: { title: string; items: { icon: IoniconName; label: string; action: () => void; color: string }[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', color: palette.green600, action: () => setEditModalVisible(true) },
        { icon: 'location-outline', label: 'Saved Addresses', color: palette.sky, action: () => toast.show('Add addresses at checkout', 'info') },
        { icon: 'card-outline', label: 'Payment Methods', color: palette.violet, action: () => toast.show('Manage payment methods', 'info') },
        { icon: 'notifications-outline', label: 'Notifications', color: palette.amber500, action: () => toast.show('Notification settings', 'info') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help & Support', color: palette.green600, action: () => Alert.alert('Help & Support', `Email: ${APP_CONFIG.supportEmail}\nPhone: ${APP_CONFIG.supportPhone}`) },
        { icon: 'document-text-outline', label: 'Terms & Conditions', color: palette.slate500, action: () => toast.show('Terms of service', 'info') },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', color: palette.slate500, action: () => toast.show('Privacy policy', 'info') },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <LinearGradient colors={gradients.brand as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 60, paddingBottom: 30, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
          <FadeInUp>
            <View style={{ alignItems: 'center' }}>
              <View style={[{ width: 92, height: 92, borderRadius: 46, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, shadows.md]}>
                <Text style={{ fontSize: 46 }}>🧑‍🌾</Text>
              </View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: palette.white }}>{user?.name || 'Guest User'}</Text>
              <Text style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>{user?.email || 'guest@example.com'}</Text>
            </View>
          </FadeInUp>
        </LinearGradient>

        {/* Stats */}
        <FadeInUp style={{ flexDirection: 'row', marginHorizontal: 18, marginTop: -22 } as any}>
          {stats.map((s, i) => (
            <View
              key={s.label}
              style={[
                {
                  flex: 1, backgroundColor: palette.white, borderRadius: radii.lg,
                  paddingVertical: 16, alignItems: 'center',
                  marginRight: i < stats.length - 1 ? 6 : 0,
                  marginLeft: i > 0 ? 6 : 0,
                },
                shadows.md,
              ]}
            >
              <Text style={{ fontSize: 20, fontWeight: '900', color: s.color }}>{s.value}</Text>
              <Text style={{ fontSize: 11.5, color: palette.slate400, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </FadeInUp>

        {/* Menu */}
        {menuGroups.map((group) => (
          <View key={group.title} style={{ marginTop: 22, paddingHorizontal: 18 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: palette.slate400, marginBottom: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{group.title}</Text>
            <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, overflow: 'hidden' }, shadows.sm]}>
              {group.items.map((item, idx) => (
                <View key={item.label}>
                  <PressableScale onPress={item.action} scaleTo={0.99} haptic={false}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: item.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name={item.icon} size={19} color={item.color} />
                      </View>
                      <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: palette.ink, marginLeft: 14 }}>{item.label}</Text>
                      <Ionicons name="chevron-forward" size={18} color={palette.slate300} />
                    </View>
                  </PressableScale>
                  {idx < group.items.length - 1 ? <Divider style={{ marginLeft: 68 }} /> : null}
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={{ paddingHorizontal: 18, marginTop: 24 }}>
          <PressableScale onPress={handleSignOut}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderRadius: radii.pill, paddingVertical: 16 }}>
              <Ionicons name="log-out-outline" size={20} color={palette.coral} />
              <Text style={{ fontSize: 15.5, fontWeight: '800', color: palette.coral, marginLeft: 8 }}>Sign Out</Text>
            </View>
          </PressableScale>
          <Text style={{ textAlign: 'center', fontSize: 12, color: palette.slate400, marginTop: 18 }}>{APP_CONFIG.name} · v{APP_CONFIG.version}</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.5)' }}>
          <View style={{ backgroundColor: palette.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: palette.ink }}>Edit Profile</Text>
              <PressableScale onPress={() => setEditModalVisible(false)} scaleTo={0.85}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: palette.slate100, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={20} color={palette.slate500} />
                </View>
              </PressableScale>
            </View>
            <Input label="Full Name" icon="person-outline" value={name} onChangeText={setName} placeholder="Enter your name" />
            <Input label="Phone Number" icon="call-outline" prefix="+91" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
            <View style={{ marginTop: 8 }}>
              <Button label="Save Changes" icon="checkmark" loading={saving} onPress={handleSaveProfile} size="lg" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
