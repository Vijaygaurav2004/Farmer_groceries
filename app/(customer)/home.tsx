import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCart } from '../../src/contexts/CartContext';
import { SupabaseService } from '../../src/services/supabase';
import { Product, ProductCategory, Farmer } from '../../src/types';

const categories: { id: ProductCategory; label: string; icon: string }[] = [
  { id: 'vegetables', label: 'Vegetables', icon: '🥬' },
  { id: 'fruits', label: 'Fruits', icon: '🍎' },
  { id: 'dairy', label: 'Dairy', icon: '🥛' },
  { id: 'grains', label: 'Grains', icon: '🌾' },
  { id: 'herbs', label: 'Herbs', icon: '🌿' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'honey', label: 'Honey', icon: '🍯' },
  { id: 'other', label: 'Other', icon: '🛒' },
];

// No more hardcoded demo products - all data comes from database

export default function CustomerHomeScreen() {
  const { user } = useAuth();
  const { cartCount, addToCart } = useCart();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load real products from Supabase
      let productsData: Product[] = [];

      if (selectedCategory) {
        // Load products by category
        productsData = await SupabaseService.getProductsByCategory(selectedCategory);
      } else {
        // Load all available products (limit to 50 for performance)
        const allProductsPromises = categories.map(cat => 
          SupabaseService.getProductsByCategory(cat.id)
        );
        const allProducts = await Promise.all(allProductsPromises);
        productsData = allProducts.flat().slice(0, 50);
      }
      
      setProducts(productsData);

      // Load nearby farmers
      try {
        const farmersData = await SupabaseService.getNearbyFarmers(19.0760, 72.8777, 100);
      setFarmers(farmersData.slice(0, 5));
      } catch (error) {
        console.log('Error loading farmers:', error);
        setFarmers([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    
    // Add visual feedback - mark as added temporarily
    setAddedProducts(prev => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }, 1500);
    
    // Show feedback based on platform
    if (Platform.OS === 'android') {
      ToastAndroid.show(`✓ ${product.name} added to cart`, ToastAndroid.SHORT);
    }
    // For iOS, silent feedback with just the button animation is enough
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-primary-600">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white text-base">Good Morning 👋</Text>
            <Text className="text-white text-2xl font-bold">
              {user?.name || 'Guest'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(customer)/cart')}
            className="relative"
          >
            <Text className="text-4xl">🛒</Text>
            {cartCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-xl px-4 py-3 flex-row items-center">
          <Text className="text-xl mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-base"
            placeholder="Search fresh produce..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Categories */}
        <View className="px-6 py-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              className={`mr-3 px-4 py-2 rounded-full ${!selectedCategory ? 'bg-primary-600' : 'bg-gray-100'
                }`}
            >
              <Text
                className={`text-sm font-semibold ${!selectedCategory ? 'text-white' : 'text-gray-700'
                  }`}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                className={`mr-3 px-4 py-2 rounded-full flex-row items-center ${selectedCategory === category.id ? 'bg-primary-600' : 'bg-gray-100'
                  }`}
              >
                <Text className="text-base mr-1">{category.icon}</Text>
                <Text
                  className={`text-sm font-semibold ${selectedCategory === category.id ? 'text-white' : 'text-gray-700'
                    }`}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Verified Farmers */}
        {farmers.length > 0 && (
          <View className="px-6 py-4">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Verified Farmers Near You
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {farmers.map((farmer, index) => (
                <MotiView
                  key={farmer.id}
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                  className="mr-4 bg-earth-50 rounded-xl p-4 w-40"
                >
                  <View className="items-center mb-2">
                    <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-2">
                      <Text className="text-3xl">👨‍🌾</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-sm font-semibold text-gray-900">
                        {farmer.farmName}
                      </Text>
                      <Text className="text-xs ml-1">✓</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-center">
                    <Text className="text-yellow-500 text-xs">⭐</Text>
                    <Text className="text-xs text-gray-600 ml-1">
                      {farmer.rating.toFixed(1)} ({farmer.totalReviews})
                    </Text>
                  </View>
                </MotiView>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Products */}
        <View className="px-6 py-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            {selectedCategory
              ? categories.find(c => c.id === selectedCategory)?.label
              : 'Fresh Produce'}
          </Text>

          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#22c55e" />
            </View>
          ) : filteredProducts.length === 0 ? (
            <View className="py-12 items-center">
              <Text className="text-5xl mb-2">📦</Text>
              <Text className="text-gray-600 text-center">
                No products available
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {filteredProducts.map((product, index) => (
                <MotiView
                  key={product.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                  className="w-[48%] mb-4"
                >
                  <TouchableOpacity
                    onPress={() => router.push(`/(customer)/product/${product.id}`)}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                    activeOpacity={0.7}
                  >
                    {/* Product Image */}
                    <View className="w-full h-32 bg-gray-100 items-center justify-center">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          source={{ uri: product.images[0] }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Text className="text-5xl">
                          {categories.find(c => c.id === product.category)?.icon || '🥬'}
                        </Text>
                      )}
                    </View>

                    {/* Product Info */}
                    <View className="p-3">
                      <View className="flex-row items-center mb-1">
                        <Text className="text-sm font-semibold text-gray-900 flex-1" numberOfLines={1}>
                          {product.name}
                        </Text>
                        {product.isOrganic && (
                          <Text className="text-xs">🌱</Text>
                        )}
                      </View>
                      <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>
                        {product.farmerName}
                      </Text>
                      <View className="flex-row justify-between items-center">
                        <View>
                          <Text className="text-base font-bold text-primary-600">
                            ₹{product.pricePerUnit}
                          </Text>
                          <Text className="text-xs text-gray-500">per {product.unit}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          className={`rounded-lg px-3 py-2 ${
                            addedProducts.has(product.id) 
                              ? 'bg-green-600' 
                              : 'bg-primary-600'
                          }`}
                        >
                          <Text className="text-white text-xs font-semibold">
                            {addedProducts.has(product.id) ? '✓ Added' : 'Add'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </View>
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

