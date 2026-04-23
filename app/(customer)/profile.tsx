import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useAuth } from '../../src/contexts/AuthContext';
import { APP_CONFIG, SUCCESS_MESSAGES } from '../../src/constants';
import { validatePhone } from '../../src/utils/helpers';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');

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

  const handleSaveProfile = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your full name');
      return;
    }

    if (phone && !validatePhone(phone.replace(/\D/g, '').slice(-10))) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian mobile number');
      return;
    }

    Alert.alert('Success', SUCCESS_MESSAGES.profileUpdated);
    setEditModalVisible(false);
  };

  const menuItems = [
    { 
      icon: '👤', 
      label: 'Edit Profile', 
      action: () => setEditModalVisible(true),
      description: 'Update your personal information'
    },
    { 
      icon: '📍', 
      label: 'Saved Addresses', 
      action: () => setAddressModalVisible(true),
      description: 'Manage your delivery addresses'
    },
    { 
      icon: '💳', 
      label: 'Payment Methods', 
      action: () => Alert.alert('Payment Methods', 'Manage your saved payment methods'),
      description: 'Add or remove payment options'
    },
    { 
      icon: '🔔', 
      label: 'Notifications', 
      action: () => Alert.alert('Notifications', 'Notification preferences'),
      description: 'Manage notification settings'
    },
    { 
      icon: '❓', 
      label: 'Help & Support', 
      action: () =>
        Alert.alert(
          'Help & Support',
          `Email: ${APP_CONFIG.supportEmail}\nPhone: ${APP_CONFIG.supportPhone}`
        ),
      description: 'Get help with your orders'
    },
    { 
      icon: '📄', 
      label: 'Terms & Conditions', 
      action: () => Alert.alert('Terms & Conditions', 'View our terms of service'),
      description: 'Read our terms of service'
    },
    { 
      icon: '🔒', 
      label: 'Privacy Policy', 
      action: () => Alert.alert('Privacy Policy', 'View our privacy policy'),
      description: 'How we protect your data'
    },
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-14 pb-6 bg-primary-600">
        <View className="items-center">
          <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-3">
            <Text className="text-5xl">👤</Text>
          </View>
          <Text className="text-white text-2xl font-bold mb-1">
            {user?.name || 'Guest User'}
          </Text>
          <Text className="text-primary-100 text-sm">
            {user?.email || 'guest@example.com'}
          </Text>
          {user?.phoneNumber && (
            <Text className="text-primary-100 text-sm mt-1">
              {user.phoneNumber}
            </Text>
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
                🚪 Sign Out
              </Text>
            </TouchableOpacity>
          </MotiView>

          {/* Version */}
          <Text className="text-center text-gray-400 text-sm mt-6 mb-4">
            {APP_CONFIG.name} v{APP_CONFIG.version}
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text className="text-2xl text-gray-400">×</Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveProfile}
              className="bg-primary-600 rounded-xl py-4 items-center"
            >
              <Text className="text-white font-semibold text-base">Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Address Modal */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900">Saved Addresses</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Text className="text-2xl text-gray-400">×</Text>
              </TouchableOpacity>
            </View>

            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-base font-semibold text-gray-900 mb-2">
                🏠 Home
              </Text>
              <Text className="text-sm text-gray-600">
                Enter your delivery address when placing an order
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                setAddressModalVisible(false);
                Alert.alert('Add Address', 'Add new address feature coming soon!');
              }}
              className="border-2 border-dashed border-primary-300 rounded-xl py-4 items-center"
            >
              <Text className="text-primary-600 font-semibold text-base">
                + Add New Address
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
