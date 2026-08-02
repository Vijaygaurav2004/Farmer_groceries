import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../src/contexts/CartContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, MIN_ORDER_VALUE, SUCCESS_MESSAGES } from '../../src/constants';
import { formatCurrency, validatePincode } from '../../src/utils/helpers';
import { Button, Input, IconButton, PressableScale, useToast, Divider } from '../../src/components/ui';
import { palette, radii, shadows } from '../../src/theme';

type PaymentMethod = 'cod' | 'upi' | 'card';
const paymentOptions: { id: PaymentMethod; name: string; emoji: string; description: string }[] = [
  { id: 'cod', name: 'Cash on Delivery', emoji: '💵', description: 'Pay when you receive' },
  { id: 'upi', name: 'UPI', emoji: '📱', description: 'GPay, PhonePe, Paytm & more' },
  { id: 'card', name: 'Credit / Debit Card', emoji: '💳', description: 'Visa, Mastercard, RuPay' },
];

export default function PaymentScreen() {
  const router = useRouter();
  const { cart, clearCart, cartTotal } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({ street: '', city: '', state: '', pincode: '' });

  const deliveryFee = cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = cartTotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!user) { toast.show('Please login to place an order', 'error'); return router.replace('/(auth)/login'); }
    if (cart.length === 0) { toast.show('Your cart is empty', 'error'); return router.back(); }
    if (cartTotal < MIN_ORDER_VALUE) return toast.show(`Add ${formatCurrency(MIN_ORDER_VALUE - cartTotal)} more to continue`, 'error');
    if (!address.street || !address.city || !address.state || !address.pincode) return toast.show('Please fill in all address fields', 'error');
    if (!validatePincode(address.pincode)) return toast.show('Enter a valid 6-digit pincode', 'error');

    setLoading(true);
    try {
      const ordersByFarmer = cart.reduce((acc, item) => {
        (acc[item.farmerId] = acc[item.farmerId] || []).push(item);
        return acc;
      }, {} as Record<string, typeof cart>);

      const orderPromises = Object.entries(ordersByFarmer).map(([farmerId, items]) => {
        const subtotal = items.reduce((sum, item) => sum + item.product.pricePerUnit * item.quantity, 0);
        return SupabaseService.createOrder({
          orderNumber: `ORD${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          customerId: user.id, customerName: user.name || 'Customer', farmerId, farmerName: items[0].product.farmerName,
          items: items.map((item) => ({
            productId: item.productId, productName: item.product.name, productImage: item.product.images[0] || '',
            quantity: item.quantity, unit: item.product.unit, pricePerUnit: item.product.pricePerUnit,
            total: item.product.pricePerUnit * item.quantity,
          })),
          subtotal, deliveryFee, total: subtotal + deliveryFee,
          deliveryAddress: { id: 'default', label: 'Home', street: address.street, city: address.city, state: address.state, pincode: address.pincode, latitude: 0, longitude: 0, isDefault: true },
          paymentMethod: selectedMethod, paymentStatus: selectedMethod === 'cod' ? 'pending' : 'paid',
          orderStatus: 'placed', statusHistory: [{ status: 'placed', timestamp: new Date() }],
        });
      });

      await Promise.all(orderPromises);
      clearCart();
      toast.show(SUCCESS_MESSAGES.orderPlaced + ' 🎉', 'success');
      setTimeout(() => router.replace('/(customer)/orders'), 700);
    } catch {
      toast.show('Could not place order. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingHorizontal: 18, paddingBottom: 14 }}>
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <Text style={{ fontSize: 21, fontWeight: '900', color: palette.ink, marginLeft: 14 }}>Checkout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}>
        {/* Order summary */}
        <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 18, marginBottom: 20 }, shadows.sm]}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: palette.ink, marginBottom: 14 }}>Order Summary</Text>
          <Row label="Subtotal" value={formatCurrency(cartTotal)} />
          <Row label="Delivery Fee" value={deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)} valueColor={deliveryFee === 0 ? palette.green600 : palette.ink} />
          <Divider style={{ marginVertical: 12 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: palette.ink }}>Total</Text>
            <Text style={{ fontSize: 19, fontWeight: '900', color: palette.green700 }}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Payment methods */}
        <Text style={{ fontSize: 16, fontWeight: '800', color: palette.ink, marginBottom: 12 }}>Payment Method</Text>
        {paymentOptions.map((option) => {
          const active = selectedMethod === option.id;
          return (
            <PressableScale key={option.id} onPress={() => setSelectedMethod(option.id)} scaleTo={0.98} style={{ marginBottom: 12 }}>
              <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, borderRadius: radii.lg, padding: 14, borderWidth: 2, borderColor: active ? palette.green500 : 'transparent' }, active ? shadows.md : shadows.sm]}>
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: palette.slate50, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{option.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: palette.ink }}>{option.name}</Text>
                  <Text style={{ fontSize: 12.5, color: palette.slate400, marginTop: 2 }}>{option.description}</Text>
                </View>
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: active ? palette.green600 : palette.slate200, backgroundColor: active ? palette.green600 : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {active ? <Ionicons name="checkmark" size={15} color={palette.white} /> : null}
                </View>
              </View>
            </PressableScale>
          );
        })}

        {/* Delivery address */}
        <Text style={{ fontSize: 16, fontWeight: '800', color: palette.ink, marginTop: 12, marginBottom: 12 }}>📍 Delivery Address</Text>
        <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 16 }, shadows.sm]}>
          <Input label="Street Address" icon="home-outline" placeholder="House no, street, area" value={address.street} onChangeText={(t) => setAddress({ ...address, street: t })} />
          <Input label="City" icon="business-outline" placeholder="City" value={address.city} onChangeText={(t) => setAddress({ ...address, city: t })} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1.4 }}>
              <Input label="State" placeholder="State" value={address.state} onChangeText={(t) => setAddress({ ...address, state: t })} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Pincode" placeholder="6 digits" keyboardType="numeric" maxLength={6} value={address.pincode} onChangeText={(t) => setAddress({ ...address, pincode: t })} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place order */}
      <View style={[{ backgroundColor: palette.white, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, shadows.lg]}>
        <Button label={`Place Order · ${formatCurrency(total)}`} icon="bag-check" loading={loading} onPress={handlePlaceOrder} size="lg" />
      </View>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, valueColor = palette.ink }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ fontSize: 14, color: palette.slate500 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: valueColor }}>{value}</Text>
    </View>
  );
}
