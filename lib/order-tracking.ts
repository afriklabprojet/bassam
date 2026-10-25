import { normalizePhoneForJeko } from '@/lib/payment/jeko';

/**
 * Suivi public d'une commande (/suivi-commande). Le client donne le numéro imprimé sur son e-mail et sa facture
 * (« VIP-ABCDEF12 » = les 8 premiers caractères de l'identifiant) et le téléphone de la commande : les deux sont exigés.
 */

/** « VIP-ABCDEF12 », « abcdef12 » ou l'identifiant complet → « abcdef12 » ; null si ce n'est pas un numéro. */
export function parseOrderRef(input: string): string | null {
  const value = input.trim().toLowerCase();
  const full = /^([0-9a-f]{8})-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.exec(value);
  if (full) return full[1];
  const short = /^#?\s*(?:vip[\s-]*)?([0-9a-f]{8})$/.exec(value);
  return short ? short[1] : null;
}

/** Bornes des identifiants qui commencent par `ref` : la recherche reste sur l'index de la clé primaire. */
export function orderIdRange(ref: string): [string, string] {
  return [`${ref}-0000-0000-0000-000000000000`, `${ref}-ffff-ffff-ffff-ffffffffffff`];
}

/**
 * Forme comparable : numéro ivoirien en +225…, sinon les chiffres seuls. Le préfixe international 00 est retiré
 * AVANT la normalisation : « 00225 07… » doit valoir « +225 07… ».
 */
function canonicalPhone(phone: string): string {
  const digits = phone.replaceAll(/\D/g, '').replace(/^00/, '');
  return normalizePhoneForJeko(digits) ?? digits;
}

export function phonesMatch(given: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const a = canonicalPhone(given);
  return a.length > 0 && a === canonicalPhone(stored);
}

export const TRACKING_STEPS = ['Reçue', 'Confirmée', 'Expédiée', 'Livrée'] as const;

const STEP_BY_STATUS: Record<string, number> = { pending: 0, confirmed: 1, shipped: 2, delivered: 3 };

/** Position sur la frise ; null pour une commande annulée (ou un statut inconnu), affichée à part. */
export function trackingStep(status: string): number | null {
  return STEP_BY_STATUS[status] ?? null;
}

/** Réponse publique : jamais d'adresse, d'e-mail ni de téléphone. */
export type TrackedOrder = {
  orderNumber: string;
  status: string;
  paymentStatus: string | null;
  totalAmount: number;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
};
