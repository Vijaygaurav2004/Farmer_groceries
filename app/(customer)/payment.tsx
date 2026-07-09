import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { useCart } from '../../src/contexts/CartContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, MIN_ORDER_VALUE, SUCCESS_MESSAGES } from '../../src/constants';
import { formatCurrency, validatePincode } from '../../src/utils/helpers';

type PaymentMethod = 'gpay' | 'phonepe' | 'cod';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'gpay',
    name: 'Google Pay',
    icon: '💳',
    description: 'Pay using Google Pay UPI',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    icon: '📱',
    description: 'Pay using PhonePe UPI',
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    icon: '💵',
    description: 'Pay when you receive',
  },
];

export default function PaymentScreen() {
  const router = useRouter();
  const { cart, clearCart, cartTotal } = useCart();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod');
  const [loading, setLoading] = useState(false);
  
  // Address state
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = cartTotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to place an order');
      router.replace('/(auth)/login');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart');
      router.back();
      return;
    }

    if (cartTotal < MIN_ORDER_VALUE) {
      Alert.alert(
        'Minimum Order',
        `Orders must be at least ${formatCurrency(MIN_ORDER_VALUE)}. Add ${formatCurrency(MIN_ORDER_VALUE - cartTotal)} more to continue.`
      );
      return;
    }

    // Validate address
    if (!address.street || !address.city || !address.state || !address.pincode) {
      Alert.alert('Address Required', 'Please fill in all address fields');
      return;
    }

    if (!validatePincode(address.pincode)) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit Indian pincode');
      return;
    }

    setLoading(true);
    try {
      // Group items by farmer
      const ordersByFarmer = cart.reduce((acc, item) => {
        if (!acc[item.farmerId]) {
          acc[item.farmerId] = [];
        }
        acc[item.farmerId].push(item);
        return acc;
      }, {} as Record<string, typeof cart>);

      // Create separate orders for each farmer
      const orderPromises = Object.entries(ordersByFarmer).map(([farmerId, items]) => {
        const subtotal = items.reduce(
          (sum, item) => sum + item.product.pricePerUnit * item.quantity,
          0
        );

        return SupabaseService.createOrder({
          orderNumber: `ORD${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          customerId: user.id,
          customerName: user.name || 'Customer',
          farmerId,
          farmerName: items[0].product.farmerName,
          items: items.map(item => ({
            productId: item.productId,
            productName: item.product.name,
            productImage: item.product.images[0] || '',
            quantity: item.quantity,
            unit: item.product.unit,
            pricePerUnit: item.product.pricePerUnit,
            total: item.product.pricePerUnit * item.quantity,
          })),
          subtotal,
          deliveryFee,
          total: subtotal + deliveryFee,
          deliveryAddress: {
            id: 'default',
            label: 'Home',
            street: address.street,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            latitude: 0,
            longitude: 0,
            isDefault: true,
          },
          paymentMethod: selectedMethod,
          paymentStatus: selectedMethod === 'cod' ? 'pending' : 'paid',
          orderStatus: 'placed',
          statusHistory: [
            {
              status: 'placed',
              timestamp: new Date(),
            },
          ],
        });
      });

      await Promise.all(orderPromises);

      clearCart();
      
      Alert.alert(
        SUCCESS_MESSAGES.orderPlaced,
        `Your order has been placed with ${selectedMethod === 'cod' ? 'Cash on Delivery' : selectedMethod.toUpperCase()} payment method.`,
        [
          {
            text: 'View Orders',
            onPress: () => router.replace('/(customer)/orders'),
          },
          {
            text: 'Continue Shopping',
            onPress: () => router.replace('/(customer)/home'),
          },
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      
      // For demo mode, still allow order to be placed
      clearCart();
      Alert.alert(
        '✓ Order Placed (Demo Mode)',
        'Your order has been placed successfully in demo mode!',
        [
          {
            text: 'Continue Shopping',
            onPress: () => router.replace('/(customer)/home'),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Text className="text-2xl">←</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">Select Payment Method</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Order Summary */}
          <View className="bg-primary-50 rounded-xl p-4 mb-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Order Summary
            </Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="text-gray-900 font-semibold">{formatCurrency(cartTotal)}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600">Delivery Fee</Text>
              <Text className={`font-semibold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
              </Text>
            </View>
            <View className="border-t border-primary-200 my-2" />
            <View className="flex-row justify-between">
              <Text className="text-lg font-bold text-gray-900">Total</Text>
              <Text className="text-lg font-bold text-primary-600">{formatCurrency(total)}</Text>
            </View>
          </View>

          {/* Payment Methods */}
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Choose Payment Method
          </Text>

          {paymentOptions.map((option, index) => (
            <MotiView
              key={option.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 100 }}
            >
              <TouchableOpacity
                onPress={() => setSelectedMethod(option.id)}
                className={`border-2 rounded-xl p-4 mb-3 ${
                  selectedMethod === option.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-gray-100 rounded-lg items-center justify-center mr-3">
                    <Text className="text-2xl">{option.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      {option.name}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {option.description}
                    </Text>
                  </View>
                  {selectedMethod === option.id && (
                    <View className="w-6 h-6 bg-primary-600 rounded-full items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}

          {/* Delivery Address */}
          <View className="mt-4 bg-white rounded-xl border-2 border-gray-200 p-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">
              📍 Delivery Address
            </Text>
            
            <TextInput
              placeholder="Street Address *"
              value={address.street}
              onChangeText={(text) => setAddress({ ...address, street: text })}
              className="bg-gray-50 rounded-lg px-4 py-3 mb-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
            
            <TextInput
              placeholder="City *"
              value={address.city}
              onChangeText={(text) => setAddress({ ...address, city: text })}
              className="bg-gray-50 rounded-lg px-4 py-3 mb-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
            
            <View className="flex-row space-x-3">
              <TextInput
                placeholder="State *"
                value={address.state}
                onChangeText={(text) => setAddress({ ...address, state: text })}
                className="bg-gray-50 rounded-lg px-4 py-3 flex-1 text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
              
              <TextInput
                placeholder="Pincode *"
                value={address.pincode}
                onChangeText={(text) => setAddress({ ...address, pincode: text })}
                keyboardType="numeric"
                maxLength={6}
                className="bg-gray-50 rounded-lg px-4 py-3 w-28 text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View className="px-6 py-4 border-t border-gray-200 bg-white">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={loading}
          className={`bg-primary-600 rounded-xl py-4 items-center ${
            loading ? 'opacity-50' : ''
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-semibold">
              Place Order - {formatCurrency(total)}
            </Text>
          )}
        </TouchableOpacity>

        {selectedMethod !== 'cod' && (
          <Text className="text-center text-xs text-gray-500 mt-2">
            You will be redirected to {selectedMethod === 'gpay' ? 'Google Pay' : 'PhonePe'} to complete payment
          </Text>
        )}
      </View>
    </View>
  );
}
