import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '../../src/contexts/AuthContext';

export default function DeliveryProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const menuItems = [
    { 
      icon: '🚚', 
      label: 'Vehicle Details', 
      action: () => Alert.alert('Vehicle Details', 'Update your vehicle information and license plate'),
      description: 'Manage vehicle information'
    },
    { 
      icon: '📄', 
      label: 'Documents', 
      action: () => Alert.alert('Documents', 'Upload driving license and vehicle registration'),
      description: 'Upload required documents'
    },
    { 
      icon: '💰', 
      label: 'Payment Settings', 
      action: () => Alert.alert('Payment', 'Manage your bank account for payouts'),
      description: 'Setup payment methods'
    },
    { 
      icon: '📊', 
      label: 'Delivery Stats', 
      action: () => Alert.alert('Stats', 'View your delivery statistics and performance'),
      description: 'View your performance'
    },
    { 
      icon: '🔔', 
      label: 'Notifications', 
      action: () => Alert.alert('Notifications', 'Manage order and delivery alerts'),
      description: 'Notification preferences'
    },
    { 
      icon: '❓', 
      label: 'Help & Support', 
      action: () => Alert.alert('Support', 'Contact us at delivery-support@farmergroceries.com'),
      description: 'Get help with deliveries'
    },
    { 
      icon: '📋', 
      label: 'Terms & Conditions', 
      action: () => Alert.alert('Terms', 'View delivery partner terms'),
      description: 'Read our terms'
    },
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-6 bg-primary-600">
        <View className="items-center">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-3">
            <Text className="text-5xl">🚚</Text>
          </View>
          <Text className="text-white text-2xl font-bold mb-1">
            {user?.name || 'Delivery Partner'}
          </Text>
          <Text className="text-primary-100">{user?.phoneNumber}</Text>
          <View className="bg-green-500 px-4 py-1 rounded-full mt-2">
            <Text className="text-white text-xs font-semibold">Active</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Stats */}
          <View className="flex-row justify-between mb-6">
            <View className="bg-blue-50 rounded-xl p-4 flex-1 mr-2">
              <Text className="text-sm text-gray-600 mb-1">Deliveries</Text>
              <Text className="text-2xl font-bold text-gray-900">0</Text>
            </View>
            <View className="bg-green-50 rounded-xl p-4 flex-1 ml-2">
              <Text className="text-sm text-gray-600 mb-1">Rating</Text>
              <Text className="text-2xl font-bold text-gray-900">0.0 ⭐</Text>
            </View>
          </View>

          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <MotiView
              key={item.label}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 300, delay: index * 50 }}
            >
              <TouchableOpacity
                onPress={item.action}
                className="py-4 border-b border-gray-100"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                    <Text className="text-xl">{item.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900 mb-1">
                      {item.label}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {item.description}
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-xl">›</Text>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}

          {/* Sign Out */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: 400 }}
            className="mt-6"
          >
            <TouchableOpacity
              onPress={handleSignOut}
              className="bg-red-50 border border-red-200 rounded-xl py-4 items-center"
            >
              <Text className="text-red-600 font-semibold text-base">
                Sign Out
              </Text>
            </TouchableOpacity>
          </MotiView>

          {/* Version */}
          <Text className="text-center text-gray-400 text-sm mt-6">
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

