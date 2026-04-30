// App Constants

export const APP_CONFIG = {
  name: 'Farmer Groceries',
  version: '1.0.0',
  supportEmail: 'support@farmergroceries.com',
  supportPhone: '+91 1800 123 4567',
};

export const COLORS = {
  primary: '#22c55e',
  primaryLight: '#dcfce7',
  primaryDark: '#15803d',
  secondary: '#a38b61',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export const CATEGORIES = [
  { id: 'vegetables', label: 'Vegetables', icon: '🥬' },
  { id: 'fruits', label: 'Fruits', icon: '🍎' },
  { id: 'dairy', label: 'Dairy', icon: '🥛' },
  { id: 'grains', label: 'Grains', icon: '🌾' },
  { id: 'herbs', label: 'Herbs', icon: '🌿' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'honey', label: 'Honey', icon: '🍯' },
  { id: 'other', label: 'Other', icon: '🛒' },
] as const;

export const ORDER_STATUS = {
  placed: { label: 'Order Placed', color: '#3b82f6', icon: '📝' },
  confirmed: { label: 'Confirmed', color: '#6366f1', icon: '✅' },
  packed: { label: 'Packed', color: '#8b5cf6', icon: '📦' },
  assigned: { label: 'Assigned', color: '#f97316', icon: '🚚' },
  picked_up: { label: 'Picked Up', color: '#eab308', icon: '📍' },
  out_for_delivery: { label: 'Out for Delivery', color: '#f59e0b', icon: '🚛' },
  delivered: { label: 'Delivered', color: '#22c55e', icon: '✓' },
  cancelled: { label: 'Cancelled', color: '#ef4444', icon: '✗' },
} as const;

export const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'card', label: 'Card', icon: '💳' },
] as const;

export const DELIVERY_FEE = 30;
export const MIN_ORDER_VALUE = 100;
export const FREE_DELIVERY_THRESHOLD = 500;
export const MAX_DISTANCE_KM = 50;
export const LOW_STOCK_THRESHOLD = 10;

// Fallback origin used for demo/nearby lookups when a user's live
// location isn't available yet (Mumbai).
export const DEFAULT_COORDINATES = {
  latitude: 19.0760,
  longitude: 72.8777,
};

export const SORT_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
] as const;

export type SortOptionId = typeof SORT_OPTIONS[number]['id'];

export const REGEX = {
  phone: /^[6-9]\d{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  pincode: /^[1-9][0-9]{5}$/,
};

export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection.',
  auth: 'Authentication failed. Please try again.',
  server: 'Server error. Please try again later.',
  validation: 'Please check your input and try again.',
  notFound: 'Resource not found.',
  permission: 'You do not have permission to perform this action.',
};

export const SUCCESS_MESSAGES = {
  orderPlaced: 'Order placed successfully!',
  productAdded: 'Product added successfully!',
  profileUpdated: 'Profile updated successfully!',
  reviewSubmitted: 'Review submitted successfully!',
};

