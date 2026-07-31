import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order, OrderStatus } from '../../src/types';
import { formatCurrency } from '../../src/utils/helpers';

const statusFlow: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  picked_up: { next: 'out_for_delivery', label: 'Start Delivery' },
  out_for_delivery: { next: 'delivered', label: 'Mark as Delivered' },
};

export default function DeliveryMapScreen() {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadActiveOrder = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const orders = await SupabaseService.getDeliveryPartnerOrders(user.id);
      // Find the first active order (picked_up or out_for_delivery)
      const active = orders.find(o =>
        o.deliveryPartnerId === user.id &&
        ['picked_up', 'out_for_delivery'].includes(o.orderStatus)
      );
      setActiveOrder(active || null);
    } catch (error) {
      console.error('Error loading active order:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadActiveOrder();
    }, [loadActiveOrder])
  );

  const handleAdvanceStatus = async () => {
    if (!activeOrder) return;

    const step = statusFlow[activeOrder.orderStatus];
    if (!step) return;

    Alert.alert(
      'Update Status',
      step.label,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setUpdating(true);
              await SupabaseService.updateOrderStatus(activeOrder.id, step.next);
              await loadActiveOrder();
              Alert.alert('Success', 'Order status updated');
            } catch (error) {
              console.error('Error updating status:', error);
              Alert.alert('Error', 'Failed to update status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const step = activeOrder ? statusFlow[activeOrder.orderStatus] : undefined;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-primary-600">
        <Text className="text-white text-2xl font-bold">Delivery Route</Text>
        <Text className="text-primary-100 text-sm mt-1">
          Track your current delivery from pickup to drop
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : !activeOrder ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">🗺️</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            No active delivery
          </Text>
          <Text className="text-gray-600 text-center">
            Accept an order from the Orders tab to see your route here
          </Text>
        </View>
      ) : (
        <View className="flex-1 px-6 py-4">
          {/* Order Card */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            className="bg-white border border-gray-200 rounded-xl p-4 mb-4"
          >
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900 mb-1">
                  {activeOrder.orderNumber}
                </Text>
                <Text className="text-sm text-gray-600">
                  {activeOrder.customerName}
                </Text>
              </View>
              <View className="bg-primary-100 px-3 py-1 rounded-full">
                <Text className="text-primary-600 text-xs font-semibold uppercase">
                  {activeOrder.orderStatus === 'picked_up' ? 'Picked Up' : 'On Delivery'}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
              <Text className="text-sm text-gray-600">
                {activeOrder.items.length} item{activeOrder.items.length === 1 ? '' : 's'}
              </Text>
              <Text className="text-base font-bold text-primary-600">
                {formatCurrency(activeOrder.total)}
              </Text>
            </View>
          </MotiView>

          {/* Pickup Section */}
          <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 300, delay: 100 }}
            className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4"
          >
            <Text className="text-xs font-semibold text-blue-600 uppercase mb-1">
              📍 Pickup
            </Text>
            <Text className="text-base font-semibold text-gray-900">
              {activeOrder.farmerName}
            </Text>
            <Text className="text-sm text-gray-600">Pickup from farm</Text>
          </MotiView>

          {/* Drop Section */}
          <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 300, delay: 200 }}
            className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6"
          >
            <Text className="text-xs font-semibold text-green-600 uppercase mb-1">
              🏠 Drop
            </Text>
            <Text className="text-base font-semibold text-gray-900">
              {activeOrder.deliveryAddress.street}
            </Text>
            <Text className="text-sm text-gray-600">
              {activeOrder.deliveryAddress.city}, {activeOrder.deliveryAddress.pincode}
            </Text>
          </MotiView>

          {/* Action */}
          {step && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300, delay: 300 }}
            >
              <TouchableOpacity
                onPress={handleAdvanceStatus}
                disabled={updating}
                className={`bg-primary-600 py-4 rounded-xl items-center ${
                  updating ? 'opacity-50' : ''
                }`}
              >
                {updating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    {step.label}
                  </Text>
                )}
              </TouchableOpacity>
            </MotiView>
          )}
        </View>
      )}
    </View>
  );
}
