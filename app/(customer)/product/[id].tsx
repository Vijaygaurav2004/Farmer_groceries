import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { SupabaseService } from '../../../src/services/supabase';
import { useCart } from '../../../src/contexts/CartContext';
import { Product } from '../../../src/types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await SupabaseService.getProduct(id);
      setProduct(productData);
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({
      productId: product.id,
      quantity,
      product,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    Alert.alert('Success', `${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-6xl mb-4">📦</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">Product Not Found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-600 px-6 py-3 rounded-lg mt-4"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text className="text-xl font-bold text-gray-900 flex-1">Product Details</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <Image
            source={{ uri: product.images[0] || 'https://via.placeholder.com/400' }}
            className="w-full h-80"
            resizeMode="cover"
          />
        </MotiView>

        <View className="px-6 py-6">
          {/* Product Info */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: 100 }}
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1 mr-4">
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </Text>
                <Text className="text-base text-gray-600 mb-1">
                  by {product.farmerName}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-sm text-gray-500">
                    Category: {product.category}
                  </Text>
                </View>
              </View>
              
              <View className="items-end">
                <Text className="text-3xl font-bold text-primary-600">
                  ₹{product.pricePerUnit}
                </Text>
                <Text className="text-sm text-gray-500">
                  per {product.unit}
                </Text>
              </View>
            </View>

            {/* Stock */}
            <View className={`${product.stockQuantity > 0 ? 'bg-green-50' : 'bg-red-50'} px-4 py-3 rounded-lg mb-6`}>
              <Text className={`text-sm font-semibold ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.stockQuantity > 0
                  ? `${product.stockQuantity} ${product.unit} available`
                  : 'Out of Stock'}
              </Text>
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-2">Description</Text>
              <Text className="text-base text-gray-600 leading-6">
                {product.description || 'Fresh produce from local farmers. Organic and pesticide-free.'}
              </Text>
            </View>

            {/* Farmer Info */}
            <View className="bg-primary-50 rounded-xl p-4 mb-6">
              <Text className="text-base font-bold text-gray-900 mb-2">
                👨‍🌾 From {product.farmerName}'s Farm
              </Text>
              <Text className="text-sm text-gray-600">
                Supporting local farmers and ensuring fresh produce delivery
              </Text>
            </View>

            {/* Quantity Selector */}
            {product.stockQuantity > 0 && (
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-900 mb-3">Quantity</Text>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    className="bg-gray-200 w-12 h-12 rounded-lg items-center justify-center"
                  >
                    <Text className="text-2xl text-gray-700">−</Text>
                  </TouchableOpacity>
                  
                  <Text className="text-2xl font-bold text-gray-900 mx-8">
                    {quantity}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                    className="bg-gray-200 w-12 h-12 rounded-lg items-center justify-center"
                  >
                    <Text className="text-2xl text-gray-700">+</Text>
                  </TouchableOpacity>
                  
                  <View className="ml-auto">
                    <Text className="text-sm text-gray-500">Total</Text>
                    <Text className="text-xl font-bold text-primary-600">
                      ₹{(product.pricePerUnit * quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </MotiView>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      {product.stockQuantity > 0 && (
        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 200 }}
          className="px-6 py-4 border-t border-gray-200"
        >
          <TouchableOpacity
            onPress={handleAddToCart}
            className={`${addedToCart ? 'bg-green-600' : 'bg-primary-600'} rounded-xl py-4 items-center`}
          >
            <Text className="text-white text-lg font-bold">
              {addedToCart ? '✓ Added to Cart' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
}
