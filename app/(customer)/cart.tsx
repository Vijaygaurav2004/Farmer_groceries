import React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../src/contexts/CartContext';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, MIN_ORDER_VALUE } from '../../src/constants';
import { formatCurrency } from '../../src/utils/helpers';
import { Button, QuantityStepper, PressableScale, EmptyState, useToast, FadeInUp, Divider } from '../../src/components/ui';
import { palette, radii, shadows, categoryStyle } from '../../src/theme';

export default function CartScreen() {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();
  const router = useRouter();
  const toast = useToast();

  const qualifiesForFreeDelivery = cartTotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = qualifiesForFreeDelivery ? 0 : DELIVERY_FEE;
  const total = cartTotal + deliveryFee;
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);
  const progress = Math.min(1, cartTotal / FREE_DELIVERY_THRESHOLD);

  const handleCheckout = () => {
    if (cart.length === 0) return toast.show('Your cart is empty', 'error');
    if (cartTotal < MIN_ORDER_VALUE)
      return toast.show(`Add ${formatCurrency(MIN_ORDER_VALUE - cartTotal)} more to checkout`, 'error');
    router.push('/(customer)/payment');
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { clearCart(); toast.show('Cart cleared', 'info'); } },
    ]);
  };

  if (cart.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
        <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 26, fontWeight: '900', color: palette.ink }}>My Cart</Text>
        </View>
        <EmptyState icon="🛒" title="Your cart is empty" subtitle="Add some fresh produce to get started">
          <Button label="Start Shopping" icon="storefront-outline" onPress={() => router.push('/(customer)/home')} />
        </EmptyState>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 26, fontWeight: '900', color: palette.ink }}>My Cart <Text style={{ fontSize: 16, color: palette.slate400 }}>({cartCount})</Text></Text>
        <PressableScale onPress={handleClearCart}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="trash-outline" size={15} color={palette.coral} />
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: palette.coral, marginLeft: 4 }}>Clear</Text>
          </View>
        </PressableScale>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 20 }}>
        {/* Free delivery progress */}
        <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 16, marginBottom: 16 }, shadows.sm]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 18 }}>{qualifiesForFreeDelivery ? '🎉' : '🚚'}</Text>
            <Text style={{ fontSize: 13.5, fontWeight: '700', color: palette.slate700, marginLeft: 8, flex: 1 }}>
              {qualifiesForFreeDelivery ? 'You unlocked FREE delivery!' : `Add ${formatCurrency(amountToFreeDelivery)} more for free delivery`}
            </Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: palette.slate100, overflow: 'hidden' }}>
            <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 4, backgroundColor: qualifiesForFreeDelivery ? palette.green500 : palette.amber500 }} />
          </View>
        </View>

        {/* Items */}
        {cart.map((item) => {
          const cat = categoryStyle(item.product.category);
          return (
            <FadeInUp key={item.productId} style={[{ flexDirection: 'row', backgroundColor: palette.white, borderRadius: radii.lg, padding: 12, marginBottom: 12 }, shadows.sm] as any}>
              <View style={{ width: 72, height: 72, borderRadius: 14, backgroundColor: cat.tint, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 34 }}>{cat.emoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.ink }} numberOfLines={1}>{item.product.name}</Text>
                    <Text style={{ fontSize: 12, color: palette.slate400, marginTop: 2 }}>🧑‍🌾 {item.product.farmerName}</Text>
                  </View>
                  <PressableScale onPress={() => { removeFromCart(item.productId); toast.show('Item removed', 'info'); }} scaleTo={0.8}>
                    <Ionicons name="close" size={18} color={palette.slate400} />
                  </PressableScale>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: palette.green700 }}>{formatCurrency(item.product.pricePerUnit * item.quantity)}</Text>
                  <QuantityStepper compact value={item.quantity} onChange={(v) => updateQuantity(item.productId, v)} />
                </View>
              </View>
            </FadeInUp>
          );
        })}

        {/* Bill summary */}
        <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 18, marginTop: 4 }, shadows.sm]}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: palette.ink, marginBottom: 14 }}>Bill Summary</Text>
          <Row label="Subtotal" value={formatCurrency(cartTotal)} />
          <Row label="Delivery Fee" value={qualifiesForFreeDelivery ? 'FREE' : formatCurrency(deliveryFee)} valueColor={qualifiesForFreeDelivery ? palette.green600 : palette.ink} />
          <Divider style={{ marginVertical: 12 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: palette.ink }}>Total</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: palette.green700 }}>{formatCurrency(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky checkout */}
      <View style={[{ backgroundColor: palette.white, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, shadows.lg]}>
        <Button label={`Proceed to Payment · ${formatCurrency(total)}`} iconRight="arrow-forward" size="lg" onPress={handleCheckout} />
      </View>
    </View>
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
