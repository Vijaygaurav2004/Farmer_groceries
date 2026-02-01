import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { SupabaseService } from '../../../src/services/supabase';
import { Order } from '../../../src/types';
import { canCancelOrder, getEstimatedDeliveryTime } from '../../../src/utils/helpers';

const orderStatusSteps = [
  { key: 'placed', label: 'Order Placed', icon: '📝' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'packed', label: 'Packed', icon: '📦' },
  { key: 'assigned', label: 'Assigned to Delivery', icon: '🚚' },
  { key: 'picked_up', label: 'Picked Up', icon: '📍' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚛' },
  { key: 'delivered', label: 'Delivered', icon: '✓' },
];

export default function TrackOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await SupabaseService.getOrder(id);
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrder();
    setRefreshing(false);
  };

  const handleCancelOrder = () => {
    if (!order) return;

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              await SupabaseService.updateOrderStatus(order.id, 'cancelled', 'Cancelled by customer');
              await loadOrder();
            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert('Error', 'Failed to cancel order. Please try again.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return orderStatusSteps.findIndex(step => step.key === order.orderStatus);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-6xl mb-4">📦</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">Order Not Found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-600 px-6 py-3 rounded-lg mt-4"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStepIndex = getCurrentStepIndex();
  const isDelivered = order.orderStatus === 'delivered';
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-6 pt-14 pb-4 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 w-10 h-10 items-center justify-center"
        >
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">Track Order</Text>
          <Text className="text-sm text-gray-500">{order.orderNumber}</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Order Status Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 300 }}
          className={`mx-6 mt-6 p-6 rounded-xl ${
            isDelivered ? 'bg-green-50' : isCancelled ? 'bg-red-50' : 'bg-primary-50'
          }`}
        >
          <Text className="text-4xl text-center mb-2">
            {isDelivered ? '✓' : isCancelled ? '✗' : orderStatusSteps[currentStepIndex]?.icon}
          </Text>
          <Text className="text-xl font-bold text-center text-gray-900 mb-1">
            {isDelivered
              ? 'Delivered'
              : isCancelled
              ? 'Cancelled'
              : orderStatusSteps[currentStepIndex]?.label}
          </Text>
          <Text className="text-sm text-center text-gray-600">
            {formatDate(order.updatedAt)}
          </Text>
          {!isDelivered && !isCancelled && (
            <Text className="text-sm text-center text-gray-600 mt-1">
              Estimated delivery by {formatDate(getEstimatedDeliveryTime(order.createdAt))}
            </Text>
          )}
        </MotiView>

        {/* Progress Tracker */}
        {!isCancelled && (
          <View className="px-6 py-8">
            {orderStatusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <MotiView
                  key={step.key}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                  className="flex-row items-center mb-6"
                >
                  {/* Icon */}
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      isCompleted ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Text className="text-white text-xl">✓</Text>
                    ) : (
                      <Text className="text-gray-400 text-xl">{step.icon}</Text>
                    )}
                  </View>

                  {/* Text */}
                  <View className="flex-1 ml-4">
                    <Text
                      className={`text-base font-semibold ${
                        isCompleted ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text className="text-sm text-primary-600 mt-1">In Progress</Text>
                    )}
                  </View>

                  {/* Connector Line */}
                  {index < orderStatusSteps.length - 1 && (
                    <View
                      className={`absolute left-6 top-12 w-0.5 h-6 ${
                        isCompleted ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                      style={{ marginLeft: -1 }}
                    />
                  )}
                </MotiView>
              );
            })}
          </View>
        )}

        {/* Order Details */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">Order Details</Text>

          {/* Items */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            {order.items.map((item, index) => (
              <View
                key={index}
                className={`flex-row justify-between items-center ${
                  index < order.items.length - 1 ? 'mb-3 pb-3 border-b border-gray-200' : ''
                }`}
              >
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {item.productName}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {item.quantity} {item.unit} × ₹{item.pricePerUnit}
                  </Text>
                </View>
                <Text className="text-base font-bold text-gray-900">
                  ₹{item.total}
                </Text>
              </View>
            ))}
          </View>

          {/* Delivery Address */}
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              📍 Delivery Address
            </Text>
            <Text className="text-base text-gray-700">
              {order.deliveryAddress.street}
            </Text>
            <Text className="text-base text-gray-700">
              {order.deliveryAddress.city}, {order.deliveryAddress.state} -{' '}
              {order.deliveryAddress.pincode}
            </Text>
          </View>

          {/* Payment Summary */}
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-base text-gray-600">Subtotal</Text>
              <Text className="text-base text-gray-900">₹{order.subtotal}</Text>
            </View>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-base text-gray-600">Delivery Fee</Text>
              <Text className="text-base text-gray-900">₹{order.deliveryFee}</Text>
            </View>
            <View className="flex-row justify-between items-center pt-2 border-t border-gray-300">
              <Text className="text-lg font-bold text-gray-900">Total</Text>
              <Text className="text-lg font-bold text-primary-600">₹{order.total}</Text>
            </View>
            <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200">
              <Text className="text-sm text-gray-600">Payment Method</Text>
              <Text className="text-sm font-semibold text-gray-900 uppercase">
                {order.paymentMethod}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Contact Support / Cancel Order */}
      {!isDelivered && !isCancelled && (
        <View className="px-6 py-4 border-t border-gray-200">
          {canCancelOrder(order.orderStatus) && (
            <TouchableOpacity
              onPress={handleCancelOrder}
              disabled={cancelling}
              className={`bg-red-50 rounded-xl py-4 items-center mb-3 ${
                cancelling ? 'opacity-50' : ''
              }`}
            >
              {cancelling ? (
                <ActivityIndicator color="#ef4444" />
              ) : (
                <Text className="text-red-600 font-semibold text-base">
                  Cancel Order
                </Text>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => Alert.alert('Support', 'Contact customer support at support@farmergroceries.com')}
            className="bg-gray-100 rounded-xl py-4 items-center"
          >
            <Text className="text-gray-900 font-semibold text-base">
              Need Help? Contact Support
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
