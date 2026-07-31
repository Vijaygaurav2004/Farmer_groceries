import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  // Navigation is handled by the root _layout.tsx guard, which redirects
  // logged-out users to login and logged-in users to their role home.
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );
}

