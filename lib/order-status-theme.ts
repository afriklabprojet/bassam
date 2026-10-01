export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

type LightStatusStyle = {
  bg: string;
  color: string;
};

type DarkStatusStyle = LightStatusStyle & {
  dot: string;
};

const FALLBACK_LIGHT_STYLE: LightStatusStyle = {
  bg: 'var(--offwhite)',
  color: 'var(--text-secondary)',
};

const FALLBACK_DARK_STYLE: DarkStatusStyle = {
  bg: 'rgba(255,255,255,0.06)',
  color: 'var(--cream)',
  dot: 'var(--gold)',
};

export const ORDER_STATUS_KEYS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const LIGHT_ORDER_STATUS_STYLES: Record<OrderStatus, LightStatusStyle> = {
  pending: {
    bg: 'rgba(197,165,90,0.14)',
    color: 'var(--gold-dark)',
  },
  confirmed: {
    bg: 'var(--offwhite)',
    color: 'var(--text-primary)',
  },
  shipped: {
    bg: 'rgba(197,165,90,0.1)',
    color: 'var(--gold)',
  },
  delivered: {
    bg: 'rgba(127,167,133,0.14)',
    color: 'var(--order-success-text-light)',
  },
  cancelled: {
    bg: 'rgba(209,106,95,0.14)',
    color: 'var(--order-danger-text-light)',
  },
};

export const DARK_ORDER_STATUS_STYLES: Record<OrderStatus, DarkStatusStyle> = {
  pending: {
    bg: 'rgba(197,165,90,0.14)',
    color: 'var(--gold-light)',
    dot: 'var(--gold)',
  },
  confirmed: {
    bg: 'rgba(255,255,255,0.06)',
    color: 'var(--cream)',
    dot: 'var(--gold)',
  },
  shipped: {
    bg: 'rgba(197,165,90,0.1)',
    color: 'var(--gold-light)',
    dot: 'var(--gold-light)',
  },
  delivered: {
    bg: 'rgba(127,167,133,0.18)',
    color: 'var(--order-success-text-dark)',
    dot: 'var(--order-success)',
  },
  cancelled: {
    bg: 'rgba(209,106,95,0.18)',
    color: 'var(--order-danger-text-dark)',
    dot: 'var(--order-danger)',
  },
};

export function getOrderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function getLightOrderStatusStyle(status: string) {
  return LIGHT_ORDER_STATUS_STYLES[status as OrderStatus] ?? FALLBACK_LIGHT_STYLE;
}

export function getDarkOrderStatusStyle(status: string) {
  return DARK_ORDER_STATUS_STYLES[status as OrderStatus] ?? FALLBACK_DARK_STYLE;
}