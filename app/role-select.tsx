import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '../src/contexts/AuthContext';
import { UserRole } from '../src/types';

interface RoleOption {
  role: UserRole;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'customer',
    icon: '🛒',
    title: 'Customer',
    description: 'Buy fresh produce directly from farmers',
    color: 'bg-blue-100',
  },
  {
    role: 'farmer',
    icon: '🌾',
    title: 'Farmer',
    description: 'Sell your fresh produce directly to customers',
    color: 'bg-green-100',
  },
  {
    role: 'delivery',
    icon: '🚚',
    title: 'Delivery Partner',
    description: 'Deliver orders and earn money',
    color: 'bg-orange-100',
  },
];

export default function RoleSelectScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const { setRole } = useAuth();
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert('Select Role', 'Please select a role to continue');
      return;
    }

    setLoading(true);
    try {
      console.log('Setting role:', selectedRole);
      await setRole(selectedRole);
      console.log('Role set successfully, navigating to dashboard...');

      // Navigate based on role
      if (selectedRole === 'customer') {
        console.log('Navigating to customer home');
        router.replace('/(customer)/home');
      } else if (selectedRole === 'farmer') {
        console.log('Navigating to farmer dashboard');
        router.replace('/(farmer)/dashboard');
      } else if (selectedRole === 'delivery') {
        console.log('Navigating to delivery orders');
        router.replace('/(delivery)/orders');
      }
    } catch (error: any) {
      console.error('Role selection error:', error);
      Alert.alert('Error', error.message || 'Failed to set role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 pt-16 pb-8">
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          className="mb-8"
        >
          <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-4">
            <Text className="text-4xl">🌾</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Role
          </Text>
          <Text className="text-base text-gray-600">
            Select how you want to use Farmer Groceries
          </Text>
        </MotiView>

        {/* Role Options */}
        <View className="gap-4">
          {roleOptions.map((option, index) => (
            <MotiView
              key={option.role}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 600, delay: index * 100 }}
            >
              <TouchableOpacity
                onPress={() => setSelectedRole(option.role)}
                className={`border-2 rounded-2xl p-4 mb-4 ${
                  selectedRole === option.role
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-16 h-16 ${option.color} rounded-xl items-center justify-center mr-4`}
                  >
                    <Text className="text-3xl">{option.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      {option.title}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {option.description}
                    </Text>
                  </View>
                  {selectedRole === option.role && (
                    <View className="w-6 h-6 bg-primary-600 rounded-full items-center justify-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>

        {/* Continue Button */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 400 }}
          className="mt-8"
        >
          <TouchableOpacity
            onPress={handleContinue}
            disabled={loading || !selectedRole}
            className={`bg-primary-600 rounded-xl py-4 items-center ${
              !selectedRole || loading ? 'opacity-50' : ''
            }`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </MotiView>

        {/* Note */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 600, delay: 500 }}
          className="mt-6"
        >
          <Text className="text-center text-sm text-gray-500">
            You can change your role later in settings
          </Text>
        </MotiView>
      </View>
    </ScrollView>
  );
}

