import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../src/components/ui';

export default function DeliveryLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="earnings" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
