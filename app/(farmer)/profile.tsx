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
import { APP_CONFIG } from '../../src/constants';

export default function FarmerProfileScreen() {
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
      icon: '🌾', 
      label: 'Farm Details', 
      action: () => Alert.alert('Farm Details', 'Update your farm name, location, and description'),
      description: 'Manage your farm information'
    },
    { 
      icon: '📄', 
      label: 'Verification Documents', 
      action: () => Alert.alert('Verification', 'Upload farm certification and identity documents'),
      description: 'Upload verification documents'
    },
    { 
      icon: '💰', 
      label: 'Earnings & Payouts', 
      action: () => Alert.alert('Earnings', 'View your total earnings and payout history'),
      description: 'Track your income'
    },
    { 
      icon: '⭐', 
      label: 'Reviews & Ratings', 
      action: () => Alert.alert('Reviews', 'See what customers are saying about your products'),
      description: 'Customer feedback'
    },
    { 
      icon: '🔔', 
      label: 'Notifications', 
      action: () => Alert.alert('Notifications', 'Manage your notification preferences'),
      description: 'Notification settings'
    },
    { 
      icon: '❓', 
      label: 'Help & Support', 
      action: () => Alert.alert('Support', 'Contact us at farmer-support@farmergroceries.com'),
      description: 'Get help with your account'
    },
    { 
      icon: '📋', 
      label: 'Terms & Conditions', 
      action: () => Alert.alert('Terms', 'View farmer terms and conditions'),
      description: 'Read our terms'
    },
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-6 bg-primary-600">
        <View className="items-center">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-3">
            <Text className="text-5xl">👨‍🌾</Text>
          </View>
          <Text className="text-white text-2xl font-bold mb-1">
            {user?.name || 'Farmer'}
          </Text>
          {user?.phoneNumber && (
            <Text className="text-primary-100">{user.phoneNumber}</Text>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
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
            {APP_CONFIG.name} v{APP_CONFIG.version}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

