import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order, OrderStatus } from '../../src/types';
import { formatCurrency } from '../../src/utils/helpers';
import { Alert } from 'react-native';
import { Button, EmptyState, StatusPill, useToast } from '../../src/components/ui';
import { palette, radii, shadows, gradients } from '../../src/theme';

const statusFlow: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  picked_up: { next: 'out_for_delivery', label: 'Start Delivery' },
  out_for_delivery: { next: 'delivered', label: 'Mark as Delivered' },
};

export default function DeliveryMapScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadActiveOrder = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const orders = await SupabaseService.getDeliveryPartnerOrders(user.id);
      setActiveOrder(orders.find((o) => o.deliveryPartnerId === user.id && ['picked_up', 'out_for_delivery'].includes(o.orderStatus)) || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { loadActiveOrder(); }, [loadActiveOrder]));

  const handleAdvanceStatus = () => {
    if (!activeOrder) return;
    const step = statusFlow[activeOrder.orderStatus];
    if (!step) return;
    Alert.alert('Update Status', step.label + '?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update', onPress: async () => {
        try { setUpdating(true); await SupabaseService.updateOrderStatus(activeOrder.id, step.next); await loadActiveOrder(); toast.show('Status updated ✓', 'success'); }
        catch { toast.show('Failed to update', 'error'); }
        finally { setUpdating(false); }
      } },
    ]);
  };

  const step = activeOrder ? statusFlow[activeOrder.orderStatus] : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <LinearGradient colors={gradients.brand as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }}>
        <Text style={{ color: palette.white, fontSize: 23, fontWeight: '900' }}>Delivery Route 🗺️</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>Track your current delivery pickup to drop</Text>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={palette.green600} /></View>
      ) : !activeOrder ? (
        <EmptyState icon="🗺️" title="No active delivery" subtitle="Accept an order from the Orders tab to see your route here" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {/* Faux map with route */}
          <View style={[{ borderRadius: radii.lg, overflow: 'hidden', marginBottom: 16 }, shadows.sm]}>
            <LinearGradient colors={['#dcfce7', '#e0f2fe'] as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 150, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.sky, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="leaf" size={20} color={palette.white} /></View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: palette.slate600, marginTop: 5 }}>Farm</Text>
                </View>
                <View style={{ width: 70, height: 3, backgroundColor: palette.green500, marginHorizontal: 6, borderRadius: 2 }} />
                <Ionicons name="bicycle" size={26} color={palette.green700} />
                <View style={{ width: 70, height: 3, backgroundColor: palette.slate300, marginHorizontal: 6, borderRadius: 2 }} />
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.green600, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="home" size={20} color={palette.white} /></View>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: palette.slate600, marginTop: 5 }}>Home</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Order card */}
          <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 16, marginBottom: 14 }, shadows.sm]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: palette.ink }}>#{activeOrder.orderNumber}</Text>
                <Text style={{ fontSize: 13, color: palette.slate500, marginTop: 3 }}>👤 {activeOrder.customerName}</Text>
              </View>
              <StatusPill status={activeOrder.orderStatus as any} size="sm" />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.slate100 }}>
              <Text style={{ fontSize: 13, color: palette.slate500 }}>{activeOrder.items.length} item{activeOrder.items.length === 1 ? '' : 's'}</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: palette.green700 }}>{formatCurrency(activeOrder.total)}</Text>
            </View>
          </View>

          {/* Pickup */}
          <View style={{ flexDirection: 'row', backgroundColor: '#eff6ff', borderRadius: radii.lg, padding: 16, marginBottom: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.sky, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="storefront" size={20} color={palette.white} /></View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: palette.sky, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pickup</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: palette.ink, marginTop: 2 }}>{activeOrder.farmerName}</Text>
              <Text style={{ fontSize: 12.5, color: palette.slate500 }}>Collect from farm</Text>
            </View>
          </View>

          {/* Drop */}
          <View style={{ flexDirection: 'row', backgroundColor: palette.green50, borderRadius: radii.lg, padding: 16, marginBottom: 18 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.green600, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="home" size={20} color={palette.white} /></View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: palette.green700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Drop</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: palette.ink, marginTop: 2 }}>{activeOrder.deliveryAddress.street}</Text>
              <Text style={{ fontSize: 12.5, color: palette.slate500 }}>{activeOrder.deliveryAddress.city}, {activeOrder.deliveryAddress.pincode}</Text>
            </View>
          </View>

          {step ? <Button label={step.label} icon="navigate" loading={updating} onPress={handleAdvanceStatus} size="lg" /> : null}
        </ScrollView>
      )}
    </View>
  );
}
