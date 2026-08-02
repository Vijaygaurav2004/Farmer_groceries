import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order } from '../../src/types';
import { formatCurrency, formatDate, getTimeAgo } from '../../src/utils/helpers';
import { Chip, StatusPill, PressableScale, EmptyState, Button, FadeInUp, Divider } from '../../src/components/ui';
import { palette, radii, shadows } from '../../src/theme';

type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled';
const ORDER_FILTERS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'delivered', label: 'Delivered' }, { id: 'cancelled', label: 'Cancelled' },
];
const ACTIVE_STATUSES = ['placed', 'confirmed', 'packed', 'assigned', 'picked_up', 'out_for_delivery'];

export default function OrdersScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderFilter>('all');

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    if (!user) { setLoading(false); return; }
    try { setLoading(true); setOrders(await SupabaseService.getCustomerOrders(user.id)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleRefresh = async () => { setRefreshing(true); await loadOrders(); setRefreshing(false); };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ACTIVE_STATUSES.includes(o.orderStatus);
    return o.orderStatus === statusFilter;
  });

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <View style={{ paddingTop: 56, paddingBottom: 12 }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: palette.ink, paddingHorizontal: 20, marginBottom: 14 }}>My Orders</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18 }}>
          {ORDER_FILTERS.map((f) => (
            <Chip key={f.id} label={f.label} active={statusFilter === f.id} onPress={() => setStatusFilter(f.id)} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={palette.green600} /></View>
      ) : filteredOrders.length === 0 ? (
        <EmptyState icon="📦" title={orders.length === 0 ? 'No orders yet' : 'No matching orders'} subtitle={orders.length === 0 ? 'Start shopping for fresh produce' : 'Try a different filter'}>
          {orders.length === 0 ? <Button label="Browse Produce" icon="storefront-outline" onPress={() => router.push('/(customer)/home')} /> : null}
        </EmptyState>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.green600} />} contentContainerStyle={{ padding: 18, paddingBottom: 24 }}>
          {filteredOrders.map((order) => (
            <FadeInUp key={order.id} style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 16, marginBottom: 14 }, shadows.sm] as any}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15.5, fontWeight: '900', color: palette.ink }}>#{order.orderNumber}</Text>
                  <Text style={{ fontSize: 12.5, color: palette.slate400, marginTop: 3 }}>{formatDate(order.createdAt)} · {getTimeAgo(order.createdAt)}</Text>
                </View>
                <StatusPill status={order.orderStatus as any} size="sm" />
              </View>

              <View style={{ marginTop: 12 }}>
                {order.items.slice(0, 2).map((item, idx) => (
                  <Text key={idx} style={{ fontSize: 13.5, color: palette.slate600, marginBottom: 2 }}>• {item.productName} × {item.quantity}</Text>
                ))}
                {order.items.length > 2 ? <Text style={{ fontSize: 13, color: palette.slate400 }}>+{order.items.length - 2} more items</Text> : null}
              </View>

              <Divider style={{ marginVertical: 12 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ fontSize: 11.5, color: palette.slate400 }}>Total</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: palette.green700 }}>{formatCurrency(order.total)}</Text>
                </View>
                <PressableScale onPress={() => router.push(`/(customer)/track-order/${order.id}`)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.green50, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.pill }}>
                    <Ionicons name="location-outline" size={16} color={palette.green700} />
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.green700, marginLeft: 5 }}>Track Order</Text>
                  </View>
                </PressableScale>
              </View>
            </FadeInUp>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
