import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { CartProvider } from '../src/contexts/CartContext';
import '../global.css';

function RootLayoutNav() {
  const { user, loading, role } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inRoleSelect = segments[0] === 'role-select';
    const inCustomerGroup = segments[0] === '(customer)';
    const inFarmerGroup = segments[0] === '(farmer)';
    const inDeliveryGroup = segments[0] === '(delivery)';

    console.log('Navigation Guard:', { user: !!user, role, segments, inRoleSelect });

    // Don't redirect if we're on role-select screen
    if (inRoleSelect) {
      console.log('On role-select, skipping navigation');
      return;
    }

    // Don't redirect if we're already on the correct screen
    if (user && role) {
      if ((role === 'customer' && inCustomerGroup) ||
          (role === 'farmer' && inFarmerGroup) ||
          (role === 'delivery' && inDeliveryGroup)) {
        console.log('Already on correct screen');
        return;
      }
    }

    if (!user && !role && !inAuthGroup) {
      // Redirect to login if not authenticated AND no role (completely logged out)
      console.log('Redirecting to login - no user and no role');
      router.replace('/(auth)/login');
    } else if ((user || role) && !role && !inRoleSelect) {
      // Redirect to role selection if authenticated but no role
      console.log('Redirecting to role-select - user but no role');
      router.replace('/role-select');
    } else if ((user || role) && role) {
      // Redirect to appropriate home based on role if user is in wrong section
      // Allow access with just role (demo mode) OR with user + role
      const inWrongSection = (role === 'customer' && !inCustomerGroup) ||
                             (role === 'farmer' && !inFarmerGroup) ||
                             (role === 'delivery' && !inDeliveryGroup);
      
      if (inWrongSection || inAuthGroup || inRoleSelect) {
        console.log('Redirecting to home based on role:', role);
        if (role === 'customer') {
          router.replace('/(customer)/home');
        } else if (role === 'farmer') {
          router.replace('/(farmer)/dashboard');
        } else if (role === 'delivery') {
          router.replace('/(delivery)/orders');
        }
      }
    }
  }, [user, loading, role, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootLayoutNav />
      </CartProvider>
    </AuthProvider>
  );
}

