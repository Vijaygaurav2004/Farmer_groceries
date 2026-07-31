// In-memory + AsyncStorage-backed data store used when Supabase isn't configured.
// ponytail: single-tenant demo — farmer/delivery/customer queries ignore user IDs
// so one device can play all three roles against the same data. Swap for real
// Supabase (set EXPO_PUBLIC_SUPABASE_URL) when multi-user is needed.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Address, Farmer, Order, OrderStatus, Product, Review } from '../types';

const STORE_KEY = '@farmer_groceries_demo_store_v1';
const DATE_KEYS = new Set(['createdAt', 'updatedAt', 'harvestDate', 'timestamp', 'nextDeliveryDate', 'startDate']);

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

const DEMO_ADDRESS: Address = {
  id: 'home',
  label: 'Home',
  street: '42 Green Park Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  latitude: 19.076,
  longitude: 72.8777,
  isDefault: true,
};

const FARMERS: Farmer[] = [
  {
    id: 'demo_farmer_1',
    email: 'ramesh@farm.demo',
    role: 'farmer',
    name: 'Ramesh Patil',
    farmName: 'Patil Organic Farm',
    farmAddress: { ...DEMO_ADDRESS, id: 'farm1', label: 'Farm', street: 'Village Khed', city: 'Pune' },
    verificationStatus: 'verified',
    verificationDocuments: [],
    rating: 4.6,
    totalReviews: 128,
    bio: 'Third-generation organic farmer growing pesticide-free vegetables.',
    createdAt: daysAgo(400),
    updatedAt: daysAgo(2),
  },
  {
    id: 'demo_farmer_2',
    email: 'lakshmi@farm.demo',
    role: 'farmer',
    name: 'Lakshmi Devi',
    farmName: 'Lakshmi Fruit Orchards',
    farmAddress: { ...DEMO_ADDRESS, id: 'farm2', label: 'Farm', street: 'Ratnagiri Road', city: 'Ratnagiri' },
    verificationStatus: 'verified',
    verificationDocuments: [],
    rating: 4.8,
    totalReviews: 86,
    bio: 'Alphonso mangoes and seasonal fruits, straight from the orchard.',
    createdAt: daysAgo(300),
    updatedAt: daysAgo(5),
  },
  {
    id: 'demo_farmer_3',
    email: 'gurpreet@farm.demo',
    role: 'farmer',
    name: 'Gurpreet Singh',
    farmName: 'Singh Dairy & Grains',
    farmAddress: { ...DEMO_ADDRESS, id: 'farm3', label: 'Farm', street: 'NH-48', city: 'Nashik' },
    verificationStatus: 'verified',
    verificationDocuments: [],
    rating: 4.4,
    totalReviews: 54,
    bio: 'Fresh dairy every morning and stone-ground grains.',
    createdAt: daysAgo(250),
    updatedAt: daysAgo(1),
  },
];

function makeProduct(
  id: string,
  farmer: Farmer,
  overrides: Partial<Product> & Pick<Product, 'name' | 'description' | 'category' | 'unit' | 'pricePerUnit' | 'stock'>
): Product {
  return {
    id,
    farmerId: farmer.id,
    farmerName: farmer.name || farmer.farmName,
    images: [],
    harvestDate: daysAgo(1),
    isOrganic: true,
    isAvailable: true,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
    ...overrides,
  };
}

