import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CartItem, Product } from './types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedVariant?: { colorName?: string; colorHex?: string; image?: string }
  ) => void;
  removeFromCart: (itemRef: string) => void;
  updateQuantity: (itemRef: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Debounce localStorage writes: only flush after 200ms of no cart changes
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      localStorage.setItem('cart', JSON.stringify(cart));
    }, 200);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [cart]);

  const addToCart = useCallback((
    product: Product,
    quantity: number = 1,
    selectedVariant?: { colorName?: string; colorHex?: string; image?: string }
  ) => {
    const variantTag = String(selectedVariant?.colorName || '').trim();
    const cartKey = variantTag ? `${product.id}::${variantTag.toLowerCase()}` : product.id;
    setCart(prev => {
      const existing = prev.find(item => (item.cartKey || item.productId) === cartKey);
      if (existing) {
        return prev.map(item =>
          (item.cartKey || item.productId) === cartKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        cartKey,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: selectedVariant?.image || product.images[0],
        quantity,
        variantName: variantTag || undefined,
        variantHex: selectedVariant?.colorHex || undefined,
      }];
    });
  }, []);

  const removeFromCart = useCallback((itemRef: string) => {
    setCart(prev => prev.filter(item => (item.cartKey || item.productId) !== itemRef));
  }, []);

  const updateQuantity = useCallback((itemRef: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => (item.cartKey || item.productId) !== itemRef));
      return;
    }
    setCart(prev => prev.map(item =>
      (item.cartKey || item.productId) === itemRef ? { ...item, quantity } : item
    ));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const totalPrice = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
