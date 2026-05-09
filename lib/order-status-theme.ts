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
  color: '#F0ECE4',
  dot: '#C5A55A',
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
    color: '#5A7C5E',
  },
  cancelled: {
    bg: 'rgba(209,106,95,0.14)',
    color: '#B34F45',
  },
};

export const DARK_ORDER_STATUS_STYLES: Record<OrderStatus, DarkStatusStyle> = {
  pending: {
    bg: 'rgba(197,165,90,0.14)',
    color: '#D9BE80',
    dot: '#C5A55A',
  },
  confirmed: {
    bg: 'rgba(255,255,255,0.06)',
    color: '#F0ECE4',
    dot: '#C5A55A',
  },
  shipped: {
    bg: 'rgba(197,165,90,0.1)',
    color: '#E7C98A',
    dot: '#D9BE80',
  },
  delivered: {
    bg: 'rgba(127,167,133,0.18)',
    color: '#A9D0AD',
    dot: '#7FA785',
  },
  cancelled: {
    bg: 'rgba(209,106,95,0.18)',
    color: '#F3A29A',
    dot: '#D16A5F',
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