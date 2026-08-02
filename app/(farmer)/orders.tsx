import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order, OrderStatus } from '../../src/types';
import { ORDER_STATUS } from '../../src/constants';
import { formatCurrency } from '../../src/utils/helpers';
import { Chip, StatusPill, Button, EmptyState, useToast, FadeInUp, Divider } from '../../src/components/ui';
import { palette, radii, shadows } from '../../src/theme';

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: 'confirmed', confirmed: 'packed',
};

export default function FarmerOrdersScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    if (!user) return;
    try { setLoading(true); setOrders(await SupabaseService.getFarmerOrders(user.id)); }
    catch { setOrders([]); }
    finally { setLoading(false); }
  };
  const handleRefresh = async () => { setRefreshing(true); await loadOrders(); setRefreshing(false); };

  const handleUpdateStatus = (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;
    Alert.alert('Update Order', `Mark this order as ${ORDER_STATUS[nextStatus]?.label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: async () => {
        try { await SupabaseService.updateOrderStatus(orderId, nextStatus); loadOrders(); toast.show('Order updated ✓', 'success'); }
        catch { toast.show('Failed to update order', 'error'); }
      } },
    ]);
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') return ['placed', 'confirmed', 'packed'].includes(o.orderStatus);
    if (filter === 'completed') return ['delivered', 'cancelled'].includes(o.orderStatus);
    return true;
  });

  const fmt = (date: Date) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <View style={{ paddingTop: 56, paddingBottom: 12 }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: palette.ink, paddingHorizontal: 20, marginBottom: 14 }}>Orders</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18 }}>
          {(['active', 'all', 'completed'] as const).map((f) => (
            <Chip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={palette.green600} /></View>
      ) : filteredOrders.length === 0 ? (
        <EmptyState icon="📦" title={`No ${filter !== 'all' ? filter : ''} orders`} subtitle="New orders will appear here" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.green600} />} contentContainerStyle={{ padding: 18, paddingBottom: 24 }}>
          {filteredOrders.map((order) => {
            const nextStatus = nextStatusMap[order.orderStatus];
            return (
              <FadeInUp key={order.id} style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 16, marginBottom: 14 }, shadows.sm] as any}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: palette.ink }}>#{order.orderNumber}</Text>
                    <Text style={{ fontSize: 13, color: palette.slate500, marginTop: 3 }}>👤 {order.customerName}</Text>
                    <Text style={{ fontSize: 12, color: palette.slate400, marginTop: 2 }}>{fmt(order.createdAt)}</Text>
                  </View>
                  <StatusPill status={order.orderStatus as any} size="sm" />
                </View>

                <View style={{ backgroundColor: palette.slate50, borderRadius: radii.md, padding: 12, marginTop: 12 }}>
                  {order.items.map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: idx < order.items.length - 1 ? 6 : 0 }}>
                      <Text style={{ fontSize: 13, color: palette.slate600, flex: 1 }}>{item.productName} × {item.quantity}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: palette.ink }}>{formatCurrency(item.total)}</Text>
                    </View>
                  ))}
                </View>

                <Divider style={{ marginVertical: 12 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 11.5, color: palette.slate400 }}>Total</Text>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: palette.green700 }}>{formatCurrency(order.total)}</Text>
                  </View>
                  {nextStatus ? (
                    <View style={{ minWidth: 150 }}>
                      <Button label={`Mark ${ORDER_STATUS[nextStatus]?.label}`} size="sm" icon="arrow-forward-circle" onPress={() => handleUpdateStatus(order.id, order.orderStatus)} />
                    </View>
                  ) : null}
                </View>
              </FadeInUp>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
