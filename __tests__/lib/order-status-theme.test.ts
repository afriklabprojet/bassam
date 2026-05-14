import { describe, it, expect } from 'vitest';
import {
  getOrderStatusLabel,
  getLightOrderStatusStyle,
  getDarkOrderStatusStyle,
  ORDER_STATUS_KEYS,
  ORDER_STATUS_LABELS,
} from '@/lib/order-status-theme';

describe('ORDER_STATUS_KEYS', () => {
  it('contient les 5 statuts attendus', () => {
    expect(ORDER_STATUS_KEYS).toEqual(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);
  });
});

describe('getOrderStatusLabel', () => {
  it('retourne "En attente" pour pending', () => {
    expect(getOrderStatusLabel('pending')).toBe('En attente');
  });

  it('retourne "Confirmée" pour confirmed', () => {
    expect(getOrderStatusLabel('confirmed')).toBe('Confirmée');
  });

  it('retourne "Expédiée" pour shipped', () => {
    expect(getOrderStatusLabel('shipped')).toBe('Expédiée');
  });

  it('retourne "Livrée" pour delivered', () => {
    expect(getOrderStatusLabel('delivered')).toBe('Livrée');
  });

  it('retourne "Annulée" pour cancelled', () => {
    expect(getOrderStatusLabel('cancelled')).toBe('Annulée');
  });

  it('retourne le statut brut pour une valeur inconnue', () => {
    expect(getOrderStatusLabel('unknown_status')).toBe('unknown_status');
  });

  it('couvre tous les statuts de ORDER_STATUS_KEYS', () => {
    for (const key of ORDER_STATUS_KEYS) {
      expect(getOrderStatusLabel(key)).toBe(ORDER_STATUS_LABELS[key]);
    }
  });
});

describe('getLightOrderStatusStyle', () => {
  it('retourne un objet avec bg et color pour chaque statut', () => {
    for (const key of ORDER_STATUS_KEYS) {
      const style = getLightOrderStatusStyle(key);
      expect(style).toHaveProperty('bg');
      expect(style).toHaveProperty('color');
      expect(typeof style.bg).toBe('string');
      expect(typeof style.color).toBe('string');
    }
  });

  it('retourne le style de fallback pour un statut inconnu', () => {
    const style = getLightOrderStatusStyle('inexistant');
    expect(style).toHaveProperty('bg');
    expect(style).toHaveProperty('color');
  });
});

describe('getDarkOrderStatusStyle', () => {
  it('retourne un objet avec bg, color et dot pour chaque statut', () => {
    for (const key of ORDER_STATUS_KEYS) {
      const style = getDarkOrderStatusStyle(key);
      expect(style).toHaveProperty('bg');
      expect(style).toHaveProperty('color');
      expect(style).toHaveProperty('dot');
    }
  });

  it('retourne le style de fallback pour un statut inconnu', () => {
    const style = getDarkOrderStatusStyle('inexistant');
    expect(style).toHaveProperty('bg');
    expect(style).toHaveProperty('color');
    expect(style).toHaveProperty('dot');
  });

  it('le dot de delivered est différent du dot de cancelled', () => {
    const delivered = getDarkOrderStatusStyle('delivered');
    const cancelled = getDarkOrderStatusStyle('cancelled');
    expect(delivered.dot).not.toBe(cancelled.dot);
  });
});
