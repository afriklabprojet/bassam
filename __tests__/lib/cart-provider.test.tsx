/**
 * Tests d'intégration — CartProvider + useCart hook
 * Couvre les lignes 93-145 de lib/cart-context.tsx (CartProvider, useEffect, useCart)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { CartProvider, useCart } from '@/lib/cart-context';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ITEM_A = {
  id: 'prod-1',
  name: 'Sauvage EDT',
  brand: 'Dior',
  price: 85000,
  image: '/img/sauvage.jpg',
  slug: 'dior-sauvage-edt',
};

const ITEM_B = {
  id: 'prod-2',
  name: 'Good Girl',
  brand: 'Carolina Herrera',
  price: 92000,
  image: '/img/good-girl.jpg',
  slug: 'carolina-herrera-good-girl',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

beforeEach(() => {
  localStorage.clear();
});

// ─── addItem ──────────────────────────────────────────────────────────────────

describe('useCart — addItem', () => {
  it('ajoute un article, ouvre le panier et calcule totalItems + totalPrice', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(ITEM_A));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.totalItems).toBe(1);
    expect(result.current.totalPrice).toBe(85000);
  });

  it('incrémente la quantité pour un article déjà présent', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(ITEM_A);
      result.current.addItem(ITEM_A);
    });
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPrice).toBe(170000);
  });

  it('ajoute plusieurs articles distincts', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(ITEM_A);
      result.current.addItem(ITEM_B);
    });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.totalPrice).toBe(85000 + 92000);
  });
});

// ─── removeItem ───────────────────────────────────────────────────────────────

describe('useCart — removeItem', () => {
  it('supprime l\'article ciblé', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(ITEM_A);
      result.current.addItem(ITEM_B);
    });
    act(() => result.current.removeItem('prod-1'));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('prod-2');
  });

  it('ne fait rien si l\'id est introuvable', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(ITEM_A));
    act(() => result.current.removeItem('prod-x'));
    expect(result.current.items).toHaveLength(1);
  });
});

// ─── updateQuantity ───────────────────────────────────────────────────────────

describe('useCart — updateQuantity', () => {
  it('met à jour la quantité d\'un article existant', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(ITEM_A));
    act(() => result.current.updateQuantity('prod-1', 5));
    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalItems).toBe(5);
    expect(result.current.totalPrice).toBe(85000 * 5);
  });

  it('supprime l\'article si quantité ≤ 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(ITEM_A));
    act(() => result.current.updateQuantity('prod-1', 0));
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });
});

// ─── clearCart ────────────────────────────────────────────────────────────────

describe('useCart — clearCart', () => {
  it('vide le panier et remet totalItems à 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem(ITEM_A);
      result.current.addItem(ITEM_B);
    });
    act(() => result.current.clearCart());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });
});

// ─── toggleCart / openCart / closeCart ────────────────────────────────────────

describe('useCart — toggleCart / openCart / closeCart', () => {
  it('toggleCart bascule isOpen false → true → false', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.isOpen).toBe(false);
    act(() => result.current.toggleCart());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggleCart());
    expect(result.current.isOpen).toBe(false);
  });

  it('openCart ouvre le panier', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.openCart());
    expect(result.current.isOpen).toBe(true);
  });

  it('closeCart ferme le panier', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.openCart();
      result.current.closeCart();
    });
    expect(result.current.isOpen).toBe(false);
  });
});

// ─── localStorage — persistance ───────────────────────────────────────────────

describe('useCart — localStorage persistence', () => {
  it('persiste les articles dans localStorage après addItem', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(ITEM_A));
    const stored = localStorage.getItem('vip-parfumerie-cart');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('prod-1');
  });

  it('vide localStorage après clearCart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(ITEM_A));
    act(() => result.current.clearCart());
    const stored = localStorage.getItem('vip-parfumerie-cart');
    expect(JSON.parse(stored!)).toHaveLength(0);
  });
});

// ─── localStorage — hydratation au montage ────────────────────────────────────

describe('useCart — hydratation depuis localStorage', () => {
  it('charge les articles stockés dès le montage', () => {
    localStorage.setItem(
      'vip-parfumerie-cart',
      JSON.stringify([{ ...ITEM_A, quantity: 3 }])
    );
    const { result } = renderHook(() => useCart(), { wrapper });
    // useEffect de hydratation déclenché pendant renderHook
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('prod-1');
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.totalItems).toBe(3);
  });

  it('ignore un JSON invalide dans localStorage', () => {
    localStorage.setItem('vip-parfumerie-cart', 'NOT_JSON{{');
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(0);
  });

  it('ignore une valeur non-tableau dans localStorage', () => {
    localStorage.setItem('vip-parfumerie-cart', JSON.stringify({ id: 'x' }));
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(0);
  });
});

// ─── useCart hors CartProvider ────────────────────────────────────────────────

describe('useCart — hors CartProvider', () => {
  it('lève une erreur si appelé hors CartProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCart())).toThrow(
      'useCart must be used inside CartProvider'
    );
    spy.mockRestore();
  });
});
