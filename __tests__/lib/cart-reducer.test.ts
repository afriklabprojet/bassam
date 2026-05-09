import { describe, it, expect } from 'vitest';
import { cartReducer } from '@/lib/cart-context';
import type { CartState, CartAction } from '@/lib/cart-context';
import type { CartItem } from '@/lib/cart-context';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const emptyState: CartState = { items: [], isOpen: false };

const itemA: Omit<CartItem, 'quantity'> = {
  id: 'prod-1',
  name: 'Sauvage EDT',
  brand: 'Dior',
  price: 85000,
  image: '/img/sauvage.jpg',
  slug: 'dior-sauvage-edt',
};

const itemB: Omit<CartItem, 'quantity'> = {
  id: 'prod-2',
  name: 'Good Girl',
  brand: 'Carolina Herrera',
  price: 92000,
  image: '/img/good-girl.jpg',
  slug: 'carolina-herrera-good-girl',
};

function dispatch(state: CartState, action: CartAction): CartState {
  return cartReducer(state, action);
}

// ─── ADD_ITEM ─────────────────────────────────────────────────────────────────

describe('ADD_ITEM', () => {
  it('ajoute un nouvel article avec quantity = 1', () => {
    const next = dispatch(emptyState, { type: 'ADD_ITEM', payload: itemA });
    expect(next.items).toHaveLength(1);
    expect(next.items[0].quantity).toBe(1);
    expect(next.items[0].id).toBe('prod-1');
  });

  it('ouvre le panier lors de l\'ajout', () => {
    const next = dispatch(emptyState, { type: 'ADD_ITEM', payload: itemA });
    expect(next.isOpen).toBe(true);
  });

  it('incrémente la quantité si l\'article existe déjà', () => {
    const stateWith1 = dispatch(emptyState, { type: 'ADD_ITEM', payload: itemA });
    const stateWith2 = dispatch(stateWith1, { type: 'ADD_ITEM', payload: itemA });
    expect(stateWith2.items).toHaveLength(1);
    expect(stateWith2.items[0].quantity).toBe(2);
  });

  it('ajoute un second article différent sans perturber le premier', () => {
    const state1 = dispatch(emptyState, { type: 'ADD_ITEM', payload: itemA });
    const state2 = dispatch(state1, { type: 'ADD_ITEM', payload: itemB });
    expect(state2.items).toHaveLength(2);
    const a = state2.items.find((i) => i.id === 'prod-1');
    const b = state2.items.find((i) => i.id === 'prod-2');
    expect(a?.quantity).toBe(1);
    expect(b?.quantity).toBe(1);
  });

  it('n\'altère pas les autres champs lors de l\'incrément', () => {
    const state1 = dispatch(emptyState, { type: 'ADD_ITEM', payload: itemA });
    const state2 = dispatch(state1, { type: 'ADD_ITEM', payload: itemA });
    expect(state2.items[0].name).toBe('Sauvage EDT');
    expect(state2.items[0].price).toBe(85000);
  });
});

// ─── REMOVE_ITEM ──────────────────────────────────────────────────────────────

describe('REMOVE_ITEM', () => {
  it('supprime l\'article ciblé du panier', () => {
    const state = {
      ...emptyState,
      items: [{ ...itemA, quantity: 2 }, { ...itemB, quantity: 1 }],
    };
    const next = dispatch(state, { type: 'REMOVE_ITEM', payload: 'prod-1' });
    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe('prod-2');
  });

  it('ne modifie pas le panier si l\'id est introuvable', () => {
    const state = { ...emptyState, items: [{ ...itemA, quantity: 1 }] };
    const next = dispatch(state, { type: 'REMOVE_ITEM', payload: 'prod-x' });
    expect(next.items).toHaveLength(1);
  });

  it('produit un panier vide si le seul article est supprimé', () => {
    const state = { ...emptyState, items: [{ ...itemA, quantity: 1 }] };
    const next = dispatch(state, { type: 'REMOVE_ITEM', payload: 'prod-1' });
    expect(next.items).toHaveLength(0);
  });
});

// ─── UPDATE_QUANTITY ──────────────────────────────────────────────────────────

