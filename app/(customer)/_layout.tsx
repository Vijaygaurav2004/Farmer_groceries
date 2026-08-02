import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../src/components/ui';

export default function CustomerLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="payment" options={{ href: null }} />
      <Tabs.Screen name="product/[id]" options={{ href: null }} />
      <Tabs.Screen name="track-order/[id]" options={{ href: null }} />
    </Tabs>
  );
}
