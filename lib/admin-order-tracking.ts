/**
 * Recherche d'une commande par numéro de suivi côté administration. La normalisation de la saisie et l'intervalle
 * d'identifiants (index de la clé primaire) viennent de `lib/order-tracking.ts` (`parseOrderRef`, `orderIdRange`),
 * partagés avec la page publique « Suivre ma commande ».
 */

/** « VIP-ABCDEF12 » : le numéro communiqué au client, déduit de `orders.id` (rien n'est stocké). */
export function formatTrackingNumber(orderId: string): string {
  return `VIP-${orderId.slice(0, 8).toUpperCase()}`;
}

const DELIVERY_LABELS: Record<string, string> = {
  pending: 'Pas encore expédiée',
  confirmed: 'Pas encore expédiée',
  shipped: 'En cours de livraison',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

/** La livraison n'a pas de statut propre : elle se déduit du statut de la commande. */
export function getDeliveryLabel(status: string): string {
  return DELIVERY_LABELS[status] ?? '—';
}

export interface TimelineEvent {
  at: string;
  label: string;
}

interface TimelineInput {
  createdAt: string;
  updatedAt: string | null;
  status: string;
  statusLabel: string;
  payments: Array<{ status: string; createdAt: string; paidAt: string | null }>;
  refunds: Array<{ status: string; createdAt: string; processedAt: string | null }>;
}

const MIN_UPDATE_GAP_MS = 60_000;

/**
 * Historique reconstitué à partir des données existantes (il n'y a pas de table d'historique des statuts) :
 * création, paiements, remboursements et dernière mise à jour. Trié du plus ancien au plus récent.
 */
export function buildOrderTimeline(input: TimelineInput): TimelineEvent[] {
  const events: TimelineEvent[] = [{ at: input.createdAt, label: 'Commande créée' }];

  for (const payment of input.payments) {
    if (payment.paidAt) events.push({ at: payment.paidAt, label: 'Paiement reçu' });
    else if (payment.status === 'failed') events.push({ at: payment.createdAt, label: 'Paiement échoué' });
    else if (payment.status === 'cancelled') events.push({ at: payment.createdAt, label: 'Paiement annulé' });
    else events.push({ at: payment.createdAt, label: 'Paiement initié' });
  }

  for (const refund of input.refunds) {
    events.push({ at: refund.createdAt, label: 'Remboursement demandé' });
    if (refund.processedAt) events.push({ at: refund.processedAt, label: 'Remboursement effectué' });
  }

  const created = Date.parse(input.createdAt);
  const updated = input.updatedAt ? Date.parse(input.updatedAt) : NaN;
  if (Number.isFinite(updated) && Number.isFinite(created) && updated - created > MIN_UPDATE_GAP_MS) {
    events.push({ at: input.updatedAt as string, label: `Dernière mise à jour — ${input.statusLabel}` });
  }

  return events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
