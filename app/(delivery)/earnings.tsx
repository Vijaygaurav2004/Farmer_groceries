import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MotiView } from 'moti';
import { formatCurrency } from '../../src/utils/helpers';

type EarningsPeriod = 'today' | 'week' | 'month';

export default function DeliveryEarningsScreen() {
  // Demo earnings data
  const stats = {
    today: 450,
    week: 2850,
    month: 12400,
    total: 45600,
  };
  const [period, setPeriod] = useState<EarningsPeriod>('today');

  const periodLabel: Record<EarningsPeriod, string> = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-6 bg-primary-600">
        <Text className="text-white text-base mb-1">Your Earnings</Text>
        <Text className="text-white text-4xl font-bold">{formatCurrency(stats.total)}</Text>
        <Text className="text-primary-100 text-sm mt-1">Total Earnings</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
            className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-3"
          >
            <Text className="text-sm text-gray-600 mb-1">Today</Text>
            <Text className="text-3xl font-bold text-gray-900">{formatCurrency(stats.today)}</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 100 }}
            className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-3"
          >
            <Text className="text-sm text-gray-600 mb-1">This Week</Text>
            <Text className="text-3xl font-bold text-gray-900">{formatCurrency(stats.week)}</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 200 }}
            className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 mb-3"
          >
            <Text className="text-sm text-gray-600 mb-1">This Month</Text>
            <Text className="text-3xl font-bold text-gray-900">{formatCurrency(stats.month)}</Text>
          </MotiView>

          {/* Recent Deliveries */}
          <View className="mt-8">
            <Text className="text-lg font-bold text-gray-900 mb-4">Recent Deliveries</Text>
            
            <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">Order #DO3</Text>
                  <Text className="text-sm text-gray-600">Delivered to Amit Patel</Text>
                </View>
                <Text className="text-lg font-bold text-green-600">+{formatCurrency(150)}</Text>
              </View>
              <Text className="text-xs text-gray-500">Today, 2:30 PM</Text>
            </View>

            <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">Order #DO2</Text>
                  <Text className="text-sm text-gray-600">Delivered to Priya Sharma</Text>
                </View>
                <Text className="text-lg font-bold text-green-600">+{formatCurrency(150)}</Text>
              </View>
              <Text className="text-xs text-gray-500">Today, 11:45 AM</Text>
            </View>

            <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">Order #DO1</Text>
                  <Text className="text-sm text-gray-600">Delivered to Rajesh Kumar</Text>
                </View>
                <Text className="text-lg font-bold text-green-600">+{formatCurrency(150)}</Text>
              </View>
              <Text className="text-xs text-gray-500">Yesterday, 5:20 PM</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