const PRODUCTS: Product[] = [
  makeProduct('demo_p1', FARMERS[0], { name: 'Fresh Tomatoes', description: 'Juicy vine-ripened tomatoes, picked this morning.', category: 'vegetables', unit: 'kg', pricePerUnit: 40, stock: 50 }),
  makeProduct('demo_p2', FARMERS[0], { name: 'Baby Spinach', description: 'Tender pesticide-free spinach leaves.', category: 'vegetables', unit: 'kg', pricePerUnit: 60, stock: 25 }),
  makeProduct('demo_p3', FARMERS[0], { name: 'Potatoes', description: 'Farm-fresh potatoes, great for every kitchen.', category: 'vegetables', unit: 'kg', pricePerUnit: 30, stock: 100, isOrganic: false }),
  makeProduct('demo_p4', FARMERS[0], { name: 'Fresh Coriander', description: 'Aromatic coriander bunches.', category: 'herbs', unit: 'piece', pricePerUnit: 15, stock: 40 }),
  makeProduct('demo_p5', FARMERS[1], { name: 'Alphonso Mangoes', description: 'The king of mangoes, from Ratnagiri orchards.', category: 'fruits', unit: 'dozen', pricePerUnit: 650, stock: 20 }),
  makeProduct('demo_p6', FARMERS[1], { name: 'Bananas', description: 'Naturally ripened Robusta bananas.', category: 'fruits', unit: 'dozen', pricePerUnit: 55, stock: 60 }),
  makeProduct('demo_p7', FARMERS[1], { name: 'Raw Forest Honey', description: 'Unprocessed honey from forest hives.', category: 'honey', unit: 'liter', pricePerUnit: 480, stock: 15 }),
  makeProduct('demo_p8', FARMERS[2], { name: 'Cow Milk', description: 'Fresh whole milk, delivered chilled.', category: 'dairy', unit: 'liter', pricePerUnit: 65, stock: 30 }),
  makeProduct('demo_p9', FARMERS[2], { name: 'Basmati Rice', description: 'Aged long-grain basmati rice.', category: 'grains', unit: 'kg', pricePerUnit: 120, stock: 80, isOrganic: false }),
  makeProduct('demo_p10', FARMERS[2], { name: 'Free-Range Eggs', description: 'Eggs from free-range desi hens.', category: 'eggs', unit: 'dozen', pricePerUnit: 90, stock: 35 }),
];

function makeOrder(
  id: string,
  orderNumber: string,
  farmer: Farmer,
  products: Array<{ product: Product; quantity: number }>,
  status: OrderStatus,
  placedDaysAgo: number,
  deliveryPartnerId?: string
): Order {
  const items = products.map(({ product, quantity }) => ({
    productId: product.id,
    productName: product.name,
    productImage: product.images[0] || '',
    quantity,
    unit: product.unit,
    pricePerUnit: product.pricePerUnit,
    total: product.pricePerUnit * quantity,
  }));
  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const deliveryFee = 30;
  const statusFlow: OrderStatus[] = ['placed', 'confirmed', 'packed', 'assigned', 'picked_up', 'out_for_delivery', 'delivered'];
  const reached = statusFlow.slice(0, statusFlow.indexOf(status) + 1);
  return {
    id,
    orderNumber,
    customerId: 'demo_customer',
    customerName: 'Demo Customer',
    farmerId: farmer.id,
    farmerName: farmer.name || farmer.farmName,
    deliveryPartnerId,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    deliveryAddress: DEMO_ADDRESS,
    paymentMethod: 'upi',
    paymentStatus: status === 'delivered' ? 'paid' : 'pending',
    orderStatus: status,
    statusHistory: reached.map((s, i) => ({ status: s, timestamp: daysAgo(placedDaysAgo - i * 0.02) })),
    createdAt: daysAgo(placedDaysAgo),
    updatedAt: daysAgo(placedDaysAgo - 0.1),
  };
}

const ORDERS: Order[] = [
  makeOrder('demo_o1', 'FG-1001', FARMERS[0], [{ product: PRODUCTS[0], quantity: 2 }, { product: PRODUCTS[1], quantity: 1 }], 'delivered', 3, 'demo_delivery_1'),
  makeOrder('demo_o2', 'FG-1002', FARMERS[1], [{ product: PRODUCTS[4], quantity: 1 }], 'packed', 0.2),
];

interface DemoState {
  products: Product[];
  orders: Order[];
  reviews: Review[];
}

let state: DemoState | null = null;
let loadPromise: Promise<DemoState> | null = null;

function reviveDates(key: string, value: unknown) {
  return DATE_KEYS.has(key) && typeof value === 'string' ? new Date(value) : value;
}

async function ensureLoaded(): Promise<DemoState> {
  if (state) return state;
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) {
          state = JSON.parse(raw, reviveDates);
          return state!;
        }
      } catch (error) {
        console.error('demoStore: failed to load, reseeding', error);
      }
      state = { products: [...PRODUCTS], orders: [...ORDERS], reviews: [] };
      return state;
    })();
  }
  return loadPromise;
}

