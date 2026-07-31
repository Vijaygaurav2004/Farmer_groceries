import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { SupabaseService } from '../../src/services/supabase';
import { storageService } from '../../src/services/storage';
import { useAuth } from '../../src/contexts/AuthContext';
import { validateEmail, validatePhone } from '../../src/utils/helpers';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser, setJustLoggedIn } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password');
      return;
    }

    if (isSignUp && !name) {
      Alert.alert('Missing Fields', 'Please enter your name');
      return;
    }

    if (isSignUp && !phone) {
      Alert.alert('Missing Fields', 'Please enter your phone number');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    if (isSignUp && !validatePhone(phone.replace(/\D/g, '').slice(-10))) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        console.log('Login: Creating new account for:', email);
        const { user } = await SupabaseService.signUp(email, password);
        
        if (user) {
          // Create user in database
          try {
            await SupabaseService.createUser(user.id, {
              email: user.email || email,
              name: name.trim(),
              phoneNumber: `+91 ${phone.replace(/\D/g, '').slice(-10)}`,
            });
            console.log('Login: User created in database');
          } catch (error) {
            console.log('Login: Database user creation skipped (demo mode)');
          }
          
          // Sign out immediately
          await SupabaseService.signOut();
          await storageService.clearUser();
          
          // Reset form
          setEmail('');
          setPassword('');
          setName('');
          setPhone('');
          setIsSignUp(false);
          
          // Show success message
          Alert.alert(
            'Success',
            'Account created successfully! Please sign in to continue.'
          );
        }
      } else {
        // Sign in
        console.log('Login: Signing in user:', email);
        const { user } = await SupabaseService.signIn(email, password);
        
        if (user) {
          console.log('Login: User signed in successfully:', user.email);
          
          // Load user from database
          const userData = await SupabaseService.getUser(user.id);
          
          if (userData && userData.role) {
            // User has role - redirect to dashboard
            console.log('Login: User has role:', userData.role);
            
            // Refresh auth context
            await refreshUser();
            
            // Navigate to appropriate dashboard
            if (userData.role === 'customer') {
              router.replace('/(customer)/home');
            } else if (userData.role === 'farmer') {
              router.replace('/(farmer)/dashboard');
            } else if (userData.role === 'delivery') {
              router.replace('/(delivery)/orders');
            }
          } else {
            // User needs role selection
            console.log('Login: User needs role selection');
            
            // Create user in database if doesn't exist
            if (!userData) {
              try {
                await SupabaseService.createUser(user.id, {
                  email: user.email || email,
                  name: user.email?.split('@')[0] || 'User',
                });
                console.log('Login: User created in database');
              } catch (error: any) {
                if (error?.code !== '23505') {
                  console.error('Login: Error creating user:', error);
                }
              }
            }
            
            // Create user object for storage (fallback for role selection)
            const userForStorage = {
              id: user.id,
              email: user.email || email,
              name: userData?.name || user.email?.split('@')[0] || 'User',
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            // Save to AsyncStorage as fallback
            await storageService.saveUser(userForStorage as any);
            console.log('Login: User saved to AsyncStorage for role selection');
            
            // Set protection flag
            setJustLoggedIn(true);
            
            // Refresh auth context
            await refreshUser();
            
            // Small delay to ensure refresh completes
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Navigate to role selection
            console.log('Login: Navigating to role-select');
            router.replace('/role-select');
          }
        }
      }
    } catch (error: any) {
      console.error('Login: Authentication error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 justify-center py-8">
          {/* Logo */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600 }}
            className="items-center mb-8"
          >
            <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4">
              <Text className="text-5xl">🌾</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">Farmer Groceries</Text>
            <Text className="text-base text-gray-600 mt-2">Farm-fresh, delivered to you</Text>
          </MotiView>

          {/* Form */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
          >
            <Text className="text-xl font-semibold text-gray-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text className="text-base text-gray-600 mb-6">
              {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
            </Text>

            {/* Name Field - Only for Sign Up */}
            {isSignUp && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Full Name</Text>
                <TextInput
                  className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
              <TextInput
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Phone Field - Only for Sign Up */}
            {isSignUp && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number</Text>
                <View className="flex-row items-center border-2 border-gray-200 rounded-xl px-4 py-3">
                  <Text className="text-base text-gray-700 mr-2">+91</Text>
                  <TextInput
                    className="flex-1 text-base text-gray-900"
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={10}
                  />
                </View>
              </View>
            )}

            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
              <TextInput
                className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder={isSignUp ? 'Create a password (min 6 characters)' : 'Enter your password'}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              className={`bg-primary-600 rounded-xl py-4 items-center mb-4 ${
                loading ? 'opacity-50' : ''
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsSignUp(!isSignUp);
                // Clear fields when switching
                setName('');
                setPhone('');
              }}
              disabled={loading}
              className="items-center"
            >
              <Text className="text-gray-600 text-sm">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text className="text-primary-600 font-semibold">
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </Text>
            </TouchableOpacity>
          </MotiView>

          {/* Footer */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 400 }}
            className="mt-8"
          >
            <Text className="text-center text-sm text-gray-500">
              By continuing, you agree to our{'\n'}
              <Text className="text-primary-600">Terms of Service</Text> and{' '}
              <Text className="text-primary-600">Privacy Policy</Text>
            </Text>
          </MotiView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
