import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Order, Product } from '../../src/types';
import { LOW_STOCK_THRESHOLD } from '../../src/constants';
import { formatCurrency, getGreeting } from '../../src/utils/helpers';
import { StatusPill, PressableScale, SectionHeader, FadeInUp } from '../../src/components/ui';
import { palette, radii, shadows, gradients } from '../../src/theme';

export default function FarmerDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [ordersData, productsData] = await Promise.all([
        SupabaseService.getFarmerOrders(user.id),
        SupabaseService.getFarmerProducts(user.id),
      ]);
      setOrders(ordersData); setProducts(productsData);
    } catch { setOrders([]); setProducts([]); }
    finally { setLoading(false); }
  };
  const handleRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const stats = {
    totalOrders: orders.length,
    activeOrders: orders.filter((o) => ['placed', 'confirmed', 'packed'].includes(o.orderStatus)).length,
    activeProducts: products.filter((p) => p.isAvailable).length,
    totalEarnings: orders.filter((o) => o.orderStatus === 'delivered').reduce((sum, o) => sum + o.total, 0),
  };
  const lowStockProducts = products.filter((p) => p.isAvailable && p.stock <= LOW_STOCK_THRESHOLD);

  const statCards = [
    { icon: 'cube', label: 'Active Orders', value: `${stats.activeOrders}`, color: palette.sky, bg: '#e0f2fe' },
    { icon: 'leaf', label: 'Active Products', value: `${stats.activeProducts}`, color: palette.green600, bg: palette.green50 },
    { icon: 'checkmark-done', label: 'Total Orders', value: `${stats.totalOrders}`, color: palette.violet, bg: '#f3e8ff' },
    { icon: 'wallet', label: 'Earnings', value: formatCurrency(stats.totalEarnings), color: palette.amber600, bg: '#fef3c7' },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <LinearGradient colors={gradients.brand as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 26, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 }}>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' }}>{getGreeting()} 👋</Text>
        <Text style={{ color: palette.white, fontSize: 24, fontWeight: '900' }}>{user?.name || 'Farmer'}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4 }}>Here's how your farm is doing today 🌱</Text>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={palette.green600} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.green600} />} contentContainerStyle={{ padding: 18, paddingBottom: 24 }}>
          {/* Stats */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {statCards.map((s, i) => (
              <FadeInUp key={s.label} delay={i * 70} style={{ width: '48%', marginBottom: 12 } as any}>
                <View style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 16 }, shadows.sm]}>
                  <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Ionicons name={s.icon as any} size={22} color={s.color} />
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: palette.ink }}>{s.value}</Text>
                  <Text style={{ fontSize: 12.5, color: palette.slate400, marginTop: 2 }}>{s.label}</Text>
                </View>
              </FadeInUp>
            ))}
          </View>

          {/* Low stock */}
          {lowStockProducts.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <SectionHeader title="⚠️ Low Stock" action="Manage" onAction={() => router.push('/(farmer)/products')} />
              {lowStockProducts.map((product) => (
                <View key={product.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fffbeb', borderRadius: radii.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#fde68a' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14.5, fontWeight: '800', color: palette.ink }}>{product.name}</Text>
                    <Text style={{ fontSize: 12.5, color: palette.amber600, marginTop: 2 }}>Only {product.stock} {product.unit} left</Text>
                  </View>
                  <PressableScale onPress={() => router.push('/(farmer)/products')}>
                    <View style={{ backgroundColor: palette.amber500, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.pill }}>
                      <Text style={{ color: palette.white, fontSize: 12.5, fontWeight: '800' }}>Restock</Text>
                    </View>
                  </PressableScale>
                </View>
              ))}
            </View>
          )}

          {/* Recent orders */}
          <View style={{ marginTop: 18 }}>
            <SectionHeader title="Recent Orders" action="View All" onAction={() => router.push('/(farmer)/orders')} />
            {orders.slice(0, 5).length === 0 ? (
              <View style={{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 30, alignItems: 'center' }}>
                <Text style={{ fontSize: 34 }}>📦</Text>
                <Text style={{ color: palette.slate400, marginTop: 8, fontSize: 14 }}>No orders yet</Text>
              </View>
            ) : (
              orders.slice(0, 5).map((order) => (
                <View key={order.id} style={[{ backgroundColor: palette.white, borderRadius: radii.lg, padding: 16, marginBottom: 12 }, shadows.sm]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: palette.ink }}>#{order.orderNumber}</Text>
                      <Text style={{ fontSize: 12.5, color: palette.slate400, marginTop: 2 }}>{order.customerName}</Text>
                    </View>
                    <StatusPill status={order.orderStatus as any} size="sm" />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: palette.slate500 }}>{order.items.length} items</Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: palette.green700 }}>{formatCurrency(order.total)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
