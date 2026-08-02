import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { UserRole } from '../src/types';
import { Button, PressableScale, useToast, FadeInUp } from '../src/components/ui';
import { palette, radii, shadows } from '../src/theme';

interface RoleOption {
  role: UserRole;
  emoji: string;
  title: string;
  description: string;
  tint: string;
  ink: string;
}

const roleOptions: RoleOption[] = [
  { role: 'customer', emoji: '🛒', title: 'Customer', description: 'Buy fresh produce directly from farmers', tint: '#e0f2fe', ink: '#0369a1' },
  { role: 'farmer', emoji: '🌾', title: 'Farmer', description: 'Sell your produce directly to customers', tint: '#dcfce7', ink: '#15803d' },
  { role: 'delivery', emoji: '🚚', title: 'Delivery Partner', description: 'Deliver orders and earn on your schedule', tint: '#ffedd5', ink: '#c2410c' },
];

export default function RoleSelectScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const { setRole } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const handleContinue = async () => {
    if (!selectedRole) return toast.show('Please select a role to continue', 'error');
    setLoading(true);
    try {
      await setRole(selectedRole);
      if (selectedRole === 'customer') router.replace('/(customer)/home');
      else if (selectedRole === 'farmer') router.replace('/(farmer)/dashboard');
      else if (selectedRole === 'delivery') router.replace('/(delivery)/orders');
    } catch (error: any) {
      toast.show(error.message || 'Failed to set role', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <LinearGradient colors={['#16a34a', '#22c55e'] as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 64, paddingBottom: 34, paddingHorizontal: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
        <FadeInUp distance={-14}>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>One last step</Text>
          <Text style={{ fontSize: 30, fontWeight: '900', color: palette.white, letterSpacing: -0.6, marginTop: 4 }}>Choose your role</Text>
          <Text style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.9)', marginTop: 6 }}>Pick how you'll use Farmer Groceries</Text>
        </FadeInUp>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 22 }} showsVerticalScrollIndicator={false}>
        {roleOptions.map((option, i) => {
          const active = selectedRole === option.role;
          return (
            <FadeInUp key={option.role} delay={80 + i * 90}>
              <PressableScale onPress={() => setSelectedRole(option.role)} scaleTo={0.98} style={{ marginBottom: 14 }}>
                <View
                  style={[
                    {
                      flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: radii.lg,
                      backgroundColor: palette.white, borderWidth: 2,
                      borderColor: active ? palette.green500 : 'transparent',
                    },
                    active ? shadows.md : shadows.sm,
                  ]}
                >
                  <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: option.tint, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <Text style={{ fontSize: 30 }}>{option.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: palette.ink }}>{option.title}</Text>
                    <Text style={{ fontSize: 13, color: palette.slate500, marginTop: 3, lineHeight: 18 }}>{option.description}</Text>
                  </View>
                  <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? palette.green600 : palette.slate100 }}>
                    {active ? <Ionicons name="checkmark" size={16} color={palette.white} /> : null}
                  </View>
                </View>
              </PressableScale>
            </FadeInUp>
          );
        })}

        <FadeInUp delay={380} style={{ marginTop: 12 } as any}>
          <Button label="Continue" iconRight="arrow-forward" loading={loading} onPress={handleContinue} size="lg" />
          <Text style={{ textAlign: 'center', fontSize: 12.5, color: palette.slate400, marginTop: 16 }}>
            You can create another account for a different role anytime
          </Text>
        </FadeInUp>
      </ScrollView>
    </View>
  );
}
