import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SupabaseService } from '../../../src/services/supabase';
import { useCart } from '../../../src/contexts/CartContext';
import { Product } from '../../../src/types';
import { formatCurrency } from '../../../src/utils/helpers';
import { Button, IconButton, QuantityStepper, Rating, useToast, FadeInUp, EmptyState } from '../../../src/components/ui';
import { palette, radii, shadows, categoryStyle } from '../../../src/theme';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [fav, setFav] = useState(false);

  useEffect(() => { loadProduct(); }, [id]);

  const loadProduct = async () => {
    try { setLoading(true); setProduct(await SupabaseService.getProduct(id)); }
    catch { toast.show('Failed to load product', 'error'); }
    finally { setLoading(false); }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    toast.show(`${quantity} × ${product.name} added 🛒`, 'success');
    setTimeout(() => router.back(), 500);
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={palette.green600} /></View>;
  }
  if (!product) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.white }}>
        <EmptyState icon="📦" title="Product not found" subtitle="This item may no longer be available">
          <Button label="Go Back" icon="arrow-back" onPress={() => router.back()} />
        </EmptyState>
      </View>
    );
  }

  const cat = categoryStyle(product.category);
  const inStock = product.stock > 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={{ height: 320, backgroundColor: cat.tint, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', top: 52, left: 18, right: 18, flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 }}>
            <IconButton icon="arrow-back" onPress={() => router.back()} />
            <IconButton icon={fav ? 'heart' : 'heart-outline'} color={fav ? palette.coral : palette.ink} onPress={() => { setFav(!fav); toast.show(fav ? 'Removed from favorites' : 'Added to favorites ❤️', fav ? 'info' : 'success'); }} />
          </View>
          <Text style={{ fontSize: 130 }}>{cat.emoji}</Text>
          {product.isOrganic ? (
            <View style={{ position: 'absolute', bottom: 26, flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radii.pill }}>
              <Text style={{ fontSize: 13 }}>🌱</Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: palette.green700, marginLeft: 5 }}>Certified Organic</Text>
            </View>
          ) : null}
        </View>

        {/* Content card */}
        <FadeInUp style={{ marginTop: -22, backgroundColor: palette.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 24, minHeight: 400 } as any}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: 14 }}>
              <Text style={{ fontSize: 25, fontWeight: '900', color: palette.ink, letterSpacing: -0.5 }}>{product.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 14, color: palette.slate500 }}>🧑‍🌾 {product.farmerName}</Text>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: palette.slate300, marginHorizontal: 8 }} />
                <Rating value={4.7} reviews={92} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 26, fontWeight: '900', color: palette.green700 }}>{formatCurrency(product.pricePerUnit)}</Text>
              <Text style={{ fontSize: 12.5, color: palette.slate400 }}>per {product.unit}</Text>
            </View>
          </View>

          {/* Stock badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: inStock ? palette.green50 : '#fee2e2', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.pill, marginTop: 16 }}>
            <Ionicons name={inStock ? 'checkmark-circle' : 'close-circle'} size={15} color={inStock ? palette.green600 : palette.coral} />
            <Text style={{ fontSize: 12.5, fontWeight: '700', color: inStock ? palette.green700 : palette.coral, marginLeft: 5 }}>
              {inStock ? `${product.stock} ${product.unit} in stock` : 'Out of stock'}
            </Text>
          </View>

          {/* Highlights */}
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            {[{ i: '🚚', t: 'Fast\nDelivery' }, { i: '🌾', t: 'Farm\nFresh' }, { i: '💯', t: 'Quality\nAssured' }].map((h) => (
              <View key={h.t} style={{ flex: 1, alignItems: 'center', backgroundColor: palette.slate50, borderRadius: radii.md, paddingVertical: 14, marginRight: 8 }}>
                <Text style={{ fontSize: 22 }}>{h.i}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: palette.slate600, marginTop: 5, textAlign: 'center' }}>{h.t}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          <Text style={{ fontSize: 17, fontWeight: '800', color: palette.ink, marginTop: 24, marginBottom: 8 }}>About this product</Text>
          <Text style={{ fontSize: 14.5, color: palette.slate500, lineHeight: 23 }}>
            {product.description || 'Fresh produce from local farmers. Organic and pesticide-free, harvested at peak ripeness and delivered straight to your door.'}
          </Text>

          {/* Farmer card */}
          <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.green50, borderRadius: radii.lg, padding: 16, marginTop: 22 }]}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: palette.green100, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 26 }}>🧑‍🌾</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: palette.ink }}>{product.farmerName}</Text>
              <Text style={{ fontSize: 12.5, color: palette.slate500, marginTop: 2 }}>Verified local farmer • Supporting fair trade</Text>
            </View>
            <Ionicons name="shield-checkmark" size={22} color={palette.green600} />
          </View>
        </FadeInUp>
      </ScrollView>

      {/* Sticky add-to-cart bar */}
      {inStock && (
        <View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: palette.white, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 26, flexDirection: 'row', alignItems: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24 }, shadows.lg]}>
          <QuantityStepper value={quantity} onChange={(v) => setQuantity(Math.min(product.stock, v))} />
          <View style={{ flex: 1, marginHorizontal: 14 }}>
            <Button label={`Add · ${formatCurrency(product.pricePerUnit * quantity)}`} icon="cart" onPress={handleAddToCart} />
          </View>
        </View>
      )}
    </View>
  );
}
