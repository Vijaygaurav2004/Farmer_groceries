import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { SupabaseService } from '../../src/services/supabase';
import { Product, ProductCategory } from '../../src/types';
import { CATEGORIES, LOW_STOCK_THRESHOLD, SUCCESS_MESSAGES } from '../../src/constants';
import { formatCurrency } from '../../src/utils/helpers';
import { Button, Input, Chip, PressableScale, EmptyState, useToast, FadeInUp } from '../../src/components/ui';
import { palette, radii, shadows, categoryStyle } from '../../src/theme';

const categories = CATEGORIES.map((c) => ({ id: c.id as ProductCategory, label: c.label, icon: c.icon }));
const UNITS = ['kg', 'piece', 'dozen', 'liter'] as const;

export default function FarmerProductsScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', category: 'vegetables' as ProductCategory, pricePerUnit: '', stock: '', unit: 'kg' as typeof UNITS[number], isOrganic: false });

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    if (!user) return;
    try { setLoading(true); setProducts(await SupabaseService.getFarmerProducts(user.id)); }
    catch { setProducts([]); }
    finally { setLoading(false); }
  };
  const handleRefresh = async () => { setRefreshing(true); await loadProducts(); setRefreshing(false); };

  const handleAddProduct = async () => {
    if (!user) return;
    if (!formData.name || !formData.pricePerUnit || !formData.stock) return toast.show('Please fill all required fields', 'error');
    setSaving(true);
    try {
      await SupabaseService.createProduct({
        farmerId: user.id, farmerName: user.name || 'Farmer', name: formData.name, description: formData.description,
        category: formData.category, images: [], unit: formData.unit, pricePerUnit: parseFloat(formData.pricePerUnit),
        stock: parseFloat(formData.stock), harvestDate: new Date(), isOrganic: formData.isOrganic, isAvailable: true,
      });
      toast.show(SUCCESS_MESSAGES.productAdded, 'success');
      setShowAddModal(false);
      setFormData({ name: '', description: '', category: 'vegetables', pricePerUnit: '', stock: '', unit: 'kg', isOrganic: false });
      loadProducts();
    } catch { toast.show('Failed to add product', 'error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (productId: string, isAvailable: boolean) => {
    try { await SupabaseService.updateProduct(productId, { isAvailable: !isAvailable }); loadProducts(); }
    catch { toast.show('Failed to update', 'error'); }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <View style={{ flex: 1, backgroundColor: palette.slate50 }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 18, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 26, fontWeight: '900', color: palette.ink }}>My Products</Text>
          <PressableScale onPress={() => setShowAddModal(true)}>
            <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.green600, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.pill }, shadows.sm]}>
              <Ionicons name="add" size={18} color={palette.white} />
              <Text style={{ color: palette.white, fontWeight: '800', fontSize: 13.5, marginLeft: 3 }}>Add</Text>
            </View>
          </PressableScale>
        </View>
        {products.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, borderRadius: radii.md, paddingHorizontal: 14, height: 46 }}>
            <Ionicons name="search" size={18} color={palette.slate400} />
            <TextInput style={{ flex: 1, marginLeft: 10, fontSize: 14.5, color: palette.ink, height: '100%' }} placeholder="Search products..." placeholderTextColor={palette.slate400} value={searchQuery} onChangeText={setSearchQuery} />
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={palette.green600} /></View>
      ) : products.length === 0 ? (
        <EmptyState icon="🌾" title="No products yet" subtitle="Add your first product to start selling">
          <Button label="Add Product" icon="add" onPress={() => setShowAddModal(true)} />
        </EmptyState>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.green600} />} contentContainerStyle={{ padding: 18, paddingBottom: 24 }}>
          {filteredProducts.map((product) => {
            const cat = categoryStyle(product.category);
            const low = product.stock <= LOW_STOCK_THRESHOLD;
            return (
              <FadeInUp key={product.id} style={[{ flexDirection: 'row', backgroundColor: palette.white, borderRadius: radii.lg, padding: 12, marginBottom: 12 }, shadows.sm] as any}>
                <View style={{ width: 68, height: 68, borderRadius: 14, backgroundColor: cat.tint, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 32 }}>{cat.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: palette.ink, flex: 1 }} numberOfLines={1}>{product.name}</Text>
                    {product.isOrganic ? <Text style={{ fontSize: 12 }}>🌱</Text> : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: '800', color: palette.green700 }}>{formatCurrency(product.pricePerUnit)}/{product.unit}</Text>
                    <Text style={{ fontSize: 12.5, color: low ? palette.amber600 : palette.slate400, marginLeft: 10, fontWeight: low ? '700' : '400' }}>{low ? '⚠️ ' : ''}Stock: {product.stock}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <View style={{ backgroundColor: product.isAvailable ? palette.green50 : palette.slate100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill }}>
                      <Text style={{ fontSize: 11.5, fontWeight: '800', color: product.isAvailable ? palette.green700 : palette.slate500 }}>{product.isAvailable ? 'Available' : 'Hidden'}</Text>
                    </View>
                    <Switch value={product.isAvailable} onValueChange={() => handleToggle(product.id, product.isAvailable)} trackColor={{ true: palette.green400, false: palette.slate200 }} thumbColor={palette.white} />
                  </View>
                </View>
              </FadeInUp>
            );
          })}
        </ScrollView>
      )}

      {/* Add product modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.5)' }}>
          <View style={{ backgroundColor: palette.slate50, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: palette.ink }}>Add Product</Text>
              <PressableScale onPress={() => setShowAddModal(false)} scaleTo={0.85}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: palette.slate100, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={20} color={palette.slate500} />
                </View>
              </PressableScale>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 34 }}>
              <Input label="Product Name *" icon="pricetag-outline" placeholder="e.g., Fresh Tomatoes" value={formData.name} onChangeText={(t) => setFormData({ ...formData, name: t })} />
              <Input label="Description" icon="document-text-outline" placeholder="Describe your product" value={formData.description} onChangeText={(t) => setFormData({ ...formData, description: t })} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: palette.slate700, marginBottom: 8 }}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {categories.map((c) => <Chip key={c.id} label={c.label} emoji={c.icon} active={formData.category === c.id} onPress={() => setFormData({ ...formData, category: c.id })} />)}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><Input label="Price *" icon="cash-outline" placeholder="0" keyboardType="decimal-pad" value={formData.pricePerUnit} onChangeText={(t) => setFormData({ ...formData, pricePerUnit: t })} /></View>
                <View style={{ flex: 1 }}><Input label="Stock *" icon="cube-outline" placeholder="0" keyboardType="decimal-pad" value={formData.stock} onChangeText={(t) => setFormData({ ...formData, stock: t })} /></View>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: palette.slate700, marginBottom: 8 }}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {UNITS.map((u) => <Chip key={u} label={u} active={formData.unit === u} onPress={() => setFormData({ ...formData, unit: u })} />)}
              </ScrollView>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.white, borderRadius: radii.md, padding: 14, marginBottom: 20 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: palette.ink }}>Organic Product 🌱</Text>
                <Switch value={formData.isOrganic} onValueChange={(v) => setFormData({ ...formData, isOrganic: v })} trackColor={{ true: palette.green400, false: palette.slate200 }} thumbColor={palette.white} />
              </View>
              <Button label="Add Product" icon="checkmark" loading={saving} onPress={handleAddProduct} size="lg" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
