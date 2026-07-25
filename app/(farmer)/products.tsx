import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { MotiView } from 'moti';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Product, ProductCategory } from '../../src/types';
import { CATEGORIES, LOW_STOCK_THRESHOLD, SUCCESS_MESSAGES } from '../../src/constants';

const categories = CATEGORIES.map(category => ({
  id: category.id as ProductCategory,
  label: category.label,
  icon: category.icon,
}));

// No more hardcoded demo products - all data from database

export default function FarmerProductsScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add Product Form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'vegetables' as ProductCategory,
    pricePerUnit: '',
    stock: '',
    unit: 'kg' as 'kg' | 'piece' | 'dozen' | 'liter',
    isOrganic: false,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const productsData = await SupabaseService.getFarmerProducts(user.id);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleAddProduct = async () => {
    if (!user) return;
    
    if (!formData.name || !formData.pricePerUnit || !formData.stock) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      await SupabaseService.createProduct({
        farmerId: user.id,
        farmerName: user.name || 'Farmer',
        name: formData.name,
        description: formData.description,
        category: formData.category,
        images: [],
        unit: formData.unit,
        pricePerUnit: parseFloat(formData.pricePerUnit),
        stock: parseFloat(formData.stock),
        harvestDate: new Date(),
        isOrganic: formData.isOrganic,
        isAvailable: true,
      });

      Alert.alert('Success', SUCCESS_MESSAGES.productAdded);
      setShowAddModal(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'vegetables',
      pricePerUnit: '',
      stock: '',
      unit: 'kg',
      isOrganic: false,
    });
  };

  const handleToggleAvailability = async (productId: string, isAvailable: boolean) => {
    try {
      await SupabaseService.updateProduct(productId, { isAvailable: !isAvailable });
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-bold text-gray-900">
            My Products ({products.length})
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="bg-primary-600 rounded-lg px-4 py-2"
          >
            <Text className="text-white font-semibold">+ Add</Text>
          </TouchableOpacity>
        </View>
        {products.length > 0 && (
          <View className="bg-gray-100 rounded-xl px-4 py-3 flex-row items-center">
            <Text className="text-lg mr-2">🔍</Text>
            <TextInput
              className="flex-1 text-base"
              placeholder="Search by name or category..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-6xl mb-4">🌾</Text>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            No products yet
          </Text>
          <Text className="text-gray-600 mb-6">Add your first product to start selling</Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="bg-primary-600 rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold">Add Product</Text>
          </TouchableOpacity>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-5xl mb-3">🔍</Text>
          <Text className="text-lg font-semibold text-gray-900 mb-1">No matches</Text>
          <Text className="text-gray-600 text-center">
            No products match "{searchQuery}"
          </Text>
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
            {filteredProducts.map((product, index) => (
              <MotiView
                key={product.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                className="flex-row bg-white border border-gray-200 rounded-xl p-4 mb-3"
              >
                {/* Product Image */}
                <View className="w-20 h-20 bg-gray-100 rounded-lg items-center justify-center mr-3">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      source={{ uri: product.images[0] }}
                      className="w-full h-full rounded-lg"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-3xl">
                      {categories.find(c => c.id === product.category)?.icon || '🥬'}
                    </Text>
                  )}
                </View>

                {/* Product Info */}
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-base font-semibold text-gray-900 flex-1">
                      {product.name}
                    </Text>
                    {product.isOrganic && <Text className="text-xs">🌱</Text>}
                  </View>
                  
                  <View className="flex-row items-center mb-2">
                    <Text className="text-sm text-gray-600 mr-3">
                      ₹{product.pricePerUnit}/{product.unit}
                    </Text>
                    <Text
                      className={`text-sm ${
                        product.stock <= LOW_STOCK_THRESHOLD ? 'text-yellow-600 font-semibold' : 'text-gray-600'
                      }`}
                    >
                      Stock: {product.stock}
                    </Text>
                    {product.stock <= LOW_STOCK_THRESHOLD && (
                      <Text className="text-xs ml-1">⚠️</Text>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View
                      className={`px-3 py-1 rounded-full ${
                        product.isAvailable ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          product.isAvailable ? 'text-green-600' : 'text-gray-600'
                        }`}
                      >
                        {product.isAvailable ? 'Available' : 'Unavailable'}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      onPress={() => handleToggleAvailability(product.id, product.isAvailable)}
                      className="bg-primary-100 px-3 py-1 rounded-lg"
                    >
                      <Text className="text-primary-600 text-xs font-semibold">
                        Toggle
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </MotiView>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Add Product Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white">
          <View className="px-6 pt-14 pb-4 border-b border-gray-200 flex-row justify-between items-center">
            <Text className="text-xl font-bold text-gray-900">Add Product</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text className="text-gray-600 text-2xl">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-4">
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Product Name *</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholder="e.g., Fresh Tomatoes"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholder="Describe your product"
                multiline
                numberOfLines={3}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setFormData({ ...formData, category: category.id })}
                    className={`mr-3 px-4 py-2 rounded-full flex-row items-center ${
                      formData.category === category.id ? 'bg-primary-600' : 'bg-gray-100'
                    }`}
                  >
                    <Text className="text-base mr-1">{category.icon}</Text>
                    <Text
                      className={`text-sm font-semibold ${
                        formData.category === category.id ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Price *</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={formData.pricePerUnit}
                  onChangeText={(text) => setFormData({ ...formData, pricePerUnit: text })}
                />
              </View>
              
              <View className="flex-1 ml-2">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Unit</Text>
                <View className="border border-gray-300 rounded-xl px-4 py-3">
                  <Text className="text-base text-gray-900">{formData.unit}</Text>
                </View>
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Stock *</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base"
                placeholder="Available quantity"
                keyboardType="decimal-pad"
                value={formData.stock}
                onChangeText={(text) => setFormData({ ...formData, stock: text })}
              />
            </View>

            <TouchableOpacity
              onPress={() => setFormData({ ...formData, isOrganic: !formData.isOrganic })}
              className="flex-row items-center mb-6"
            >
              <View
                className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 ${
                  formData.isOrganic ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                }`}
              >
                {formData.isOrganic && <Text className="text-white text-xs">✓</Text>}
              </View>
              <Text className="text-base text-gray-900">Organic Product 🌱</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddProduct}
              className="bg-primary-600 rounded-xl py-4 items-center mb-6"
            >
              <Text className="text-white text-base font-semibold">Add Product</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

