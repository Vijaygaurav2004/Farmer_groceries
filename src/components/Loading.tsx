// Common UI Components

import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '../constants';

export const LoadingSpinner = ({ message }: { message?: string }) => (
  <View className="flex-1 items-center justify-center bg-white px-6">
    <ActivityIndicator size="large" color={COLORS.primary} />
    {message ? (
      <Text className="text-gray-600 text-sm mt-3 text-center">{message}</Text>
    ) : null}
  </View>
);

export const SkeletonLoader = ({ height = 20, className = '' }: { height?: number; className?: string }) => (
  <View
    className={`bg-gray-200 rounded ${className}`}
    style={{ height }}
  />
);

export const EmptyState = ({
  icon = '📦',
  title,
  subtitle,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
}) => (
  <View className="flex-1 items-center justify-center px-6">
    <Text className="text-6xl mb-4">{icon}</Text>
    <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">{title}</Text>
    {subtitle ? (
      <Text className="text-gray-600 text-center">{subtitle}</Text>
    ) : null}
  </View>
);

