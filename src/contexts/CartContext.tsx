import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = '@farmer_groceries_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const hydratedRef = useRef(false);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    // Don't overwrite the persisted cart with [] before loadCart resolves
    if (hydratedRef.current) {
      saveCart();
    }
  }, [cart]);

  const loadCart = async () => {
    try {
      const data = await AsyncStorage.getItem(CART_KEY);
      if (data) {
        setCart(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      hydratedRef.current = true;
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
      const cap = (qty: number) => (product.stock > 0 ? Math.min(qty, product.stock) : qty);
      const existingItem = prevCart.find(item => item.productId === product.id);

      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: cap(item.quantity + quantity) }
            : item
        );
      }

      return [
        ...prevCart,
        {
          productId: product.id,
          product,
          quantity: cap(quantity),
          farmerId: product.farmerId,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.productId !== productId) return item;
        const maxStock = item.product.stock > 0 ? item.product.stock : quantity;
        return { ...item, quantity: Math.min(quantity, maxStock) };
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.product.pricePerUnit * item.quantity,
    0
  );

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

