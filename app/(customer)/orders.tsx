import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order } from '../../src/types';

const orderStatusConfig = {
  placed: { label: 'Order Placed', color: 'bg-blue-500', icon: '📝' },
  confirmed: { label: 'Confirmed', color: 'bg-indigo-500', icon: '✅' },
  packed: { label: 'Packed', color: 'bg-purple-500', icon: '📦' },
  assigned: { label: 'Assigned', color: 'bg-orange-500', icon: '🚚' },
  picked_up: { label: 'Picked Up', color: 'bg-yellow-500', icon: '📍' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-amber-500', icon: '🚛' },
  delivered: { label: 'Delivered', color: 'bg-green-500', icon: '✓' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: '✗' },
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const ordersData = await SupabaseService.getCustomerOrders(user.id);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">My Orders</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-6xl mb-4">📦</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            No orders yet
          </Text>
          <Text className="text-gray-600">Start shopping for fresh produce</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View className="px-6 py-4">
            {orders.map((order, index) => {
              const statusConfig = orderStatusConfig[order.orderStatus];
              
              return (
                <MotiView
                  key={order.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                  className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
                >
                  {/* Order Header */}
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900 mb-1">
                        {order.orderNumber}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </Text>
                    </View>
                    <View
                      className={`${statusConfig.color} px-3 py-1 rounded-full flex-row items-center`}
                    >
                      <Text className="mr-1">{statusConfig.icon}</Text>
                      <Text className="text-white text-xs font-semibold">
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  {/* Items */}
                  <View className="mb-3">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <Text key={idx} className="text-sm text-gray-700">
                        • {item.productName} x {item.quantity}
                      </Text>
                    ))}
                    {order.items.length > 2 && (
                      <Text className="text-sm text-gray-500">
                        +{order.items.length - 2} more items
                      </Text>
                    )}
                  </View>

                  {/* Footer */}
                  <View className="flex-row justify-between items-center pt-3 border-t border-gray-200">
                    <View>
                      <Text className="text-sm text-gray-600">Total Amount</Text>
                      <Text className="text-lg font-bold text-primary-600">
                        ₹{order.total}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => router.push(`/(customer)/track-order/${order.id}`)}
                      className="bg-primary-100 px-4 py-2 rounded-lg"
                    >
                      <Text className="text-primary-600 font-semibold">
                        Track Order
                      </Text>
                    </TouchableOpacity>
                  </View>
                </MotiView>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

