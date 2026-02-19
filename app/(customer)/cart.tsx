import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useCart } from '../../src/contexts/CartContext';
import { MIN_ORDER_VALUE } from '../../src/constants';

export default function CartScreen() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const router = useRouter();

  const deliveryFee = 30;
  const total = cartTotal + deliveryFee;

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart');
      return;
    }

    if (cartTotal < MIN_ORDER_VALUE) {
      Alert.alert(
        'Minimum Order',
        `Add items worth at least ₹${MIN_ORDER_VALUE} to checkout. You need ₹${MIN_ORDER_VALUE - cartTotal} more.`
      );
      return;
    }

    // Navigate to payment page
    router.push('/(customer)/payment');
  };

  if (cart.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <View className="px-6 pt-14 pb-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">Cart</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-6xl mb-4">🛒</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Your cart is empty
          </Text>
          <Text className="text-gray-600 mb-6">Add some fresh produce to get started</Text>
          <TouchableOpacity
            onPress={() => router.push('/(customer)/home')}
            className="bg-primary-600 rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Cart ({cartCount} items)
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4">
          {cart.map((item, index) => (
            <MotiView
              key={item.productId}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 50 }}
              className="flex-row bg-white border border-gray-200 rounded-xl p-4 mb-3"
            >
              {/* Product Image */}
              <View className="w-20 h-20 bg-gray-100 rounded-lg items-center justify-center mr-3">
                {item.product.images && item.product.images.length > 0 ? (
                  <Image
                    source={{ uri: item.product.images[0] }}
                    className="w-full h-full rounded-lg"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-3xl">🥬</Text>
                )}
              </View>

              {/* Product Info */}
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1">
                  {item.product.name}
                </Text>
                <Text className="text-sm text-gray-500 mb-2">
                  {item.product.farmerName}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold text-primary-600">
                    ₹{item.product.pricePerUnit * item.quantity}
                  </Text>
                  
                  {/* Quantity Controls */}
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"
                    >
                      <Text className="text-gray-700 font-bold">-</Text>
                    </TouchableOpacity>
                    <Text className="mx-3 font-semibold text-gray-900">
                      {item.quantity}
                    </Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 bg-primary-600 rounded-lg items-center justify-center"
                    >
                      <Text className="text-white font-bold">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Remove Button */}
              <TouchableOpacity
                onPress={() => removeFromCart(item.productId)}
                className="ml-2"
              >
                <Text className="text-red-500">🗑️</Text>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>

        {/* Bill Summary */}
        <View className="px-6 py-4 bg-gray-50 mx-6 rounded-xl mb-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Bill Summary</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Subtotal</Text>
            <Text className="text-gray-900 font-semibold">₹{cartTotal}</Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Delivery Fee</Text>
            <Text className="text-gray-900 font-semibold">₹{deliveryFee}</Text>
          </View>
          
          <View className="border-t border-gray-300 my-2" />
          
          <View className="flex-row justify-between">
            <Text className="text-lg font-bold text-gray-900">Total</Text>
            <Text className="text-lg font-bold text-primary-600">₹{total}</Text>
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Checkout Button */}
      <View className="px-6 py-4 border-t border-gray-200 bg-white">
        <TouchableOpacity
          onPress={handleCheckout}
          className="bg-primary-600 rounded-xl py-4 items-center"
        >
          <Text className="text-white text-base font-semibold">
            Proceed to Payment - ₹{total}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

