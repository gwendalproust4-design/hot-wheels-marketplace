'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/lib/mockDb';
import { useToast } from './ToastContext';

interface CartContextType {
  cartItems: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const { showToast } = useToast();

  // Load cart on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('hw_cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const addToCart = (product: Product) => {
    // Check if product already in cart
    const exists = cartItems.some((item) => item.id === product.id);
    if (exists) {
      showToast('Cet article est déjà dans votre panier', 'info');
      return;
    }
    
    const updatedCart = [...cartItems, product];
    setCartItems(updatedCart);
    localStorage.setItem('hw_cart', JSON.stringify(updatedCart));
    showToast(`${product.title} ajouté au panier !`, 'success');
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cartItems.filter((item) => item.id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('hw_cart', JSON.stringify(updatedCart));
    showToast('Article retiré du panier', 'info');
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('hw_cart');
  };

  const cartCount = cartItems.length;

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