function persist() {
  if (!state) return;
  AsyncStorage.setItem(STORE_KEY, JSON.stringify(state)).catch(error =>
    console.error('demoStore: failed to persist', error)
  );
}

const ACTIVE_DELIVERY_STATUSES: OrderStatus[] = ['packed', 'assigned', 'picked_up', 'out_for_delivery'];
const newestFirst = (a: Order, b: Order) => b.createdAt.getTime() - a.createdAt.getTime();

export const demoStore = {
  // ---- Farmers (static seeds; ratings update in-memory only) ----
  async getFarmers(): Promise<Farmer[]> {
    return FARMERS;
  },

  async getFarmer(farmerId: string): Promise<Farmer | null> {
    return FARMERS.find(f => f.id === farmerId) || null;
  },

  // ---- Products ----
  async getAvailableProducts(category?: string): Promise<Product[]> {
    const s = await ensureLoaded();
    return s.products.filter(p => p.isAvailable && (!category || p.category === category));
  },

  async getProduct(productId: string): Promise<Product | null> {
    const s = await ensureLoaded();
    return s.products.find(p => p.id === productId) || null;
  },

  async getFarmerProducts(): Promise<Product[]> {
    const s = await ensureLoaded();
    return [...s.products];
  },

  async addProduct(product: Product): Promise<void> {
    const s = await ensureLoaded();
    s.products.unshift(product);
    persist();
  },

  async updateProduct(productId: string, patch: Partial<Product>): Promise<void> {
    const s = await ensureLoaded();
    const i = s.products.findIndex(p => p.id === productId);
    if (i >= 0) {
      s.products[i] = { ...s.products[i], ...patch, updatedAt: new Date() };
      persist();
    }
  },

  async deleteProduct(productId: string): Promise<void> {
    const s = await ensureLoaded();
    s.products = s.products.filter(p => p.id !== productId);
    persist();
  },

  // ---- Orders ----
  async getOrder(orderId: string): Promise<Order | null> {
    const s = await ensureLoaded();
    return s.orders.find(o => o.id === orderId) || null;
  },

  async getCustomerOrders(): Promise<Order[]> {
    const s = await ensureLoaded();
    return [...s.orders].sort(newestFirst);
  },

  async getFarmerOrders(): Promise<Order[]> {
    const s = await ensureLoaded();
    return [...s.orders].sort(newestFirst);
  },

  async getDeliveryPartnerOrders(): Promise<Order[]> {
    const s = await ensureLoaded();
    return s.orders.filter(o => ACTIVE_DELIVERY_STATUSES.includes(o.orderStatus)).sort(newestFirst);
  },

  async getDeliveredOrders(): Promise<Order[]> {
    const s = await ensureLoaded();
    return s.orders.filter(o => o.orderStatus === 'delivered').sort(newestFirst);
  },

  async createOrder(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const s = await ensureLoaded();
    const id = `demo_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    s.orders.unshift({ ...data, id, createdAt: new Date(), updatedAt: new Date() });
    // Decrement stock so the demo feels real
    for (const item of data.items) {
      const p = s.products.find(prod => prod.id === item.productId);
      if (p) p.stock = Math.max(0, p.stock - item.quantity);
    }
    persist();
    return id;
  },

  async updateOrder(orderId: string, patch: Partial<Order>): Promise<void> {
    const s = await ensureLoaded();
    const i = s.orders.findIndex(o => o.id === orderId);
    if (i >= 0) {
      s.orders[i] = { ...s.orders[i], ...patch, updatedAt: new Date() };
      persist();
    }
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<void> {
    const s = await ensureLoaded();
    const order = s.orders.find(o => o.id === orderId);
    if (!order) return;
    order.orderStatus = status;
    order.statusHistory = [...order.statusHistory, { status, timestamp: new Date(), note }];
    if (status === 'delivered') order.paymentStatus = 'paid';
    order.updatedAt = new Date();
    persist();
  },

  // ---- Reviews ----
  async createReview(data: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
    const s = await ensureLoaded();
    const id = `demo_review_${Date.now()}`;
    s.reviews.unshift({ ...data, id, createdAt: new Date() });
    persist();
    return id;
  },

  async getFarmerReviews(farmerId: string): Promise<Review[]> {
    const s = await ensureLoaded();
    return s.reviews.filter(r => r.farmerId === farmerId);
  },
};
