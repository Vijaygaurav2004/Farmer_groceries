import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MotiView } from 'moti';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order } from '../../src/types';
import { DELIVERY_FEE } from '../../src/constants';
import { formatCurrency, getTimeAgo } from '../../src/utils/helpers';

type EarningsPeriod = 'today' | 'week' | 'month';

export default function DeliveryEarningsScreen() {
  const { user } = useAuth();
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<EarningsPeriod>('today');

  useEffect(() => {
    loadDeliveredOrders();
  }, [user]);

  const loadDeliveredOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const orders = await SupabaseService.getDeliveryPartnerDeliveredOrders(user.id);
      setDeliveredOrders(orders);
    } catch (error) {
      console.error('Error loading delivered orders:', error);
      setDeliveredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDeliveredOrders();
    setRefreshing(false);
  };

  const periodLabel: Record<EarningsPeriod, string> = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = deliveredOrders.reduce(
    (acc, order) => {
      const createdAt = new Date(order.createdAt);
      acc.total += DELIVERY_FEE;
      if (createdAt >= startOfMonth) acc.month += DELIVERY_FEE;
      if (createdAt >= startOfWeek) acc.week += DELIVERY_FEE;
      if (createdAt >= startOfToday) acc.today += DELIVERY_FEE;
      return acc;
    },
    { today: 0, week: 0, month: 0, total: 0 }
  );

  const recentDeliveries = [...deliveredOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-6 bg-primary-600">
        <Text className="text-white text-base mb-1">Your Earnings</Text>
        <Text className="text-white text-4xl font-bold">{formatCurrency(stats.total)}</Text>
        <Text className="text-primary-100 text-sm mt-1">Total Earnings</Text>
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
          <View className="px-6 py-6">
            {/* Period selector */}
            <View className="flex-row mb-4">
              {(Object.keys(periodLabel) as EarningsPeriod[]).map(key => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setPeriod(key)}
                  className={`mr-2 px-4 py-2 rounded-full ${
                    period === key ? 'bg-primary-600' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      period === key ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {periodLabel[key]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <MotiView
              key={period}
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              className="bg-primary-50 rounded-xl p-4 mb-6"
            >
              <Text className="text-sm text-gray-600 mb-1">{periodLabel[period]}</Text>
              <Text className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats[period])}
              </Text>
            </MotiView>

            {/* Earnings Breakdown */}
            <Text className="text-lg font-bold text-gray-900 mb-4">Breakdown</Text>

            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300 }}
              className="bg-blue-50 rounded-xl p-4 mb-3"
            >
              <Text className="text-sm text-gray-600 mb-1">Today</Text>
              <Text className="text-3xl font-bold text-gray-900">{formatCurrency(stats.today)}</Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300, delay: 100 }}
              className="bg-green-50 rounded-xl p-4 mb-3"
            >
              <Text className="text-sm text-gray-600 mb-1">This Week</Text>
              <Text className="text-3xl font-bold text-gray-900">{formatCurrency(stats.week)}</Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 300, delay: 200 }}
              className="bg-purple-50 rounded-xl p-4 mb-3"
            >
              <Text className="text-sm text-gray-600 mb-1">This Month</Text>
              <Text className="text-3xl font-bold text-gray-900">{formatCurrency(stats.month)}</Text>
            </MotiView>

            {/* Recent Deliveries */}
            <View className="mt-8">
              <Text className="text-lg font-bold text-gray-900 mb-4">Recent Deliveries</Text>

              {recentDeliveries.length === 0 ? (
                <View className="bg-gray-50 rounded-xl p-8 items-center">
                  <Text className="text-4xl mb-2">🚚</Text>
                  <Text className="text-gray-600">No deliveries yet</Text>
                </View>
              ) : (
                recentDeliveries.map((order, index) => (
                  <MotiView
                    key={order.id}
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 300, delay: index * 50 }}
                    className="bg-white rounded-xl border border-gray-200 p-4 mb-3"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900">
                          {order.orderNumber}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          Delivered to {order.customerName}
                        </Text>
                      </View>
                      <Text className="text-lg font-bold text-green-600">
                        +{formatCurrency(DELIVERY_FEE)}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500">{getTimeAgo(order.createdAt)}</Text>
                  </MotiView>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
