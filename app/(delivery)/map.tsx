import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order } from '../../src/types';
import { DELIVERY_FEE, DEFAULT_COORDINATES } from '../../src/constants';
import { calculateDistance } from '../../src/utils/helpers';

export default function DeliveryMapScreen() {
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [currentLocation] = useState(DEFAULT_COORDINATES);

  useEffect(() => {
    loadActiveOrder();
  }, []);

  const loadActiveOrder = async () => {
    if (!user) return;
    
    try {
      const orders = await SupabaseService.getDeliveryPartnerOrders(user.id);
      // Find the first active order (picked_up or out_for_delivery)
      const active = orders.find(o => 
        o.deliveryPartnerId === user.id && 
        ['picked_up', 'out_for_delivery'].includes(o.orderStatus)
      );
      setActiveOrder(active || null);
    } catch (error) {
      console.error('Error loading active order:', error);
    }
  };

  const openMapsNavigation = () => {
    if (!activeOrder) return;

    const address = activeOrder.deliveryAddress;
    const destination = `${address.street}, ${address.city}, ${address.state} ${address.pincode}`;
    
    // Open Google Maps or Apple Maps based on platform
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${address.latitude || 0},${address.longitude || 0}`;
    const label = encodeURIComponent(destination);
    
    const url = Platform.select({
      ios: `${scheme}${label}`,
      android: `${scheme}${latLng}(${label})`,
    }) || '';

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Unable to open maps application');
        }
      })
      .catch((err) => console.error('Error opening maps:', err));
  };

  const handleCallCustomer = () => {
    if (!activeOrder) return;
    
    Alert.alert(
      'Call Customer',
      'Would you like to call the customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            // In production, this would dial the actual customer number
            Linking.openURL('tel:+911234567890');
          },
        },
      ]
    );
  };

  const destinationLocation = activeOrder ? {
    latitude: activeOrder.deliveryAddress.latitude || DEFAULT_COORDINATES.latitude,
    longitude: activeOrder.deliveryAddress.longitude || DEFAULT_COORDINATES.longitude,
  } : currentLocation;

  const distanceKm = activeOrder
    ? calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        destinationLocation.latitude,
        destinationLocation.longitude
      )
    : null;

  const etaMinutes = distanceKm !== null ? Math.max(5, Math.round((distanceKm / 25) * 60)) : null;

  return (
    <View className="flex-1">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Current Location */}
        <Marker
          coordinate={currentLocation}
          title="Your Location"
          description="You are here"
          pinColor="blue"
        />

        {/* Delivery Destination */}
        {activeOrder && (
          <Marker
            coordinate={destinationLocation}
            title="Delivery Location"
            description={`${activeOrder.deliveryAddress.street}, ${activeOrder.deliveryAddress.city}`}
            pinColor="red"
          />
        )}
      </MapView>

      {/* Active Delivery Card */}
      {activeOrder ? (
        <View className="absolute top-14 left-6 right-6 bg-white rounded-xl p-4 shadow-lg border border-gray-200">
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 mb-1">
                Active Delivery
              </Text>
              <Text className="text-sm text-gray-600 mb-1">
                {activeOrder.orderNumber}
              </Text>
              <Text className="text-sm text-gray-700">
                📍 {activeOrder.deliveryAddress.street}
              </Text>
              <Text className="text-sm text-gray-600">
                {activeOrder.deliveryAddress.city}, {activeOrder.deliveryAddress.state}
              </Text>
            </View>
            <View className="bg-primary-100 px-3 py-1 rounded-full">
              <Text className="text-primary-600 text-xs font-semibold uppercase">
                {activeOrder.orderStatus === 'picked_up' ? 'Picked Up' : 'On Delivery'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={openMapsNavigation}
              className="flex-1 bg-primary-600 py-3 rounded-lg items-center mr-2"
            >
              <Text className="text-white font-semibold">🗺️ Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCallCustomer}
              className="flex-1 bg-blue-600 py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">📞 Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="absolute top-14 left-6 right-6 bg-white rounded-xl p-4 shadow-lg border border-gray-200">
          <Text className="text-base font-bold text-gray-900 mb-1">
            No Active Delivery
          </Text>
          <Text className="text-sm text-gray-600">
            Accept an order from the Orders tab to see delivery details here
          </Text>
        </View>
      )}

      {/* Bottom Stats Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-gray-500">Distance</Text>
            <Text className="text-base font-bold text-gray-900">
              {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : '—'}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-gray-500">ETA</Text>
            <Text className="text-base font-bold text-gray-900">
              {etaMinutes !== null ? `${etaMinutes} mins` : '—'}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-gray-500">Delivery Fee</Text>
            <Text className="text-base font-bold text-primary-600">
              {activeOrder ? `₹${DELIVERY_FEE}` : '—'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