describe('UPDATE_QUANTITY', () => {
  it('met à jour la quantité d\'un article existant', () => {
    const state = { ...emptyState, items: [{ ...itemA, quantity: 1 }] };
    const next = dispatch(state, {
      type: 'UPDATE_QUANTITY',
      payload: { id: 'prod-1', quantity: 5 },
    });
    expect(next.items[0].quantity).toBe(5);
  });

  it('supprime l\'article si la quantité est 0', () => {
    const state = { ...emptyState, items: [{ ...itemA, quantity: 2 }] };
    const next = dispatch(state, {
      type: 'UPDATE_QUANTITY',
      payload: { id: 'prod-1', quantity: 0 },
    });
    expect(next.items).toHaveLength(0);
  });

  it('supprime l\'article si la quantité est négative', () => {
    const state = { ...emptyState, items: [{ ...itemA, quantity: 3 }] };
    const next = dispatch(state, {
      type: 'UPDATE_QUANTITY',
      payload: { id: 'prod-1', quantity: -1 },
    });
    expect(next.items).toHaveLength(0);
  });

  it('ne touche pas les autres articles', () => {
    const state = {
      ...emptyState,
      items: [{ ...itemA, quantity: 1 }, { ...itemB, quantity: 3 }],
    };
    const next = dispatch(state, {
      type: 'UPDATE_QUANTITY',
      payload: { id: 'prod-1', quantity: 10 },
    });
    expect(next.items.find((i) => i.id === 'prod-2')?.quantity).toBe(3);
  });
});

// ─── CLEAR_CART ───────────────────────────────────────────────────────────────

describe('CLEAR_CART', () => {
  it('vide complètement le panier', () => {
    const state = {
      ...emptyState,
      items: [{ ...itemA, quantity: 2 }, { ...itemB, quantity: 1 }],
    };
    const next = dispatch(state, { type: 'CLEAR_CART' });
    expect(next.items).toHaveLength(0);
  });

  it('ne modifie pas isOpen', () => {
    const state = { items: [{ ...itemA, quantity: 1 }], isOpen: true };
    const next = dispatch(state, { type: 'CLEAR_CART' });
    expect(next.isOpen).toBe(true);
  });
});

// ─── TOGGLE / OPEN / CLOSE ────────────────────────────────────────────────────

describe('TOGGLE_CART', () => {
  it('bascule isOpen de false à true', () => {
    const next = dispatch(emptyState, { type: 'TOGGLE_CART' });
    expect(next.isOpen).toBe(true);
  });

  it('bascule isOpen de true à false', () => {
    const state = { ...emptyState, isOpen: true };
    const next = dispatch(state, { type: 'TOGGLE_CART' });
    expect(next.isOpen).toBe(false);
  });
});

describe('OPEN_CART', () => {
  it('met isOpen à true', () => {
    const next = dispatch(emptyState, { type: 'OPEN_CART' });
    expect(next.isOpen).toBe(true);
  });

  it('reste true si déjà ouvert', () => {
    const state = { ...emptyState, isOpen: true };
    const next = dispatch(state, { type: 'OPEN_CART' });
    expect(next.isOpen).toBe(true);
  });
});

describe('CLOSE_CART', () => {
  it('met isOpen à false', () => {
    const state = { ...emptyState, isOpen: true };
    const next = dispatch(state, { type: 'CLOSE_CART' });
    expect(next.isOpen).toBe(false);
  });
});

// ─── HYDRATE ──────────────────────────────────────────────────────────────────

describe('HYDRATE', () => {
  it('remplace les articles par le payload', () => {
    const state = { ...emptyState, items: [{ ...itemA, quantity: 1 }] };
    const payload = [{ ...itemB, quantity: 4 }];
    const next = dispatch(state, { type: 'HYDRATE', payload });
    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe('prod-2');
    expect(next.items[0].quantity).toBe(4);
  });

  it('accepte un tableau vide (remise à zéro)', () => {
    const state = { ...emptyState, items: [{ ...itemA, quantity: 2 }] };
    const next = dispatch(state, { type: 'HYDRATE', payload: [] });
    expect(next.items).toHaveLength(0);
  });

  it('ne modifie pas isOpen', () => {
    const state = { items: [], isOpen: true };
    const next = dispatch(state, { type: 'HYDRATE', payload: [{ ...itemA, quantity: 1 }] });
    expect(next.isOpen).toBe(true);
  });
});

// ─── DEFAULT (branche inatteignable en TypeScript, couverte via cast) ──────────

describe('cartReducer — default branch', () => {
  it('retourne l\'état inchangé pour une action inconnue', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next = cartReducer(emptyState, { type: '__UNKNOWN__' } as any);
    expect(next).toEqual(emptyState);
  });
});
