/**
 * Registre des cibles de PRODUCTION connues, sous forme d'empreintes SHA-256 (jamais en clair).
 *
 * - `HOST` : hôte complet du projet Supabase de production ; `REF` : sa référence de projet (premier libellé de l'hôte).
 * - Ces identifiants ne sont pas des secrets (ils figurent dans le code envoyé aux navigateurs et dans l'APK), mais ils
 *   sont stockés sous forme d'empreintes pour ne jamais être recopiés dans les journaux ni dans les messages d'erreur.
 * - Le registre fait partie du dépôt : il ne dépend ni d'une variable d'environnement, ni d'un argument, ni d'un nom de base.
 *   Si le projet de production change (nouveau projet, domaine personnalisé), il DOIT être mis à jour ici ; en cas de doute, les
 *   scripts refusent d'agir (échec fermé).
 *
 * Pour régénérer une empreinte : echo -n "<valeur>" | sha256sum
 */
export const PRODUCTION_HOST_SHA256: readonly string[] = [
  '2f4b9d020e627cc22eba7619ba690f82bf72074b796b1964a8aacf1325e19f20',
];

export const PRODUCTION_REF_SHA256: readonly string[] = [
  '1554512ff5ebfeb1ad3afe02220c38c361ac66845d447391ab1ac4b66a59a6ea',
];

export const PRODUCTION_TARGET_HASHES: ReadonlySet<string> = new Set([...PRODUCTION_HOST_SHA256, ...PRODUCTION_REF_SHA256]);
