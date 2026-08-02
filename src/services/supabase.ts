import { supabase, isSupabaseConfigured } from '../config/supabase';
import { localStore } from './localStore';
import { storageService } from './storage';
import { 
  User, 
  UserRole, 
  Product, 
  Order, 
  Review, 
  Farmer,
  Customer,
  DeliveryPartner,
  Subscription,
  Delivery
} from '../types';

export class SupabaseService {
  // Authentication
  static async signUp(email: string, password: string): Promise<any> {
    if (!isSupabaseConfigured) {
      // Offline mode - issue a local identity
      return {
        user: {
          id: `local_${Date.now()}`,
          email,
          created_at: new Date().toISOString(),
        },
      };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  static async signIn(email: string, password: string): Promise<any> {
    if (!isSupabaseConfigured) {
      // Offline mode - resolve the local identity
      return {
        user: {
          id: `local_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
          created_at: new Date().toISOString(),
        },
      };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  static async signOut(): Promise<void> {
    if (!isSupabaseConfigured) {
      // Offline mode - nothing to revoke remotely
      return;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async resetPassword(email: string): Promise<void> {
    if (!isSupabaseConfigured) {
      // Offline mode - nothing to send
      return;
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  static async getSession() {
    if (!isSupabaseConfigured) {
      // Offline mode - there is no remote session
      return null;
    }
    
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  static onAuthStateChange(callback: (session: any) => void) {
    if (!isSupabaseConfigured) {
      // Offline mode - no remote auth events; hand back a no-op subscription
      setTimeout(() => callback(null), 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    }
    
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  }

  // User Management
  static async createUser(userId: string, data: Partial<User>): Promise<void> {
    if (!isSupabaseConfigured) {
      // Offline mode - persist to AsyncStorage so getUser can read it back
      await storageService.saveUser({
        id: userId,
        email: data.email || '',
        role: data.role,
        name: data.name,
        phoneNumber: data.phoneNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User);
      return;
    }

    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: data.email,
        name: data.name,
        role: data.role,
        phone_number: data.phoneNumber,
        profile_image: data.profileImage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  static async getUser(userId: string): Promise<User | null> {
    if (!isSupabaseConfigured) {
      // Offline mode - read from AsyncStorage
      const cached = await storageService.getUser();
      return cached && cached.id === userId ? cached : null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      email: data.email,
      role: data.role,
      name: data.name,
      profileImage: data.profile_image,
      phoneNumber: data.phone_number,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    } as User;
  }

  static async updateUser(userId: string, data: Partial<User>): Promise<void> {
    if (!isSupabaseConfigured) {
      // Offline mode - merge into the AsyncStorage user
      const cached = await storageService.getUser();
      if (cached && cached.id === userId) {
        await storageService.saveUser({ ...cached, ...data, updatedAt: new Date() });
      }
      return;
    }

    const updateData: any = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    // Convert camelCase to snake_case for database
    if (data.profileImage) {
      updateData.profile_image = data.profileImage;
      delete updateData.profileImage;
    }
    if (data.phoneNumber) {
      updateData.phone_number = data.phoneNumber;
      delete updateData.phoneNumber;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);
    
    if (error) throw error;
  }

  // Farmer Management
  static async createFarmerProfile(userId: string, data: Partial<Farmer>): Promise<void> {
    if (!isSupabaseConfigured) {
      // Offline mode - farmer data lives on the stored user; nothing extra to create
      return;
    }

    const { error } = await supabase
      .from('farmers')
      .insert({
        id: userId,
        farm_name: data.farmName,
        farm_address: data.farmAddress,
        verification_status: 'pending',
        verification_documents: data.verificationDocuments || [],
        rating: 0,
        total_reviews: 0,
        bio: data.bio,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (error) throw error;
  }

  static async getFarmer(farmerId: string): Promise<Farmer | null> {
    if (!isSupabaseConfigured) {
      return localStore.getFarmer(farmerId);
    }

    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('id', farmerId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    if (!data) return null;
    
    // Get user data as well
    const user = await this.getUser(farmerId);
    if (!user) return null;
    
    return {
      ...user,
      role: 'farmer',
      farmName: data.farm_name,
      farmAddress: data.farm_address,
      verificationStatus: data.verification_status,
      verificationDocuments: data.verification_documents,
      rating: data.rating,
      totalReviews: data.total_reviews,
      bio: data.bio,
    } as Farmer;
  }

  static async getNearbyFarmers(latitude: number, longitude: number, radiusKm: number = 50): Promise<Farmer[]> {
    if (!isSupabaseConfigured) {
      return localStore.getFarmers();
    }

    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('verification_status', 'verified')
      .limit(10);
    
    if (error) throw error;
    
    const farmers: Farmer[] = [];
    
    for (const farmerData of data || []) {
      const user = await this.getUser(farmerData.id);
      if (user) {
        farmers.push({
          ...user,
          role: 'farmer',
          farmName: farmerData.farm_name,
          farmAddress: farmerData.farm_address,
          verificationStatus: farmerData.verification_status,
          verificationDocuments: farmerData.verification_documents || [],
          rating: farmerData.rating || 0,
          totalReviews: farmerData.total_reviews || 0,
          bio: farmerData.bio,
        } as Farmer);
      }
    }
    
    return farmers;
  }

  // Product Management
  static async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!isSupabaseConfigured) {
      const id = `product_${Date.now()}`;
      await localStore.addProduct({ ...data, id, createdAt: new Date(), updatedAt: new Date() });
      return id;
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        farmer_id: data.farmerId,
        farmer_name: data.farmerName,
        name: data.name,
        description: data.description,
        category: data.category,
        images: data.images,
        unit: data.unit,
        price_per_unit: data.pricePerUnit,
        stock: data.stock,
        harvest_date: data.harvestDate.toISOString(),
        is_organic: data.isOrganic,
        is_available: data.isAvailable,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return product.id;
  }

  static async getProduct(productId: string): Promise<Product | null> {
    if (!isSupabaseConfigured) {
      return localStore.getProduct(productId);
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      farmerId: data.farmer_id,
      farmerName: data.farmer_name,
      name: data.name,
      description: data.description,
      category: data.category,
      images: data.images,
      unit: data.unit,
      pricePerUnit: data.price_per_unit,
      stock: data.stock,
      harvestDate: new Date(data.harvest_date),
      isOrganic: data.is_organic,
      isAvailable: data.is_available,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    } as Product;
  }

  static async getFarmerProducts(farmerId: string): Promise<Product[]> {
    if (!isSupabaseConfigured) {
      return localStore.getFarmerProducts();
    }

    // Farmer's own inventory - include unavailable products so they can be toggled back
    const { data, error} = await supabase
      .from('products')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      farmerId: item.farmer_id,
      farmerName: item.farmer_name,
      name: item.name,
      description: item.description,
      category: item.category,
      images: item.images || [],
      unit: item.unit,
      pricePerUnit: item.price_per_unit,
      stock: item.stock,
      harvestDate: new Date(item.harvest_date),
      isOrganic: item.is_organic,
      isAvailable: item.is_available,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  static async getAllProducts(limit: number = 50): Promise<Product[]> {
    if (!isSupabaseConfigured) {
      return localStore.getAvailableProducts();
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      farmerId: item.farmer_id,
      farmerName: item.farmer_name,
      name: item.name,
      description: item.description,
      category: item.category,
      images: item.images || [],
      unit: item.unit,
      pricePerUnit: item.price_per_unit,
      stock: item.stock,
      harvestDate: new Date(item.harvest_date),
      isOrganic: item.is_organic,
      isAvailable: item.is_available,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  static async getProductsByCategory(category: string): Promise<Product[]> {
    if (!isSupabaseConfigured) {
      return localStore.getAvailableProducts(category);
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      farmerId: item.farmer_id,
      farmerName: item.farmer_name,
      name: item.name,
      description: item.description,
      category: item.category,
      images: item.images || [],
      unit: item.unit,
      pricePerUnit: item.price_per_unit,
      stock: item.stock,
      harvestDate: new Date(item.harvest_date),
      isOrganic: item.is_organic,
      isAvailable: item.is_available,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  static async updateProduct(productId: string, data: Partial<Product>): Promise<void> {
    if (!isSupabaseConfigured) {
      return localStore.updateProduct(productId, data);
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    // Convert camelCase to snake_case
    if (data.farmerId) updateData.farmer_id = data.farmerId;
    if (data.farmerName) updateData.farmer_name = data.farmerName;
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.category) updateData.category = data.category;
    if (data.images) updateData.images = data.images;
    if (data.unit) updateData.unit = data.unit;
    if (data.pricePerUnit !== undefined) updateData.price_per_unit = data.pricePerUnit;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.harvestDate) updateData.harvest_date = data.harvestDate.toISOString();
    if (data.isOrganic !== undefined) updateData.is_organic = data.isOrganic;
    if (data.isAvailable !== undefined) updateData.is_available = data.isAvailable;
    
    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);
    
    if (error) throw error;
  }

  static async deleteProduct(productId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      return localStore.deleteProduct(productId);
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) throw error;
  }

  // Order Management
  static async createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!isSupabaseConfigured) {
      return localStore.createOrder(data);
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        order_number: data.orderNumber,
        customer_id: data.customerId,
        customer_name: data.customerName,
        farmer_id: data.farmerId,
        farmer_name: data.farmerName,
        delivery_partner_id: data.deliveryPartnerId,
        items: data.items,
        subtotal: data.subtotal,
        delivery_fee: data.deliveryFee,
        total: data.total,
        delivery_address: data.deliveryAddress,
        payment_method: data.paymentMethod,
        payment_status: data.paymentStatus,
        order_status: data.orderStatus,
        status_history: data.statusHistory,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return order.id;
  }

  static async getOrder(orderId: string): Promise<Order | null> {
    if (!isSupabaseConfigured) {
      return localStore.getOrder(orderId);
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      orderNumber: data.order_number,
      customerId: data.customer_id,
      customerName: data.customer_name,
      farmerId: data.farmer_id,
      farmerName: data.farmer_name,
      deliveryPartnerId: data.delivery_partner_id,
      items: data.items,
      subtotal: data.subtotal,
      deliveryFee: data.delivery_fee,
      total: data.total,
      deliveryAddress: data.delivery_address,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      orderStatus: data.order_status,
      statusHistory: data.status_history,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    } as Order;
  }

  static async getCustomerOrders(customerId: string): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      return localStore.getCustomerOrders();
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      orderNumber: item.order_number,
      customerId: item.customer_id,
      customerName: item.customer_name,
      farmerId: item.farmer_id,
      farmerName: item.farmer_name,
      deliveryPartnerId: item.delivery_partner_id,
      items: item.items || [],
      subtotal: item.subtotal,
      deliveryFee: item.delivery_fee,
      total: item.total,
      deliveryAddress: item.delivery_address,
      paymentMethod: item.payment_method,
      paymentStatus: item.payment_status,
      orderStatus: item.order_status,
      statusHistory: item.status_history || [],
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  static async getFarmerOrders(farmerId: string): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      return localStore.getFarmerOrders();
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      orderNumber: item.order_number,
      customerId: item.customer_id,
      customerName: item.customer_name,
      farmerId: item.farmer_id,
      farmerName: item.farmer_name,
      deliveryPartnerId: item.delivery_partner_id,
      items: item.items || [],
      subtotal: item.subtotal,
      deliveryFee: item.delivery_fee,
      total: item.total,
      deliveryAddress: item.delivery_address,
      paymentMethod: item.payment_method,
      paymentStatus: item.payment_status,
      orderStatus: item.order_status,
      statusHistory: item.status_history || [],
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  static async getDeliveryPartnerOrders(deliveryPartnerId: string): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      return localStore.getDeliveryPartnerOrders();
    }

    // Get orders that are either:
    // 1. Assigned to this delivery partner
    // 2. Packed and not assigned to anyone (available for pickup)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`delivery_partner_id.eq.${deliveryPartnerId},and(order_status.eq.packed,delivery_partner_id.is.null)`)
      .in('order_status', ['packed', 'assigned', 'picked_up', 'out_for_delivery'])
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      orderNumber: item.order_number,
      customerId: item.customer_id,
      customerName: item.customer_name,
      farmerId: item.farmer_id,
      farmerName: item.farmer_name,
      deliveryPartnerId: item.delivery_partner_id,
      items: item.items || [],
      subtotal: item.subtotal,
      deliveryFee: item.delivery_fee,
      total: item.total,
      deliveryAddress: item.delivery_address,
      paymentMethod: item.payment_method,
      paymentStatus: item.payment_status,
      orderStatus: item.order_status,
      statusHistory: item.status_history || [],
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  static async getDeliveryPartnerDeliveredOrders(deliveryPartnerId: string): Promise<Order[]> {
    if (!isSupabaseConfigured) {
      return localStore.getDeliveredOrders();
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('delivery_partner_id', deliveryPartnerId)
      .eq('order_status', 'delivered')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      orderNumber: item.order_number,
      customerId: item.customer_id,
      customerName: item.customer_name,
      farmerId: item.farmer_id,
      farmerName: item.farmer_name,
      deliveryPartnerId: item.delivery_partner_id,
      items: item.items || [],
      subtotal: item.subtotal,
      deliveryFee: item.delivery_fee,
      total: item.total,
      deliveryAddress: item.delivery_address,
      paymentMethod: item.payment_method,
      paymentStatus: item.payment_status,
      orderStatus: item.order_status,
      statusHistory: item.status_history || [],
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  static async updateOrder(orderId: string, data: Partial<Order>): Promise<void> {
    if (!isSupabaseConfigured) {
      return localStore.updateOrder(orderId, data);
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    // Convert camelCase to snake_case
    if (data.orderNumber) updateData.order_number = data.orderNumber;
    if (data.customerId) updateData.customer_id = data.customerId;
    if (data.customerName) updateData.customer_name = data.customerName;
    if (data.farmerId) updateData.farmer_id = data.farmerId;
    if (data.farmerName) updateData.farmer_name = data.farmerName;
    if (data.deliveryPartnerId !== undefined) updateData.delivery_partner_id = data.deliveryPartnerId;
    if (data.items) updateData.items = data.items;
    if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
    if (data.deliveryFee !== undefined) updateData.delivery_fee = data.deliveryFee;
    if (data.total !== undefined) updateData.total = data.total;
    if (data.deliveryAddress) updateData.delivery_address = data.deliveryAddress;
    if (data.paymentMethod) updateData.payment_method = data.paymentMethod;
    if (data.paymentStatus) updateData.payment_status = data.paymentStatus;
    if (data.orderStatus) updateData.order_status = data.orderStatus;
    if (data.statusHistory) updateData.status_history = data.statusHistory;
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);
    
    if (error) throw error;
  }

  static async updateOrderStatus(orderId: string, status: Order['orderStatus'], note?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      return localStore.updateOrderStatus(orderId, status, note);
    }

    const order = await this.getOrder(orderId);
    if (!order) return;

    const statusHistory = [
      ...order.statusHistory,
      {
        status,
        timestamp: new Date(),
        note
      }
    ];

    const { error } = await supabase
      .from('orders')
      .update({
        order_status: status,
        status_history: statusHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    
    if (error) throw error;
  }

  // Review Management
  static async createReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    if (!isSupabaseConfigured) {
      return localStore.createReview(data);
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        order_id: data.orderId,
        customer_id: data.customerId,
        customer_name: data.customerName,
        farmer_id: data.farmerId,
        rating: data.rating,
        comment: data.comment,
        images: data.images || [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update farmer rating
    await this.updateFarmerRating(data.farmerId);
    
    return review.id;
  }

  static async getFarmerReviews(farmerId: string): Promise<Review[]> {
    if (!isSupabaseConfigured) {
      return localStore.getFarmerReviews(farmerId);
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      orderId: item.order_id,
      customerId: item.customer_id,
      customerName: item.customer_name,
      farmerId: item.farmer_id,
      rating: item.rating,
      comment: item.comment,
      images: item.images,
      createdAt: new Date(item.created_at),
    }));
  }

  private static async updateFarmerRating(farmerId: string): Promise<void> {
    const reviews = await this.getFarmerReviews(farmerId);
    if (reviews.length === 0) return;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const { error } = await supabase
      .from('farmers')
      .update({
        rating: averageRating,
        total_reviews: reviews.length,
      })
      .eq('id', farmerId);
    
    if (error) throw error;
  }

  // File Upload (using Supabase Storage)
  static async uploadImage(uri: string, path: string): Promise<string> {
    if (!isSupabaseConfigured) {
      // Offline mode - use the local URI directly
      return uri;
    }

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('uploads')
      .upload(path, blob);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(path);
    
    return publicUrl;
  }
}
