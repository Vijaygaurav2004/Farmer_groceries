// Common UI Components

import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export const LoadingSpinner = () => (
  <View className="flex-1 items-center justify-center bg-white">
    <ActivityIndicator size="large" color="#22c55e" />
  </View>
);

export const SkeletonLoader = ({ height = 20, className = '' }: { height?: number; className?: string }) => (
  <View
    className={`bg-gray-200 rounded ${className}`}
    style={{ height }}
  />
);

