import React from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { MotiView } from 'moti';

export default function DeliveryEarningsScreen() {
  // Demo earnings data
  const stats = {
    today: 450,
    week: 2850,
    month: 12400,
    total: 45600,
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-6 bg-primary-600">
        <Text className="text-white text-base mb-1">Your Earnings</Text>
        <Text className="text-white text-4xl font-bold">₹{stats.total}</Text>
        <Text className="text-primary-100 text-sm mt-1">Total Earnings</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Earnings Breakdown */}
          <Text className="text-lg font-bold text-gray-900 mb-4">Breakdown</Text>
          
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300 }}
            className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 mb-3"
          >
            <Text className="text-sm text-gray-600 mb-1">Today</Text>
            <Text className="text-3xl font-bold text-gray-900">₹{stats.today}</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 100 }}
            className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-3"
          >
            <Text className="text-sm text-gray-600 mb-1">This Week</Text>
            <Text className="text-3xl font-bold text-gray-900">₹{stats.week}</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 200 }}
            className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 mb-3"
          >
            <Text className="text-sm text-gray-600 mb-1">This Month</Text>
            <Text className="text-3xl font-bold text-gray-900">₹{stats.month}</Text>
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
                <Text className="text-lg font-bold text-green-600">+₹150</Text>
              </View>
              <Text className="text-xs text-gray-500">Today, 2:30 PM</Text>
            </View>

            <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">Order #DO2</Text>
                  <Text className="text-sm text-gray-600">Delivered to Priya Sharma</Text>
                </View>
                <Text className="text-lg font-bold text-green-600">+₹150</Text>
              </View>
              <Text className="text-xs text-gray-500">Today, 11:45 AM</Text>
            </View>

            <View className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">Order #DO1</Text>
                  <Text className="text-sm text-gray-600">Delivered to Rajesh Kumar</Text>
                </View>
                <Text className="text-lg font-bold text-green-600">+₹150</Text>
              </View>
              <Text className="text-xs text-gray-500">Yesterday, 5:20 PM</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

