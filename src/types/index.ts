// Type definitions for the app

export type UserRole = 'customer' | 'farmer' | 'delivery';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  phoneNumber?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer extends User {
  role: 'customer';
  deliveryAddresses: Address[];
  defaultAddressId?: string;
}

export interface Address {
  id: string;
  label: string; // Home, Work, etc.
  street: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface Farmer extends User {
  role: 'farmer';
  farmName: string;
  farmAddress: Address;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocuments: string[]; // URLs to documents
  rating: number;
  totalReviews: number;
  bio?: string;
}

export interface DeliveryPartner extends User {
  role: 'delivery';
  vehicleType: 'bike' | 'scooter' | 'car';
  vehicleNumber: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  isAvailable: boolean;
  rating: number;
  totalDeliveries: number;
}

export interface Product {
  id: string;
  farmerId: string;
  farmerName: string;
  name: string;
  description: string;
  category: ProductCategory;
  images: string[];
  unit: 'kg' | 'piece' | 'dozen' | 'liter';
  pricePerUnit: number;
  stock: number;
  harvestDate: Date;
  isOrganic: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory = 
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'grains'
  | 'herbs'
  | 'eggs'
  | 'honey'
  | 'other';

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  farmerId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  farmerId: string;
  farmerName: string;
  deliveryPartnerId?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: Address;
  paymentMethod: 'cod' | 'upi' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: OrderStatus;
  statusHistory: OrderStatusUpdate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

export type OrderStatus = 
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderStatusUpdate {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  farmerId: string;
  rating: number; // 1-5
  comment: string;
  images?: string[];
  createdAt: Date;
}

export interface Subscription {
  id: string;
  customerId: string;
  farmerId: string;
  type: 'weekly' | 'monthly';
  items: SubscriptionItem[];
  deliveryDay: string; // e.g., 'Monday', 'Friday'
  startDate: Date;
  nextDeliveryDate: Date;
  status: 'active' | 'paused' | 'cancelled';
  totalPrice: number;
  createdAt: Date;
}

export interface SubscriptionItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
}

export interface Delivery {
  id: string;
  orderId: string;
  deliveryPartnerId: string;
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered';
  startTime?: Date;
  endTime?: Date;
  earnings: number;
}

