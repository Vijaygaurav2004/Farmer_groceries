import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SupabaseService } from '../../../src/services/supabase';
import { Order } from '../../../src/types';
import { canCancelOrder, getEstimatedDeliveryTime } from '../../../src/utils/helpers';
import { Button, IconButton, EmptyState, useToast, Divider } from '../../../src/components/ui';
import { palette, radii, shadows } from '../../../src/theme';

const steps = [
  { key: 'placed', label: 'Order Placed', icon: 'receipt-outline' as const },
  { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-done-outline' as const },
  { key: 'packed', label: 'Packed', icon: 'cube-outline' as const },
  { key: 'assigned', label: 'Assigned to Delivery', icon: 'bicycle-outline' as const },
  { key: 'picked_up', label: 'Picked Up', icon: 'walk-outline' as const },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'car-outline' as const },
  { key: 'delivered', label: 'Delivered', icon: 'home-outline' as const },
];

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { loadOrder(); }, [id]);

  const loadOrder = async () => {
    try { setLoading(true); setOrder(await SupabaseService.getOrder(id)); }
    catch { toast.show('Failed to load order', 'error'); }
    finally { setLoading(false); }
  };
  const handleRefresh = async () => { setRefreshing(true); await loadOrder(); setRefreshing(false); };

  const handleCancelOrder = () => {
    if (!order) return;
    Alert.alert('Cancel Order', 'Are you sure? This cannot be undone.', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try { setCancelling(true); await SupabaseService.updateOrderStatus(order.id, 'cancelled', 'Cancelled by customer'); await loadOrder(); toast.show('Order cancelled', 'info'); }
        catch { toast.show('Failed to cancel order', 'error'); }
        finally { setCancelling(false); }
      } },
    ]);
  };

  const fmt = (date: Date) => new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) return <View style={{ flex: 1, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={palette.green600} /></View>;
  if (!order) return <View style={{ flex: 1, backgroundColor: palette.white }}><EmptyState icon="📦" title="Order not found"><Button label="Go Back" icon="arrow-back" onPress={() => router.back()} /></EmptyState></View>;

  const currentStepIndex = steps.findIndex((s) => s.key === order.orderStatus);
  const isDelivered = order.orderStatus === 'delivered';
  const isCancelled = order.orderStatus === 'cancelled';
  const heroColor = isDelivered ? palette.green600 : isCancelled ? palette.coral : palette.amber500;
  const heroBg = isDelivered ? palette.green50 : isCancelled ? '#fef2f2' : '#fffbeb';

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: 18, paddingBottom: 12 }}>
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <View style={{ marginLeft: 14 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: palette.ink }}>Track Order</Text>
          <Text style={{ fontSize: 12.5, color: palette.slate400 }}>#{order.orderNumber}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.green600} />} contentContainerStyle={{ padding: 18, paddingBottom: 20 }}>
        {/* Status hero */}
        <View style={{ backgroundColor: heroBg, borderRadius: radii.lg, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Ionicons name={isDelivered ? 'checkmark-circle' : isCancelled ? 'close-circle' : (steps[currentStepIndex]?.icon || 'time-outline')} size={36} color={heroColor} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: palette.ink }}>
            {isDelivered ? 'Delivered' : isCancelled ? 'Cancelled' : steps[currentStepIndex]?.label}
          </Text>
          <Text style={{ fontSize: 13, color: palette.slate500, marginTop: 3 }}>{fmt(order.updatedAt)}</Text>
          {!isDelivered && !isCancelled ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: palette.white, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill }}>
              <Ionicons name="time-outline" size={14} color={palette.amber600} />
              <Text style={{ fontSize: 12.5, color: palette.slate600, marginLeft: 5, fontWeight: '600' }}>Est. by {fmt(getEstimatedDeliveryTime(order.createdAt))}</Text>
            </View>
          ) : null}
        </View>

        {/* Timeline */}
        {!isCancelled && (
          <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 20, marginTop: 16 }, shadows.sm]}>
            {steps.map((step, index) => {
              const done = index <= currentStepIndex;
              const current = index === currentStepIndex;
              const last = index === steps.length - 1;
              return (
                <View key={step.key} style={{ flexDirection: 'row' }}>
                  <View style={{ alignItems: 'center', marginRight: 14 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: done ? palette.green600 : palette.slate100, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={done ? 'checkmark' : step.icon} size={19} color={done ? palette.white : palette.slate400} />
                    </View>
                    {!last ? <View style={{ width: 2.5, flex: 1, minHeight: 26, backgroundColor: index < currentStepIndex ? palette.green500 : palette.slate100, marginVertical: 2 }} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: last ? 0 : 14, paddingTop: 6 }}>
                    <Text style={{ fontSize: 15, fontWeight: done ? '800' : '600', color: done ? palette.ink : palette.slate400 }}>{step.label}</Text>
                    {current ? <Text style={{ fontSize: 12.5, color: palette.green600, marginTop: 2, fontWeight: '700' }}>In progress…</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Items */}
        <Text style={{ fontSize: 16, fontWeight: '800', color: palette.ink, marginTop: 20, marginBottom: 10 }}>Order Details</Text>
        <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 16 }, shadows.sm]}>
          {order.items.map((item, index) => (
            <View key={index}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: palette.ink }}>{item.productName}</Text>
                  <Text style={{ fontSize: 12.5, color: palette.slate400, marginTop: 2 }}>{item.quantity} {item.unit} × ₹{item.pricePerUnit}</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: palette.ink }}>₹{item.total}</Text>
              </View>
              {index < order.items.length - 1 ? <Divider style={{ marginVertical: 12 }} /> : null}
            </View>
          ))}
        </View>

        {/* Address */}
        <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 16, marginTop: 12, flexDirection: 'row' }, shadows.sm]}>
          <Ionicons name="location" size={20} color={palette.green600} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.ink, marginBottom: 3 }}>Delivery Address</Text>
            <Text style={{ fontSize: 13.5, color: palette.slate500, lineHeight: 20 }}>{order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</Text>
          </View>
        </View>

        {/* Payment summary */}
        <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 16, marginTop: 12 }, shadows.sm]}>
          <SumRow label="Subtotal" value={`₹${order.subtotal}`} />
          <SumRow label="Delivery Fee" value={`₹${order.deliveryFee}`} />
          <Divider style={{ marginVertical: 10 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: palette.ink }}>Total</Text>
            <Text style={{ fontSize: 17, fontWeight: '900', color: palette.green700 }}>₹{order.total}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={{ fontSize: 13, color: palette.slate400 }}>Payment</Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: palette.slate600, textTransform: 'uppercase' }}>{order.paymentMethod}</Text>
          </View>
        </View>

        {!isDelivered && !isCancelled && canCancelOrder(order.orderStatus) ? (
          <View style={{ marginTop: 18 }}>
            <Button label="Cancel Order" variant="danger" icon="close-circle-outline" loading={cancelling} onPress={handleCancelOrder} />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ fontSize: 14, color: palette.slate500 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: palette.ink }}>{value}</Text>
    </View>
  );
}
