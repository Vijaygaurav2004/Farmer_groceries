import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCart } from '../../src/contexts/CartContext';
import { SupabaseService } from '../../src/services/supabase';
import { Product, ProductCategory, Farmer } from '../../src/types';
import { CATEGORIES, SORT_OPTIONS, SortOptionId, DEFAULT_COORDINATES } from '../../src/constants';
import { formatCurrency, getGreeting } from '../../src/utils/helpers';
import { Chip, IconButton, PressableScale, ProductCardSkeleton, EmptyState, useToast, FadeInUp } from '../../src/components/ui';
import { palette, radii, shadows, gradients, categoryStyle } from '../../src/theme';

const categories = CATEGORIES.map((c) => ({ id: c.id as ProductCategory, label: c.label, icon: c.icon }));

function ProductCard({ product, added, favorite, onOpen, onAdd, onFav }: {
  product: Product; added: boolean; favorite: boolean;
  onOpen: () => void; onAdd: () => void; onFav: () => void;
}) {
  const cat = categoryStyle(product.category);
  return (
    <View style={{ width: '48%', marginBottom: 16 }}>
      <PressableScale onPress={onOpen} scaleTo={0.97}>
      <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, overflow: 'hidden' }, shadows.sm]}>
        <View style={{ height: 128, backgroundColor: cat.tint, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 56 }}>{cat.emoji}</Text>
          {product.isOrganic ? (
            <View style={{ position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill }}>
              <Text style={{ fontSize: 10 }}>🌱</Text>
              <Text style={{ fontSize: 10, fontWeight: '800', color: palette.green700, marginLeft: 3 }}>Organic</Text>
            </View>
          ) : null}
          <PressableScale onPress={onFav} scaleTo={0.8} style={{ position: 'absolute', top: 6, right: 6 }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={16} color={favorite ? palette.coral : palette.slate400} />
            </View>
          </PressableScale>
        </View>
        <View style={{ padding: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: palette.ink }} numberOfLines={1}>{product.name}</Text>
          <Text style={{ fontSize: 11.5, color: palette.slate400, marginTop: 2 }} numberOfLines={1}>🧑‍🌾 {product.farmerName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '900', color: palette.green700 }}>{formatCurrency(product.pricePerUnit)}</Text>
              <Text style={{ fontSize: 10.5, color: palette.slate400 }}>per {product.unit}</Text>
            </View>
            <PressableScale onPress={onAdd} scaleTo={0.85}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: added ? palette.green700 : palette.green600, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={added ? 'checkmark' : 'add'} size={22} color={palette.white} />
              </View>
            </PressableScale>
          </View>
        </View>
      </View>
      </PressableScale>
    </View>
  );
}

