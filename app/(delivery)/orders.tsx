import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { MotiView } from 'moti';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order } from '../../src/types';
import { DELIVERY_FEE, DEFAULT_COORDINATES } from '../../src/constants';
import { calculateDistance } from '../../src/utils/helpers';

// No more hardcoded demo data - all orders from database

export default function DeliveryOrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [declinedOrderIds, setDeclinedOrderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const ordersData = await SupabaseService.getDeliveryPartnerOrders(user.id);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]); // Set empty array if error
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (orderId: string) => {
    Alert.alert(
      'Accept Order',
      'Do you want to accept this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await SupabaseService.updateOrderStatus(orderId, 'assigned');
              // Update order with delivery partner ID
              await SupabaseService.updateOrder(orderId, { 
                deliveryPartnerId: user?.id 
              } as any);
              loadOrders();
              Alert.alert('Success', 'Order accepted successfully');
            } catch (error) {
              console.error('Error accepting order:', error);
              Alert.alert('Error', 'Failed to accept order');
            }
          },
        },
      ]
    );
  };

  const handleDeclineOrder = (orderId: string) => {
    setDeclinedOrderIds(prev => new Set(prev).add(orderId));
  };

  const getDistanceLabel = (order: Order): string | null => {
    const { latitude, longitude } = order.deliveryAddress;
    if (!latitude || !longitude) return null;

    const distanceKm = calculateDistance(
      DEFAULT_COORDINATES.latitude,
      DEFAULT_COORDINATES.longitude,
      latitude,
      longitude
    );
    return `${distanceKm.toFixed(1)} km away`;
  };

  const handleUpdateStatus = async (orderId: string, currentStatus: string) => {
    const statusMap: Record<string, { next: string; label: string }> = {
      assigned: { next: 'picked_up', label: 'Mark as Picked Up' },
      picked_up: { next: 'out_for_delivery', label: 'Start Delivery' },
      out_for_delivery: { next: 'delivered', label: 'Mark as Delivered' },
    };

    const statusConfig = statusMap[currentStatus];
    if (!statusConfig) return;

    Alert.alert(
      'Update Status',
      statusConfig.label,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await SupabaseService.updateOrderStatus(orderId, statusConfig.next as any);
              loadOrders();
              Alert.alert('Success', 'Order status updated');
            } catch (error) {
              console.error('Error updating status:', error);
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const myOrders = orders.filter(o => o.deliveryPartnerId === user?.id);
  const availableOrders = orders.filter(
    o => !o.deliveryPartnerId && o.orderStatus === 'packed' && !declinedOrderIds.has(o.id)
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-primary-600">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white text-base">Hi Delivery Partner 👋</Text>
            <Text className="text-white text-2xl font-bold">
              {user?.name || 'Partner'}
            </Text>
          </View>
          <View className="flex-row items-center bg-white/20 px-3 py-2 rounded-full">
            <Text className="text-white mr-2">Available</Text>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#767577', true: '#22c55e' }}
            />
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between">
          <View className="bg-white/20 rounded-lg px-4 py-2 flex-1 mr-2">
            <Text className="text-white text-xs">Today's Deliveries</Text>
            <Text className="text-white text-2xl font-bold">{myOrders.length}</Text>
          </View>
          <View className="bg-white/20 rounded-lg px-4 py-2 flex-1 ml-2">
            <Text className="text-white text-xs">Today's Earnings</Text>
            <Text className="text-white text-2xl font-bold">₹0</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Available Orders */}
          {availableOrders.length > 0 && (
            <View className="px-6 py-4">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Available Orders ({availableOrders.length})
              </Text>
              
              {availableOrders.map((order, index) => (
                <MotiView
                  key={order.id}
                  from={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                  className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-3"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900 mb-1">
                        {order.orderNumber}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        📍 {order.deliveryAddress.street}, {order.deliveryAddress.city}
                      </Text>
                      {getDistanceLabel(order) && (
                        <Text className="text-xs text-gray-500 mt-1">
                          {getDistanceLabel(order)}
                        </Text>
                      )}
                    </View>
                    <View className="bg-blue-600 px-3 py-1 rounded-full">
                      <Text className="text-white text-xs font-semibold">NEW</Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-lg font-bold text-primary-600">
                      Earn ₹{DELIVERY_FEE}
                    </Text>
                    <View className="flex-row">
                      <TouchableOpacity
                        onPress={() => handleDeclineOrder(order.id)}
                        className="bg-gray-100 px-4 py-2 rounded-lg mr-2"
                      >
                        <Text className="text-gray-700 font-semibold">Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleAcceptOrder(order.id)}
                        className="bg-primary-600 px-6 py-2 rounded-lg"
                      >
                        <Text className="text-white font-semibold">Accept</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </MotiView>
              ))}
            </View>
          )}

          {/* My Orders */}
          <View className="px-6 py-4">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              My Deliveries ({myOrders.length})
            </Text>

            {myOrders.length === 0 ? (
              <View className="bg-gray-50 rounded-xl p-8 items-center">
                <Text className="text-4xl mb-2">🚚</Text>
                <Text className="text-gray-600">No active deliveries</Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Turn on availability to receive orders
                </Text>
              </View>
            ) : (
              myOrders.map((order, index) => (
                <MotiView
                  key={order.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                  className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900 mb-1">
                        {order.orderNumber}
                      </Text>
                      <Text className="text-sm text-gray-600 mb-1">
                        Customer: {order.customerName}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        📍 {order.deliveryAddress.street}
                      </Text>
                    </View>
                    <View className="bg-primary-100 px-3 py-1 rounded-full">
                      <Text className="text-primary-600 text-xs font-semibold">
                        {order.orderStatus}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center pt-3 border-t border-gray-200">
                    <Text className="text-base font-bold text-primary-600">
                      ₹{DELIVERY_FEE} delivery fee
                    </Text>
                    
                    {['assigned', 'picked_up', 'out_for_delivery'].includes(order.orderStatus) && (
                      <TouchableOpacity
                        onPress={() => handleUpdateStatus(order.id, order.orderStatus)}
                        className="bg-primary-600 px-4 py-2 rounded-lg"
                      >
                        <Text className="text-white font-semibold">
                          {order.orderStatus === 'assigned' && 'Pick Up'}
                          {order.orderStatus === 'picked_up' && 'Start Delivery'}
                          {order.orderStatus === 'out_for_delivery' && 'Delivered'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </MotiView>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

