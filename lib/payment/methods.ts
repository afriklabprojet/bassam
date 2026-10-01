/**
 * Single source of truth for the Mobile Money operators offered at checkout.
 * Consumed by the checkout UI, the payment API validation, the Jeko client
 * and the AI assistant — never re-declare this list elsewhere.
 */
export const PAYMENT_METHODS = [
  { value: 'orange', label: 'Orange Money', desc: 'Paiement mobile sécurisé', recommended: true },
  { value: 'mtn', label: 'MTN Money', desc: 'Paiement mobile sécurisé', recommended: false },
  { value: 'wave', label: 'Wave', desc: 'Paiement instant Wave', recommended: false },
  { value: 'moov', label: 'Moov Money', desc: 'Paiement mobile sécurisé', recommended: false },
  { value: 'djamo', label: 'Djamo', desc: 'Carte virtuelle Djamo', recommended: false },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['value'];

export function isPaymentMethodId(value: unknown): value is PaymentMethodId {
  return PAYMENT_METHODS.some((method) => method.value === value);
}
