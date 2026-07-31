import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order, Product } from '../../src/types';
import { LOW_STOCK_THRESHOLD } from '../../src/constants';
import { formatCurrency, getGreeting } from '../../src/utils/helpers';

// No more hardcoded demo data - all from database

export default function FarmerDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
        const [ordersData, productsData] = await Promise.all([
          SupabaseService.getFarmerOrders(user.id),
          SupabaseService.getFarmerProducts(user.id),
        ]);
          setOrders(ordersData);
          setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
      setOrders([]);
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

  const stats = {
    totalOrders: orders.length,
    activeOrders: orders.filter(o => 
      ['placed', 'confirmed', 'packed'].includes(o.orderStatus)
    ).length,
    totalProducts: products.length,
    activeProducts: products.filter(p => p.isAvailable).length,
    totalEarnings: orders
      .filter(o => o.orderStatus === 'delivered')
      .reduce((sum, o) => sum + o.total, 0),
  };

  const lowStockProducts = products.filter(
    p => p.isAvailable && p.stock <= LOW_STOCK_THRESHOLD
  );

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-6 bg-primary-600">
        <Text className="text-white text-base mb-1">{getGreeting()} 👋</Text>
        <Text className="text-white text-2xl font-bold">
          {user?.name || 'Farmer'}
        </Text>
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
          {/* Stats Cards */}
          <View className="px-6 py-6">
            <View className="flex-row flex-wrap justify-between">
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 300 }}
                className="w-[48%] bg-blue-50 rounded-xl p-4 mb-4"
              >
                <Text className="text-3xl mb-2">📦</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {stats.activeOrders}
                </Text>
                <Text className="text-sm text-gray-600">Active Orders</Text>
              </MotiView>

              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 300, delay: 100 }}
                className="w-[48%] bg-green-50 rounded-xl p-4 mb-4"
              >
                <Text className="text-3xl mb-2">🌾</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {stats.activeProducts}
                </Text>
                <Text className="text-sm text-gray-600">Active Products</Text>
              </MotiView>

              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 300, delay: 200 }}
                className="w-[48%] bg-purple-50 rounded-xl p-4 mb-4"
              >
                <Text className="text-3xl mb-2">✅</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {stats.totalOrders}
                </Text>
                <Text className="text-sm text-gray-600">Total Orders</Text>
              </MotiView>

              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 300, delay: 300 }}
                className="w-[48%] bg-yellow-50 rounded-xl p-4 mb-4"
              >
                <Text className="text-3xl mb-2">💰</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalEarnings)}
                </Text>
                <Text className="text-sm text-gray-600">Total Earnings</Text>
              </MotiView>
            </View>
          </View>

          {/* Low Stock Alerts */}
          {lowStockProducts.length > 0 && (
            <View className="px-6 pb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-900">
                  ⚠️ Low Stock Alerts
                </Text>
                <TouchableOpacity onPress={() => router.push('/(farmer)/products')}>
                  <Text className="text-primary-600 font-semibold">Manage</Text>
                </TouchableOpacity>
              </View>

              {lowStockProducts.map((product, index) => (
                <MotiView
                  key={product.id}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                  className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-3 flex-row justify-between items-center"
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {product.name}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Only {product.stock} {product.unit} left
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/(farmer)/products')}
                    className="bg-yellow-500 px-3 py-2 rounded-lg"
                  >
                    <Text className="text-white text-xs font-semibold">Restock</Text>
                  </TouchableOpacity>
                </MotiView>
              ))}
            </View>
          )}

          {/* Recent Orders */}
          <View className="px-6 pb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Recent Orders
              </Text>
              <TouchableOpacity onPress={() => router.push('/(farmer)/orders')}>
                <Text className="text-primary-600 font-semibold">View All</Text>
              </TouchableOpacity>
            </View>

            {orders.slice(0, 5).length === 0 ? (
              <View className="bg-gray-50 rounded-xl p-8 items-center">
                <Text className="text-4xl mb-2">📦</Text>
                <Text className="text-gray-600">No orders yet</Text>
              </View>
            ) : (
              orders.slice(0, 5).map((order, index) => (
                <MotiView
                  key={order.id}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                  className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className="text-base font-bold text-gray-900">
                        {order.orderNumber}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {order.customerName}
                      </Text>
                    </View>
                    <View className="bg-primary-100 px-3 py-1 rounded-full">
                      <Text className="text-primary-600 text-xs font-semibold">
                        {order.orderStatus}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-sm text-gray-600">
                      {order.items.length} items
                    </Text>
                    <Text className="text-base font-bold text-primary-600">
                      {formatCurrency(order.total)}
                    </Text>
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

