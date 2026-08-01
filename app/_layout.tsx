import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import '../src/utils/webAlert'; // makes Alert.alert work in the browser (must load first)
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { CartProvider } from '../src/contexts/CartContext';
import { ToastProvider } from '../src/components/ui';
import '../global.css';

// On the web, phones fill the screen but desktops would stretch the mobile UI
// across the whole window. Constrain the app to a phone-sized column centered
// on a neutral backdrop; on real devices (narrower than the max) it fills edge
// to edge as normal.
const PHONE_MAX_WIDTH = 430;

function ResponsiveShell({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') {
    return <View style={{ flex: 1 }}>{children}</View>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#e5e7eb', alignItems: 'center' }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: PHONE_MAX_WIDTH,
          backgroundColor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

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
      <ResponsiveShell>
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </ResponsiveShell>
    );
  }

  return (
    <ResponsiveShell>
      <Slot />
    </ResponsiveShell>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <RootLayoutNav />
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

