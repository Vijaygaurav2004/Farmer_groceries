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
import { EmptyState } from '../../src/components/Loading';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, MIN_ORDER_VALUE } from '../../src/constants';
import { formatCurrency } from '../../src/utils/helpers';

export default function CartScreen() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();
  const router = useRouter();

  const qualifiesForFreeDelivery = cartTotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = qualifiesForFreeDelivery ? 0 : DELIVERY_FEE;
  const total = cartTotal + deliveryFee;
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to cart');
      return;
    }

    if (cartTotal < MIN_ORDER_VALUE) {
      Alert.alert(
        'Minimum Order',
        `Add items worth at least ${formatCurrency(MIN_ORDER_VALUE)} to checkout. You need ${formatCurrency(MIN_ORDER_VALUE - cartTotal)} more.`
      );
      return;
    }

    // Navigate to payment page
    router.push('/(customer)/payment');
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearCart(),
        },
      ]
    );
  };

  if (cart.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <View className="px-6 pt-14 pb-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">Cart</Text>
        </View>
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          subtitle="Add some fresh produce to get started"
        />
        <View className="px-6 pb-10 items-center">
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
      <View className="px-6 pt-14 pb-4 border-b border-gray-200 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">
          Cart ({cartCount} items)
        </Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text className="text-sm font-semibold text-red-500">Clear all</Text>
        </TouchableOpacity>
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
                    {formatCurrency(item.product.pricePerUnit * item.quantity)}
                  </Text>
                  
                  {/* Quantity Controls */}
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center"
                    >
                      <Text className="text-gray-700 font-bold">-</Text>
                    </TouchableOpacity>
                    <Text className="mx-3 font-semibold text-gray-900">
                      {item.quantity}
                    </Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-10 h-10 bg-primary-600 rounded-lg items-center justify-center"
                    >
                      <Text className="text-white font-bold">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Remove Button */}
              <TouchableOpacity
                onPress={() => removeFromCart(item.productId)}
                className="ml-2 p-2"
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
            <Text className="text-gray-900 font-semibold">{formatCurrency(cartTotal)}</Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Delivery Fee</Text>
            <Text className={`font-semibold ${qualifiesForFreeDelivery ? 'text-green-600' : 'text-gray-900'}`}>
              {qualifiesForFreeDelivery ? 'FREE' : formatCurrency(deliveryFee)}
            </Text>
          </View>

          {!qualifiesForFreeDelivery && (
            <Text className="text-xs text-primary-600 mb-2">
              Add {formatCurrency(amountToFreeDelivery)} more for free delivery
            </Text>
          )}
          
          <View className="border-t border-gray-300 my-2" />
          
          <View className="flex-row justify-between">
            <Text className="text-lg font-bold text-gray-900">Total</Text>
            <Text className="text-lg font-bold text-primary-600">{formatCurrency(total)}</Text>
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
            Proceed to Payment - {formatCurrency(total)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

