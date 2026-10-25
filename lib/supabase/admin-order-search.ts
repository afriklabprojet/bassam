import { createClient } from './server';
import { buildOrderTimeline, formatTrackingNumber, getDeliveryLabel, type TimelineEvent } from '@/lib/admin-order-tracking';
import { orderIdRange, parseOrderRef } from '@/lib/order-tracking';
import { getOrderStatusLabel } from '@/lib/order-status-theme';
import { logger } from '@/lib/logger';

/** Plus que suffisant : 8 caractères hexadécimaux ne collisionnent qu'exceptionnellement. */
export const ORDER_SEARCH_MAX_RESULTS = 5;

export interface AdminTrackedOrder {
  id: string;
  trackingNumber: string;
  status: string;
  deliveryStatus: string;
  totalAmount: number;
  paymentMethod: string | null;
  paymentStatus: string | null;
  customer: { name: string; phone: string | null; email: string | null };
  shippingAddress: { address: string | null; city: string | null; country: string | null } | null;
  notes: string | null;
  createdAt: string;
  items: Array<{ id: string; name: string; brand: string | null; quantity: number; unitPrice: number }>;
  payments: Array<{ id: string; amount: number; status: string; method: string; transactionId: string | null; createdAt: string; paidAt: string | null }>;
  refunds: Array<{ id: string; amount: number; status: string; reason: string; createdAt: string; processedAt: string | null }>;
  timeline: TimelineEvent[];
}

export type OrderSearchResult =
  | { ok: true; orders: AdminTrackedOrder[] }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'error' };

type Address = { firstName?: string; lastName?: string; address?: string; city?: string; country?: string } | null;

interface OrderRow {
  id: string;
  status: string;
  total_amount: number | string;
  payment_method: string | null;
  payment_status: string | null;
  shipping_address: Address;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number | string;
    products: { name: string; brand: string | null } | null;
  }> | null;
}

interface PaymentRow {
  id: string;
  order_id: string;
  amount: number | string;
  status: string;
  method: string;
  transaction_id: string | null;
  created_at: string;
  paid_at: string | null;
}

interface RefundRow {
  id: string;
  order_id: string;
  amount: number | string;
  status: string;
  reason: string;
  created_at: string;
  processed_at: string | null;
}

const ORDER_COLUMNS = `
  id, status, total_amount, payment_method, payment_status, shipping_address, phone, email, notes,
  created_at, updated_at,
  order_items (id, quantity, unit_price, products (name, brand))
`;

/**
 * Recherche d'une commande par numéro de suivi (VIP-XXXXXXXX ou UUID complet), côté serveur.
 * L'appelant doit avoir vérifié le rôle admin. La requête s'appuie sur l'index de la clé primaire ;
 * paiements et remboursements sont lus en une requête chacun (index sur `order_id`).
 */
export async function searchOrdersByTrackingNumber(query: string): Promise<OrderSearchResult> {
  const ref = parseOrderRef(query);
  if (!ref) return { ok: false, reason: 'invalid' };

  const supabase = await createClient();
  const [from, to] = orderIdRange(ref);

  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .gte('id', from)
    .lte('id', to)
    .order('created_at', { ascending: false })
    .limit(ORDER_SEARCH_MAX_RESULTS);
  if (error) {
    logger.error('[order-search]', 'Erreur de requête commandes', error.message);
    return { ok: false, reason: 'error' };
  }

  const rows = (data ?? []) as unknown as OrderRow[];
  if (rows.length === 0) return { ok: true, orders: [] };

  const ids = rows.map((row) => row.id);
  const [paymentsRes, refundsRes] = await Promise.all([
    supabase
      .from('payments')
      .select('id, order_id, amount, status, method, transaction_id, created_at, paid_at')
      .in('order_id', ids)
      .order('created_at', { ascending: true }),
    supabase
      .from('refunds')
      .select('id, order_id, amount, status, reason, created_at, processed_at')
      .in('order_id', ids)
      .order('created_at', { ascending: true }),
  ]);

  // L'historique est un complément : sa lecture en échec ne doit pas masquer la commande.
  if (paymentsRes.error) logger.warn('[order-search]', 'Paiements illisibles', paymentsRes.error.message);
  if (refundsRes.error) logger.warn('[order-search]', 'Remboursements illisibles', refundsRes.error.message);
  const payments = (paymentsRes.data ?? []) as unknown as PaymentRow[];
  const refunds = (refundsRes.data ?? []) as unknown as RefundRow[];

  return { ok: true, orders: rows.map((row) => toTrackedOrder(row, payments, refunds)) };
}

function toTrackedOrder(row: OrderRow, allPayments: PaymentRow[], allRefunds: RefundRow[]): AdminTrackedOrder {
  const payments = allPayments
    .filter((p) => p.order_id === row.id)
    .map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      method: p.method,
      transactionId: p.transaction_id,
      createdAt: p.created_at,
      paidAt: p.paid_at,
    }));
  const refunds = allRefunds
    .filter((r) => r.order_id === row.id)
    .map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      status: r.status,
      reason: r.reason,
      createdAt: r.created_at,
      processedAt: r.processed_at,
    }));

  const address = row.shipping_address;
  const name = [address?.firstName, address?.lastName].filter(Boolean).join(' ');

  return {
    id: row.id,
    trackingNumber: formatTrackingNumber(row.id),
    status: row.status,
    deliveryStatus: getDeliveryLabel(row.status),
    totalAmount: Number(row.total_amount),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    customer: { name: name || '—', phone: row.phone, email: row.email },
    shippingAddress: address
      ? { address: address.address ?? null, city: address.city ?? null, country: address.country ?? null }
      : null,
    notes: row.notes,
    createdAt: row.created_at,
    items: (row.order_items ?? []).map((item) => ({
      id: item.id,
      name: item.products?.name ?? 'Produit supprimé du catalogue',
      brand: item.products?.brand ?? null,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
    })),
    payments,
    refunds,
    timeline: buildOrderTimeline({
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
      statusLabel: getOrderStatusLabel(row.status),
      payments: payments.map((p) => ({ status: p.status, createdAt: p.createdAt, paidAt: p.paidAt })),
      refunds: refunds.map((r) => ({ status: r.status, createdAt: r.createdAt, processedAt: r.processedAt })),
    }),
  };
}
