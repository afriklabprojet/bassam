import { describe, it, expect } from 'vitest';
import { buildOrderTimeline, formatTrackingNumber, getDeliveryLabel } from '@/lib/admin-order-tracking';
import { parseOrderRef } from '@/lib/order-tracking';

// Le parseur est partagé avec la page publique ; on vérifie ici les saisies d'un administrateur.
describe('saisie du numéro de suivi (parseOrderRef)', () => {
  it.each(['VIP-3F2A9C1B', 'vip-3f2a9c1b', ' #3f2a9c1b ', 'VIP 3F2A9C1B', '3F2A9C1B', 'VIP3F2A9C1B', '3F2A9C1B-1111-4222-8333-444455556666'])(
    'normalise « %s » en 3f2a9c1b',
    (input) => {
      expect(parseOrderRef(input)).toBe('3f2a9c1b');
    },
  );

  it.each(['', '   ', 'VIP-', 'VIP-3F2A9C1', 'VIP-3F2A9C1BX', 'VIP-ZZZZZZZZ', "VIP-3F2A9C1B'; DROP TABLE orders", '3F2A9C1B,id.neq.0'])(
    'refuse « %s »',
    (input) => {
      expect(parseOrderRef(input)).toBeNull();
    },
  );
});

describe('formatTrackingNumber', () => {
  it('reproduit le numéro communiqué au client', () => {
    expect(formatTrackingNumber('3f2a9c1b-1111-4222-8333-444455556666')).toBe('VIP-3F2A9C1B');
  });
});

describe('getDeliveryLabel', () => {
  it('déduit la livraison du statut de la commande', () => {
    expect(getDeliveryLabel('confirmed')).toBe('Pas encore expédiée');
    expect(getDeliveryLabel('shipped')).toBe('En cours de livraison');
    expect(getDeliveryLabel('delivered')).toBe('Livrée');
    expect(getDeliveryLabel('cancelled')).toBe('Annulée');
    expect(getDeliveryLabel('inconnu')).toBe('—');
  });
});

describe('buildOrderTimeline', () => {
  const base = {
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
    status: 'pending',
    statusLabel: 'En attente',
    payments: [],
    refunds: [],
  };

  it('ne contient que la création quand rien d\'autre ne s\'est passé', () => {
    expect(buildOrderTimeline(base)).toEqual([{ at: base.createdAt, label: 'Commande créée' }]);
  });

  it('ordonne création, paiement, remboursement et dernière mise à jour', () => {
    const events = buildOrderTimeline({
      ...base,
      status: 'shipped',
      statusLabel: 'Expédiée',
      updatedAt: '2026-10-03T09:00:00Z',
      payments: [{ status: 'completed', createdAt: '2026-10-01T10:01:00Z', paidAt: '2026-10-01T10:02:00Z' }],
      refunds: [{ status: 'processed', createdAt: '2026-10-02T08:00:00Z', processedAt: '2026-10-02T09:00:00Z' }],
    });
    expect(events.map((e) => e.label)).toEqual([
      'Commande créée',
      'Paiement reçu',
      'Remboursement demandé',
      'Remboursement effectué',
      'Dernière mise à jour — Expédiée',
    ]);
  });

  it('signale un paiement échoué ou initié', () => {
    const events = buildOrderTimeline({
      ...base,
      payments: [
        { status: 'failed', createdAt: '2026-10-01T10:05:00Z', paidAt: null },
        { status: 'pending', createdAt: '2026-10-01T10:06:00Z', paidAt: null },
      ],
    });
    expect(events.map((e) => e.label)).toEqual(['Commande créée', 'Paiement échoué', 'Paiement initié']);
  });
});
