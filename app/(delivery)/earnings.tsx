import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order } from '../../src/types';
import { DELIVERY_FEE } from '../../src/constants';
import { formatCurrency, getTimeAgo } from '../../src/utils/helpers';
import { Chip, FadeInUp } from '../../src/components/ui';
import { palette, radii, shadows, gradients } from '../../src/theme';

type EarningsPeriod = 'today' | 'week' | 'month';

export default function DeliveryEarningsScreen() {
  const { user } = useAuth();
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<EarningsPeriod>('today');

  useEffect(() => { loadDeliveredOrders(); }, [user]);

  const loadDeliveredOrders = async () => {
    if (!user) return;
    try { setLoading(true); setDeliveredOrders(await SupabaseService.getDeliveryPartnerDeliveredOrders(user.id)); }
    catch { setDeliveredOrders([]); }
    finally { setLoading(false); }
  };
  const handleRefresh = async () => { setRefreshing(true); await loadDeliveredOrders(); setRefreshing(false); };

  const periodLabel: Record<EarningsPeriod, string> = { today: 'Today', week: 'This Week', month: 'This Month' };
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = deliveredOrders.reduce((acc, order) => {
    const c = new Date(order.createdAt);
    acc.total += DELIVERY_FEE;
    if (c >= startOfMonth) acc.month += DELIVERY_FEE;
    if (c >= startOfWeek) acc.week += DELIVERY_FEE;
    if (c >= startOfToday) acc.today += DELIVERY_FEE;
    return acc;
  }, { today: 0, week: 0, month: 0, total: 0 });

  const recentDeliveries = [...deliveredOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  const breakdown = [
    { label: 'Today', value: stats.today, icon: 'today-outline', color: palette.sky, bg: '#e0f2fe' },
    { label: 'This Week', value: stats.week, icon: 'calendar-outline', color: palette.green600, bg: palette.green50 },
    { label: 'This Month', value: stats.month, icon: 'calendar-number-outline', color: palette.violet, bg: '#f3e8ff' },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <LinearGradient colors={gradients.brand as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 58, paddingHorizontal: 20, paddingBottom: 30, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' }}>💰 Total Earnings</Text>
        <Text style={{ color: palette.white, fontSize: 40, fontWeight: '900', marginTop: 4, letterSpacing: -1 }}>{formatCurrency(stats.total)}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>{deliveredOrders.length} deliveries completed</Text>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={palette.green600} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.green600} />} contentContainerStyle={{ padding: 18, paddingBottom: 24 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {(Object.keys(periodLabel) as EarningsPeriod[]).map((k) => <Chip key={k} label={periodLabel[k]} active={period === k} onPress={() => setPeriod(k)} />)}
          </ScrollView>

          <FadeInUp style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 20, marginBottom: 20 }, shadows.md] as any}>
            <Text style={{ fontSize: 13.5, color: palette.slate400, fontWeight: '600' }}>{periodLabel[period]} earnings</Text>
            <Text style={{ fontSize: 34, fontWeight: '900', color: palette.green700, marginTop: 4 }}>{formatCurrency(stats[period])}</Text>
          </FadeInUp>

          <Text style={{ fontSize: 17, fontWeight: '800', color: palette.ink, marginBottom: 12 }}>Breakdown</Text>
          {breakdown.map((b, i) => (
            <FadeInUp key={b.label} delay={i * 70} style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, borderRadius: radii.lg, padding: 16, marginBottom: 12 }, shadows.sm] as any}>
              <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: b.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={b.icon as any} size={22} color={b.color} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: palette.slate600, marginLeft: 14 }}>{b.label}</Text>
              <Text style={{ fontSize: 19, fontWeight: '900', color: palette.ink }}>{formatCurrency(b.value)}</Text>
            </FadeInUp>
          ))}

          <Text style={{ fontSize: 17, fontWeight: '800', color: palette.ink, marginTop: 12, marginBottom: 12 }}>Recent Deliveries</Text>
          {recentDeliveries.length === 0 ? (
            <View style={{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 30, alignItems: 'center' }}>
              <Text style={{ fontSize: 38 }}>🚚</Text>
              <Text style={{ color: palette.slate400, marginTop: 8 }}>No deliveries yet</Text>
            </View>
          ) : (
            recentDeliveries.map((order) => (
              <View key={order.id} style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, borderRadius: radii.lg, padding: 14, marginBottom: 10 }, shadows.sm]}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.green50, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark-circle" size={22} color={palette.green600} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.ink }}>#{order.orderNumber}</Text>
                  <Text style={{ fontSize: 12, color: palette.slate400, marginTop: 2 }}>{order.customerName} · {getTimeAgo(order.createdAt)}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '900', color: palette.green600 }}>+{formatCurrency(DELIVERY_FEE)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