export default function CustomerHomeScreen() {
  const { user } = useAuth();
  const { cartCount, addToCart } = useCart();
  const router = useRouter();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [sortBy, setSortBy] = useState<SortOptionId>('default');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const productsData = selectedCategory
        ? await SupabaseService.getProductsByCategory(selectedCategory)
        : await SupabaseService.getAllProducts(50);
      setProducts(productsData);
      try {
        const farmersData = await SupabaseService.getNearbyFarmers(DEFAULT_COORDINATES.latitude, DEFAULT_COORDINATES.longitude, 100);
        setFarmers(farmersData.slice(0, 5));
      } catch { setFarmers([]); }
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  const handleRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleAddToCart = (product: Product) => {
    if (!product.isAvailable || product.stock <= 0) return toast.show('This product is out of stock', 'error');
    addToCart(product, 1);
    setAddedProducts((p) => new Set(p).add(product.id));
    setTimeout(() => setAddedProducts((p) => { const n = new Set(p); n.delete(product.id); return n; }), 1400);
    toast.show(`${product.name} added to cart`, 'success');
  };

  const toggleFav = (product: Product) => {
    setFavorites((p) => {
      const n = new Set(p);
      if (n.has(product.id)) { n.delete(product.id); toast.show('Removed from favorites', 'info'); }
      else { n.add(product.id); toast.show('Added to favorites ❤️', 'success'); }
      return n;
    });
  };

  const filteredProducts = products
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((p) => !organicOnly || p.isOrganic)
    .sort((a, b) => (sortBy === 'price_asc' ? a.pricePerUnit - b.pricePerUnit : sortBy === 'price_desc' ? b.pricePerUnit - a.pricePerUnit : 0));

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      {/* Header */}
      <LinearGradient colors={gradients.brand as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 54, paddingHorizontal: 18, paddingBottom: 26, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' }}>{getGreeting()} 👋</Text>
            <Text style={{ color: palette.white, fontSize: 24, fontWeight: '900', letterSpacing: -0.4 }} numberOfLines={1}>
              {user?.name || 'Guest'}
            </Text>
          </View>
          <IconButton icon="cart-outline" badge={cartCount} onPress={() => router.push('/(customer)/cart')} />
        </View>
        {/* Search */}
        <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, borderRadius: radii.md, paddingHorizontal: 14, height: 50, marginTop: 18 }, shadows.md]}>
          <Ionicons name="search" size={19} color={palette.slate400} />
          <TextInput
            style={{ flex: 1, marginLeft: 10, fontSize: 15, color: palette.ink, height: '100%' }}
            placeholder="Search fresh produce..."
            placeholderTextColor={palette.slate400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <PressableScale onPress={() => setSearchQuery('')} scaleTo={0.8}>
              <Ionicons name="close-circle" size={19} color={palette.slate300} />
            </PressableScale>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.green600} />} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Promo banner */}
        <FadeInUp style={{ paddingHorizontal: 18, paddingTop: 18 } as any}>
          <LinearGradient colors={gradients.sunrise as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ borderRadius: radii.lg, padding: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }, shadows.md]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.white, fontSize: 17, fontWeight: '900' }}>Free delivery over ₹500</Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12.5, marginTop: 4 }}>Fresh from farm, straight to your kitchen 🌾</Text>
            </View>
            <Text style={{ fontSize: 46 }}>🚚</Text>
          </LinearGradient>
        </FadeInUp>

        {/* Categories */}
        <View style={{ paddingTop: 22 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: palette.ink, marginBottom: 12, paddingHorizontal: 18 }}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18 }}>
            <Chip label="All" active={!selectedCategory} onPress={() => setSelectedCategory(null)} />
            {categories.map((c) => (
              <Chip key={c.id} label={c.label} emoji={c.icon} active={selectedCategory === c.id} onPress={() => setSelectedCategory(c.id)} />
            ))}
          </ScrollView>
        </View>

        {/* Sort & Filter */}
        <View style={{ paddingTop: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: palette.ink, marginBottom: 12, paddingHorizontal: 18 }}>Sort & Filter</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18 }}>
            <Chip label="Organic" emoji="🌱" active={organicOnly} onPress={() => setOrganicOnly(!organicOnly)} />
            {SORT_OPTIONS.map((o) => (
              <Chip key={o.id} label={o.label} active={sortBy === o.id} onPress={() => setSortBy(o.id)} />
            ))}
          </ScrollView>
        </View>

        {/* Verified Farmers */}
        {farmers.length > 0 && (
          <View style={{ paddingTop: 22 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: palette.ink, marginBottom: 12, paddingHorizontal: 18 }}>Verified Farmers ✅</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18 }}>
              {farmers.map((farmer) => (
                <View key={farmer.id} style={[{ width: 156, backgroundColor: palette.white, borderRadius: radii.lg, padding: 14, marginRight: 12, alignItems: 'center' }, shadows.sm]}>
                  <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: palette.green100, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 30 }}>🧑‍🌾</Text>
                  </View>
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.ink, textAlign: 'center' }} numberOfLines={1}>{farmer.farmName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                    <Ionicons name="star" size={12} color={palette.amber500} />
                    <Text style={{ fontSize: 12, color: palette.slate500, marginLeft: 3, fontWeight: '600' }}>{farmer.rating.toFixed(1)} ({farmer.totalReviews})</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Products */}
        <View style={{ paddingTop: 22, paddingHorizontal: 18 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: palette.ink, marginBottom: 14 }}>
            {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.label : 'Fresh Produce'} 🧺
          </Text>

          {loading ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {[0, 1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)}
            </View>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={searchQuery || organicOnly ? '🔍' : '📦'}
              title={searchQuery ? `No results for "${searchQuery}"` : organicOnly ? 'No organic matches' : 'No products yet'}
              subtitle={searchQuery || organicOnly ? 'Try adjusting your filters' : 'Check back soon for fresh produce'}
            />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  added={addedProducts.has(product.id)}
                  favorite={favorites.has(product.id)}
                  onOpen={() => router.push(`/(customer)/product/${product.id}`)}
                  onAdd={() => handleAddToCart(product)}
                  onFav={() => toggleFav(product)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
