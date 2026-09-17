'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import type { CustomCreationSnapshot } from './custom-creation';

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
  isCustom?: boolean;
  customization?: CustomCreationSnapshot;
}

export interface CartPromo {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  promo: CartPromo | null;
}

export type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'OPEN_CART' }
  | { type: 'CLOSE_CART' }
  | { type: 'SET_PROMO'; payload: CartPromo }
  | { type: 'CLEAR_PROMO' }
  | { type: 'HYDRATE'; payload: CartItem[] }
  | { type: 'HYDRATE_PROMO'; payload: CartPromo | null };

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          isOpen: true,
          items: state.items.map((i) =>
            i.id === action.payload.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return {
        ...state,
        isOpen: true,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) };
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [], promo: null };
    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };
    case 'OPEN_CART':
      return { ...state, isOpen: true };
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    case 'SET_PROMO':
      return { ...state, promo: action.payload };
    case 'CLEAR_PROMO':
      return { ...state, promo: null };
    case 'HYDRATE':
      return { ...state, items: action.payload };
    case 'HYDRATE_PROMO':
      return { ...state, promo: action.payload };
    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setPromo: (promo: CartPromo) => void;
  clearPromo: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = 'vip-parfumerie-cart';
const CART_PROMO_STORAGE_KEY = 'vip-parfumerie-cart-promo';

function isCartPromo(value: unknown): value is CartPromo {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return typeof p.code === 'string' && (p.type === 'percentage' || p.type === 'fixed') && typeof p.value === 'number';
}

export function CartProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false, promo: null });

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) {
          dispatch({ type: 'HYDRATE', payload: parsed });
        }
      }
    } catch {
      // ignore localStorage errors
    }

    try {
      const storedPromo = localStorage.getItem(CART_PROMO_STORAGE_KEY);
      if (storedPromo) {
        const parsedPromo = JSON.parse(storedPromo) as unknown;
        if (isCartPromo(parsedPromo)) {
          dispatch({ type: 'HYDRATE_PROMO', payload: parsedPromo });
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore
    }
  }, [state.items]);

  // Persist the applied promo code separately so it survives navigation
  // between the cart and checkout pages without changing the cart's own
  // storage shape.
  useEffect(() => {
    try {
      if (state.promo) {
        localStorage.setItem(CART_PROMO_STORAGE_KEY, JSON.stringify(state.promo));
      } else {
        localStorage.removeItem(CART_PROMO_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [state.promo]);

  const contextValue = useMemo(
    () => ({
      ...state,
      addItem: (item: Omit<CartItem, 'quantity'>) => dispatch({ type: 'ADD_ITEM', payload: item }),
      removeItem: (id: string) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
      updateQuantity: (id: string, quantity: number) =>
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
      toggleCart: () => dispatch({ type: 'TOGGLE_CART' }),
      openCart: () => dispatch({ type: 'OPEN_CART' }),
      closeCart: () => dispatch({ type: 'CLOSE_CART' }),
      setPromo: (promo: CartPromo) => dispatch({ type: 'SET_PROMO', payload: promo }),
      clearPromo: () => dispatch({ type: 'CLEAR_PROMO' }),
      totalItems: state.items.reduce((acc, i) => acc + i.quantity, 0),
      totalPrice: state.items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    [state]
  );

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
