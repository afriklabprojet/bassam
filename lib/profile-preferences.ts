/**
 * Clés de `profiles.preferences` qui portent des PRIVILÈGES.
 *
 * Plusieurs politiques RLS (inventaire, paiements, remboursements, codes-barres, maintenance, alertes de stock, marketing…)
 * accordent l'accès d'administration quand `profiles.preferences->>'role' = 'admin'`. Or `PATCH /api/profile` écrit
 * `preferences` avec le jeton de l'utilisateur : sans filtre, n'importe quel client connecté pourrait s'attribuer ce rôle.
 * Ces clés ne doivent donc JAMAIS provenir d'une requête cliente.
 *
 * Ce filtre est une défense en profondeur côté application ; le garde-fou définitif est la migration
 * `20261011000000_rls_use_is_admin.sql`, qui doit être validée sur une pile de test avant toute application.
 */
export const PROTECTED_PREFERENCE_KEYS = ['role', 'admin_level'] as const;

const isProtected = (key: string): boolean => (PROTECTED_PREFERENCE_KEYS as readonly string[]).includes(key.toLowerCase());

/**
 * Fusionne les préférences envoyées par le client avec celles déjà enregistrées :
 *  - toute clé privilégiée envoyée par le client (quelle que soit la casse) est ignorée ;
 *  - les clés privilégiées DÉJÀ enregistrées sont conservées telles quelles (un administrateur dont la page de compte renvoie
 *    ses préférences ne perd pas son rôle, et ne peut pas le modifier) ;
 *  - toutes les autres clés (liste de souhaits, etc.) sont celles du client, comme avant.
 */
export function mergePreferencesPreservingPrivileges(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (!isProtected(key)) merged[key] = value;
  }
  for (const key of PROTECTED_PREFERENCE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(current, key)) merged[key] = current[key];
  }
  return merged;
}
