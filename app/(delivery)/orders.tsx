import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order } from '../../src/types';
import { DELIVERY_FEE, DEFAULT_COORDINATES } from '../../src/constants';
import { calculateDistance, formatCurrency, getEstimatedDeliveryMinutes } from '../../src/utils/helpers';
import { StatusPill, Button, PressableScale, useToast, FadeInUp, Divider } from '../../src/components/ui';
import { palette, radii, shadows, gradients } from '../../src/theme';

export default function DeliveryOrdersScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [declinedOrderIds, setDeclinedOrderIds] = useState<Set<string>>(new Set());

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    if (!user) return;
    try { setLoading(true); setOrders(await SupabaseService.getDeliveryPartnerOrders(user.id)); }
    catch { setOrders([]); }
    finally { setLoading(false); }
  };
  const handleRefresh = async () => { setRefreshing(true); await loadOrders(); setRefreshing(false); };

  const handleAcceptOrder = (orderId: string) => {
    Alert.alert('Accept Order', 'Accept this delivery?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: async () => {
        try {
          await SupabaseService.updateOrderStatus(orderId, 'assigned');
          await SupabaseService.updateOrder(orderId, { deliveryPartnerId: user?.id } as any);
          loadOrders(); toast.show('Order accepted 🚚', 'success');
        } catch { toast.show('Failed to accept order', 'error'); }
      } },
    ]);
  };
  const handleDeclineOrder = (orderId: string) => { setDeclinedOrderIds((p) => new Set(p).add(orderId)); toast.show('Order declined', 'info'); };

  const getDistanceLabel = (order: Order): string | null => {
    const { latitude, longitude } = order.deliveryAddress;
    if (!latitude || !longitude) return null;
    const km = calculateDistance(DEFAULT_COORDINATES.latitude, DEFAULT_COORDINATES.longitude, latitude, longitude);
    return `${km.toFixed(1)} km · ~${getEstimatedDeliveryMinutes(km)} mins`;
  };

  const handleUpdateStatus = (orderId: string, currentStatus: string) => {
    const statusMap: Record<string, { next: string; label: string }> = {
      assigned: { next: 'picked_up', label: 'Mark as Picked Up' },
      picked_up: { next: 'out_for_delivery', label: 'Start Delivery' },
      out_for_delivery: { next: 'delivered', label: 'Mark as Delivered' },
    };
    const cfg = statusMap[currentStatus];
    if (!cfg) return;
    Alert.alert('Update Status', cfg.label + '?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: async () => {
        try { await SupabaseService.updateOrderStatus(orderId, cfg.next as any); loadOrders(); toast.show('Status updated ✓', 'success'); }
        catch { toast.show('Failed to update', 'error'); }
      } },
    ]);
  };

  const myOrders = orders.filter((o) => o.deliveryPartnerId === user?.id);
  const availableOrders = isAvailable ? orders.filter((o) => !o.deliveryPartnerId && o.orderStatus === 'packed' && !declinedOrderIds.has(o.id)) : [];
  const actionLabel = (s: string) => (s === 'assigned' ? 'Pick Up' : s === 'picked_up' ? 'Start Delivery' : 'Delivered');

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <LinearGradient colors={gradients.brand as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 22, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' }}>Delivery Partner 👋</Text>
            <Text style={{ color: palette.white, fontSize: 23, fontWeight: '900' }}>{user?.name || 'Partner'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingLeft: 12, paddingRight: 4, paddingVertical: 4, borderRadius: radii.pill }}>
            <Text style={{ color: palette.white, fontWeight: '700', fontSize: 12.5, marginRight: 6 }}>{isAvailable ? 'Online' : 'Offline'}</Text>
            <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ false: 'rgba(255,255,255,0.3)', true: palette.green700 }} thumbColor={palette.white} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radii.md, padding: 12, marginRight: 6 }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11.5 }}>Active Deliveries</Text>
            <Text style={{ color: palette.white, fontSize: 22, fontWeight: '900', marginTop: 2 }}>{myOrders.length}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radii.md, padding: 12, marginLeft: 6 }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11.5 }}>Active Earnings</Text>
            <Text style={{ color: palette.white, fontSize: 22, fontWeight: '900', marginTop: 2 }}>{formatCurrency(myOrders.length * DELIVERY_FEE)}</Text>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={palette.green600} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.green600} />} contentContainerStyle={{ padding: 18, paddingBottom: 24 }}>
          {availableOrders.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: palette.ink, marginBottom: 12 }}>🔔 Available Orders ({availableOrders.length})</Text>
              {availableOrders.map((order) => (
                <FadeInUp key={order.id} style={{ backgroundColor: '#eff6ff', borderRadius: radii.lg, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#bfdbfe' } as any}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: palette.ink }}>#{order.orderNumber}</Text>
                      <Text style={{ fontSize: 13, color: palette.slate500, marginTop: 4 }}>📍 {order.deliveryAddress.street}, {order.deliveryAddress.city}</Text>
                      {getDistanceLabel(order) ? <Text style={{ fontSize: 12, color: palette.sky, marginTop: 3, fontWeight: '600' }}>🛵 {getDistanceLabel(order)}</Text> : null}
                    </View>
                    <View style={{ backgroundColor: palette.sky, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill }}>
                      <Text style={{ color: palette.white, fontSize: 11, fontWeight: '800' }}>NEW</Text>
                    </View>
                  </View>
                  <Divider style={{ marginVertical: 12 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: palette.green700 }}>Earn {formatCurrency(DELIVERY_FEE)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <PressableScale onPress={() => handleDeclineOrder(order.id)} style={{ marginRight: 8 }}>
                        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: palette.slate100 }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: palette.slate600 }}>Decline</Text>
                        </View>
                      </PressableScale>
                      <PressableScale onPress={() => handleAcceptOrder(order.id)}>
                        <View style={[{ paddingHorizontal: 22, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: palette.green600 }, shadows.sm]}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: palette.white }}>Accept</Text>
                        </View>
                      </PressableScale>
                    </View>
                  </View>
                </FadeInUp>
              ))}
            </View>
          )}

          <Text style={{ fontSize: 17, fontWeight: '800', color: palette.ink, marginBottom: 12, marginTop: availableOrders.length > 0 ? 8 : 0 }}>My Deliveries ({myOrders.length})</Text>
          {myOrders.length === 0 ? (
            <View style={{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 30, alignItems: 'center' }}>
              <Text style={{ fontSize: 40 }}>🚚</Text>
              <Text style={{ color: palette.slate600, marginTop: 10, fontSize: 15, fontWeight: '700' }}>No active deliveries</Text>
              <Text style={{ color: palette.slate400, marginTop: 4, fontSize: 13 }}>Go online to receive orders</Text>
            </View>
          ) : (
            myOrders.map((order) => (
              <FadeInUp key={order.id} style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 16, marginBottom: 12 }, shadows.sm] as any}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: palette.ink }}>#{order.orderNumber}</Text>
                    <Text style={{ fontSize: 13, color: palette.slate500, marginTop: 4 }}>👤 {order.customerName}</Text>
                    <Text style={{ fontSize: 13, color: palette.slate500, marginTop: 2 }}>📍 {order.deliveryAddress.street}</Text>
                  </View>
                  <StatusPill status={order.orderStatus as any} size="sm" />
                </View>
                <Divider style={{ marginVertical: 12 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.green700 }}>{formatCurrency(DELIVERY_FEE)} fee</Text>
                  {['assigned', 'picked_up', 'out_for_delivery'].includes(order.orderStatus) ? (
                    <View style={{ minWidth: 140 }}>
                      <Button label={actionLabel(order.orderStatus)} size="sm" icon="navigate" onPress={() => handleUpdateStatus(order.id, order.orderStatus)} />
                    </View>
                  ) : null}
                </View>
              </FadeInUp>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
