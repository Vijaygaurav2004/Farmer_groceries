import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MotiView } from 'moti';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order, OrderStatus } from '../../src/types';
import { formatCurrency } from '../../src/utils/helpers';

interface OrderStatusConfigEntry {
  label: string;
  color: string;
  icon: string;
  nextStatus: OrderStatus | null;
}

const orderStatusConfig: Partial<Record<OrderStatus, OrderStatusConfigEntry>> = {
  placed: { label: 'New Order', color: 'bg-blue-500', icon: '📝', nextStatus: 'confirmed' },
  confirmed: { label: 'Confirmed', color: 'bg-indigo-500', icon: '✅', nextStatus: 'packed' },
  packed: { label: 'Packed', color: 'bg-purple-500', icon: '📦', nextStatus: null },
  assigned: { label: 'Assigned', color: 'bg-orange-500', icon: '🚚', nextStatus: null },
  picked_up: { label: 'Picked Up', color: 'bg-yellow-500', icon: '📍', nextStatus: null },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-amber-500', icon: '🚛', nextStatus: null },
  delivered: { label: 'Delivered', color: 'bg-green-500', icon: '✓', nextStatus: null },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: '✗', nextStatus: null },
};

// No more hardcoded demo data - all orders from database

export default function FarmerOrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const ordersData = await SupabaseService.getFarmerOrders(user.id);
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

  const handleUpdateStatus = async (orderId: string, currentStatus: OrderStatus) => {
    const config = orderStatusConfig[currentStatus];
    const nextStatus = config?.nextStatus;
    if (!nextStatus) return;

    const nextStatusLabel = orderStatusConfig[nextStatus]?.label ?? nextStatus;

    Alert.alert(
      'Update Order Status',
      `Update order to ${nextStatusLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await SupabaseService.updateOrderStatus(orderId, nextStatus);
              loadOrders();
              Alert.alert('Success', 'Order status updated');
            } catch (error) {
              console.error('Error updating order:', error);
              Alert.alert('Error', 'Failed to update order status');
            }
          },
        },
      ]
    );
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'active') {
      return ['placed', 'confirmed', 'packed'].includes(order.orderStatus);
    } else if (filter === 'completed') {
      return ['delivered', 'cancelled'].includes(order.orderStatus);
    }
    return true;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Orders</Text>
        
        {/* Filter Tabs */}
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setFilter('active')}
            className={`mr-3 px-4 py-2 rounded-full ${
              filter === 'active' ? 'bg-primary-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                filter === 'active' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Active
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setFilter('all')}
            className={`mr-3 px-4 py-2 rounded-full ${
              filter === 'all' ? 'bg-primary-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                filter === 'all' ? 'text-white' : 'text-gray-700'
              }`}
            >
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full ${
              filter === 'completed' ? 'bg-primary-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                filter === 'completed' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Completed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-6xl mb-4">📦</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            No {filter !== 'all' ? filter : ''} orders
          </Text>
          <Text className="text-gray-600">Orders will appear here</Text>
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
            {filteredOrders.map((order, index) => {
              const statusConfig = orderStatusConfig[order.orderStatus] ?? {
                label: order.orderStatus,
                color: 'bg-gray-400',
                icon: '❔',
                nextStatus: null,
              };

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
                      <Text className="text-sm text-gray-600 mb-1">
                        Customer: {order.customerName}
                      </Text>
                      <Text className="text-xs text-gray-500">
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
                  <View className="bg-gray-50 rounded-lg p-3 mb-3">
                    {order.items.map((item, idx) => (
                      <View key={idx} className="flex-row justify-between mb-1">
                        <Text className="text-sm text-gray-700 flex-1">
                          {item.productName} x {item.quantity}
                        </Text>
                        <Text className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.total)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Footer */}
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-sm text-gray-600">Total Amount</Text>
                      <Text className="text-lg font-bold text-primary-600">
                        {formatCurrency(order.total)}
                      </Text>
                    </View>

                    {statusConfig.nextStatus && (
                      <TouchableOpacity
                        onPress={() => handleUpdateStatus(order.id, order.orderStatus)}
                        className="bg-primary-600 px-4 py-2 rounded-lg"
                      >
                        <Text className="text-white font-semibold">
                          Mark {orderStatusConfig[statusConfig.nextStatus]?.label ?? statusConfig.nextStatus}
                        </Text>
                      </TouchableOpacity>
                    )}
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

