/**
 * Garde-fou commun aux scripts qui ÉCRIVENT dans un projet Supabase
 * (apply-migration, setup-database, create-admin-prod).
 *
 * Principes (échec fermé : au moindre doute, on refuse) :
 *  1. SIMULATION par défaut : aucune écriture sans `--apply`.
 *  2. La cible est déclarée (`--target test|production`) ET confirmée en retapant l'hôte (`--confirm-host`).
 *  3. La confirmation n'est jamais crue seule : l'hôte, la référence du projet et la référence portée par la clé de service
 *     sont comparés au REGISTRE DE PRODUCTION du dépôt (empreintes SHA-256, `production-targets.ts`) — indépendamment des noms
 *     de variables, des noms de bases ou des arguments.
 *  4. Une cible de TEST qui correspond à la production est refusée ; une cible « production » absente du registre aussi.
 *  5. Avant toute écriture réelle, l'identité de la cible est PROUVÉE à distance par une requête en lecture seule
 *     (`verifyRemoteIdentity`) : la clé de service doit être acceptée par cet hôte ; pour une cible de test, la base ne doit
 *     contenir que des comptes fictifs ; pour une migration, le projet doit être retrouvé par l'API de gestion.
 *  6. `.env.local` n'est JAMAIS chargé implicitement : l'environnement vient du processus, ou d'un fichier désigné par
 *     `--env-file` (un fichier `.env.test*` pour une cible de test ; `.env.local` refusé).
 *  7. Aucun message ne contient de clé, de jeton ni de mot de passe.
 *
 * Limites connues : voir la section « Limites » de `security/PLAN-DURCISSEMENT-SCRIPTS-2026-10-10.md`.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { basename, relative, resolve, sep } from 'node:path';
import { parse as parseDotenv } from 'dotenv';
import { PRODUCTION_TARGET_HASHES } from './production-targets';

export type Operation =
  | 'apply-migration'
  | 'setup-database'
  | 'create-admin'
  | 'validate-supabase-test';
export type TargetKind = 'test' | 'production';

/** Types de cible permis par opération (le jeu de démonstration n'a aucune raison d'exister en production). */
export const OPERATION_KINDS: Record<Operation, readonly TargetKind[]> = {
  'apply-migration': ['test', 'production'],
  'setup-database': ['test'],
  'create-admin': ['test', 'production'],
  'validate-supabase-test': ['test'],
};

export const URL_KEY = 'NEXT_PUBLIC_SUPABASE_URL';
export const ANON_KEY = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
export const APP_URL_KEY = 'APP_BASE_URL';
export const SERVICE_KEY = 'SUPABASE_SERVICE_ROLE_KEY';
export const TOKEN_KEY = 'SUPABASE_ACCESS_TOKEN';
export const PRODUCTION_CONFIRM_ENV = 'BASSAM_PRODUCTION_CONFIRM';

const VALUE_FLAGS = new Set([
  'target',
  'confirm-host',
  'confirm-app-host',
  'confirm-ref',
  'confirm-name',
  'env-file',
]);
const BOOLEAN_FLAGS = new Set(['apply']);
const HOSTED = /^([a-z0-9]{20})\.supabase\.co$/;
const MODERN_SECRET_KEY = /^sb_secret_[A-Za-z0-9_-]{20,}$/;
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);
/** Comptes considérés comme fictifs dans une base de test. */
export const FICTITIOUS_EMAIL = /@example\.(com|org|net)$/i;

export const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');

export interface ParsedArgs {
  flags: Map<string, string | true>;
  positional: string[];
  errors: string[];
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const flags = new Map<string, string | true>();
  const positional: string[] = [];
  const errors: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const [rawName, inline] = arg.slice(2).split(/=([\s\S]*)/, 2) as [string, string | undefined];
    if (BOOLEAN_FLAGS.has(rawName)) {
      if (inline !== undefined) errors.push(`l'option --${rawName} n'accepte pas de valeur`);
      else if (flags.has(rawName)) errors.push(`option répétée : --${rawName}`);
      else flags.set(rawName, true);
    } else if (VALUE_FLAGS.has(rawName)) {
      const value = inline ?? argv[++i];
      if (value === undefined || value === '' || value.startsWith('--')) errors.push(`valeur manquante pour --${rawName}`);
      else if (flags.has(rawName)) errors.push(`option répétée : --${rawName}`);
      else flags.set(rawName, value);
    } else {
      errors.push(`option inconnue : --${rawName}`);
    }
  }
  return { flags, positional, errors };
}

/** Lit les revendications d'un JWT SANS en vérifier la signature (sert à détecter une incohérence, pas à authentifier). */
export function decodeJwtClaims(token: string | undefined): { role?: string; ref?: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
    return {
      role: typeof payload.role === 'string' ? payload.role : undefined,
      ref: typeof payload.ref === 'string' ? payload.ref : undefined,
    };
  } catch {
    return null;
  }
}

export interface GuardInput {
  operation: Operation;
  argv: readonly string[];
  processEnv: Readonly<Record<string, string | undefined>>;
  /** Injectable pour les tests ; par défaut lit le fichier désigné par --env-file (sans toucher à process.env). */
  readEnvFile?: (path: string) => Record<string, string>;
  /** Injectable pour les tests ; par défaut le registre du dépôt. */
  productionHashes?: ReadonlySet<string>;
}

export interface GuardPlan {
  ok: true;
  operation: Operation;
  kind: TargetKind;
  simulate: boolean;
  host: string;
  ref: string | null;
  local: boolean;
  origin: string;
  appOrigin: string | null;
  envSource: string;
  positional: string[];
  confirmName: string | null;
  /** Contient des secrets : ne jamais l'afficher. */
  secrets: { anonKey?: string; serviceKey?: string; accessToken?: string };
  warnings: string[];
}

export interface GuardRefusal {
  ok: false;
  reasons: string[];
}

const defaultReadEnvFile = (path: string): Record<string, string> => parseDotenv(readFileSync(path));

export function planTarget(input: GuardInput): GuardPlan | GuardRefusal {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const hashes = input.productionHashes ?? PRODUCTION_TARGET_HASHES;
  const { flags, positional, errors } = parseArgs(input.argv);
  reasons.push(...errors);

  // 1. Type de cible et opération
  const kindFlag = flags.get('target');
  let kind: TargetKind | null = null;
  if (kindFlag === 'test' || kindFlag === 'production') kind = kindFlag;
  else reasons.push('--target test|production est obligatoire (aucune valeur par défaut)');
  if (kind && !OPERATION_KINDS[input.operation].includes(kind)) {
    reasons.push(`l'opération « ${input.operation} » est interdite sur une cible « ${kind} »`);
  }

  // 2. Origine de l'environnement : processus, ou fichier désigné explicitement
  const envFile = flags.get('env-file');
  let fileEnv: Record<string, string> = {};
  let envSource = 'variables du processus';
  if (typeof envFile === 'string') {
    const name = basename(envFile);
    if (kind === 'test' && !/^\.env\.test(\..+)?$/.test(name)) {
      reasons.push('pour une cible de test, --env-file doit désigner un fichier .env.test* (jamais .env.local)');
    } else {
      try {
        fileEnv = (input.readEnvFile ?? defaultReadEnvFile)(envFile);
        envSource = `fichier ${name}`;
      } catch {
        reasons.push('fichier --env-file illisible');
      }
    }
  }
  const pick = (key: string): string | undefined => {
    const a = input.processEnv[key] || undefined;
    const b = fileEnv[key] || undefined;
    if (a && b && a !== b) {
      reasons.push(`conflit entre l'environnement du processus et --env-file pour ${key}`);
      return undefined;
    }
    return a ?? b;
  };
  const url = pick(URL_KEY);
  const anonKey = pick(ANON_KEY);
  const appUrl = pick(APP_URL_KEY);
  const serviceKey = pick(SERVICE_KEY);
  const accessToken = pick(TOKEN_KEY);

  if (!url) reasons.push(`${URL_KEY} absente (rien n'est chargé implicitement depuis .env.local)`);
  const needsService = input.operation !== 'apply-migration';
  const needsAnon = input.operation === 'validate-supabase-test';
  if (needsService && !serviceKey) reasons.push(`${SERVICE_KEY} absente`);
  if (needsAnon && !anonKey) reasons.push(`${ANON_KEY} absente`);
  if (!needsService && !accessToken) reasons.push(`${TOKEN_KEY} absente`);

  // 3. Hôte : analyse stricte, jamais de confiance dans une valeur brute
  let host = '';
  let ref: string | null = null;
  let local = false;
  let origin = '';
  if (url) {
    let parsed: URL | null = null;
    try {
      parsed = new URL(url);
    } catch {
      reasons.push(`${URL_KEY} n'est pas une URL valide`);
    }
    if (parsed) {
      host = parsed.hostname.toLowerCase();
      if (parsed.username || parsed.password) reasons.push(`${URL_KEY} contient des identifiants : refus`);
      if (parsed.search || parsed.hash || (parsed.pathname !== '/' && parsed.pathname !== '')) reasons.push(`${URL_KEY} doit être une URL de base (sans chemin ni paramètres)`);
      const hostedMatch = HOSTED.exec(host);
      if (hostedMatch) {
        ref = hostedMatch[1];
        if (parsed.protocol !== 'https:') reasons.push('un projet hébergé doit être joint en https');
        if (parsed.port) reasons.push('un projet hébergé ne doit pas préciser de port');
        origin = `https://${host}`;
      } else if (LOOPBACK.has(host)) {
        local = true;
        origin = `${parsed.protocol}//${parsed.host}`;
        if (kind !== 'test') reasons.push('un hôte local n\'est accepté que pour une cible de test');
      } else {
        reasons.push('hôte non vérifiable (ni projet Supabase hébergé, ni hôte local) : refus par précaution');
      }
    }
  }

  // 4. Confirmation de l'hôte (nécessaire mais jamais suffisante)
  const confirmHost = flags.get('confirm-host');
  if (typeof confirmHost !== 'string') reasons.push('--confirm-host <hôte> est obligatoire (retapez l\'hôte exact de la cible)');
  else if (host && confirmHost.toLowerCase() !== host) reasons.push('--confirm-host ne correspond pas exactement à l\'hôte de la cible');

  // 5. Détection de la production par le registre du dépôt (hôte, référence, référence portée par la clé)
  const claims = decodeJwtClaims(serviceKey);
  const modernSecretKey = typeof serviceKey === 'string' && MODERN_SECRET_KEY.test(serviceKey);
  let isProduction = false;
  if (host && hashes.has(sha256(host))) isProduction = true;
  if (ref && hashes.has(sha256(ref))) isProduction = true;
  if (claims?.ref && hashes.has(sha256(claims.ref.toLowerCase()))) isProduction = true;
  if (needsService && serviceKey) {
    if (modernSecretKey) {
      if (!ref || local) {
        reasons.push(`${SERVICE_KEY} moderne uniquement acceptée pour un projet Supabase hébergé identifiable`);
      }
    } else if (claims) {
      if (claims.role !== 'service_role') reasons.push(`${SERVICE_KEY} ne porte pas le rôle service_role`);
      if (ref && claims.ref && claims.ref.toLowerCase() !== ref) reasons.push('la clé de service appartient à un autre projet que l\'hôte indiqué');
      if (ref && !claims.ref) reasons.push('la clé de service ne porte pas de référence de projet : identité non vérifiable');
    } else {
      reasons.push(`${SERVICE_KEY} n'est ni un JWT legacy lisible ni une clé moderne Supabase valide`);
    }
  }
  if (kind === 'test' && isProduction) reasons.push('la cible correspond à la PRODUCTION (registre du dépôt) : refus pour une cible de test');
  if (kind === 'production' && host && !isProduction) reasons.push('la cible déclarée « production » est absente du registre de production du dépôt : refus (mettre le registre à jour si le projet a changé)');
  if (kind === 'test' && input.processEnv.VERCEL_ENV === 'production') reasons.push('environnement d\'exécution de production détecté (VERCEL_ENV) : refus pour une cible de test');

  // 6. Backend applicatif facultatif pour le validateur distant
  let appOrigin: string | null = null;
  const confirmAppHost = flags.get('confirm-app-host');
  if (input.operation !== 'validate-supabase-test' && confirmAppHost !== undefined) {
    reasons.push('--confirm-app-host est réservé à validate-supabase-test');
  }
  if (input.operation === 'validate-supabase-test') {
    if (!appUrl) {
      if (confirmAppHost !== undefined) reasons.push('--confirm-app-host est inutile sans APP_BASE_URL');
      warnings.push('APP_BASE_URL absente : les routes HTTP du déploiement ne seront pas testées');
    } else {
      try {
        const parsed = new URL(appUrl);
        const appHost = parsed.hostname.toLowerCase();
        const appIsLocal = LOOPBACK.has(appHost);
        if (parsed.username || parsed.password) reasons.push(`${APP_URL_KEY} contient des identifiants : refus`);
        if (parsed.search || parsed.hash || (parsed.pathname !== '/' && parsed.pathname !== '')) {
          reasons.push(`${APP_URL_KEY} doit être une URL de base (sans chemin ni paramètres)`);
        }
        if (appIsLocal) {
          appOrigin = `${parsed.protocol}//${parsed.host}`;
        } else {
          if (parsed.protocol !== 'https:') reasons.push(`${APP_URL_KEY} distante doit utiliser https`);
          if (parsed.port) reasons.push(`${APP_URL_KEY} distante ne doit pas préciser de port`);
          appOrigin = `https://${appHost}`;
        }
        if (typeof confirmAppHost !== 'string') {
          reasons.push('--confirm-app-host <hôte> est obligatoire quand APP_BASE_URL est définie');
        } else if (confirmAppHost.toLowerCase() !== appHost) {
          reasons.push('--confirm-app-host ne correspond pas exactement à l\'hôte applicatif');
        }
        if (hashes.has(sha256(appHost))) {
          reasons.push('APP_BASE_URL correspond à la PRODUCTION (registre du dépôt) : refus');
        }
      } catch {
        reasons.push(`${APP_URL_KEY} n'est pas une URL valide`);
      }
    }
  }

  // 7. Écriture et confirmations supplémentaires pour la production
  const simulate = flags.get('apply') !== true;
  const confirmName = typeof flags.get('confirm-name') === 'string' ? (flags.get('confirm-name') as string) : null;
  if (kind === 'production' && !simulate) {
    if (flags.get('confirm-ref') !== ref || !ref) reasons.push('--confirm-ref <référence du projet> est obligatoire (et doit correspondre) pour écrire en production');
    if (input.processEnv[PRODUCTION_CONFIRM_ENV] !== host || !host) reasons.push(`la variable ${PRODUCTION_CONFIRM_ENV} doit contenir l'hôte de production (seconde confirmation, hors ligne de commande)`);
    if (input.operation === 'apply-migration' && !confirmName) reasons.push('--confirm-name <nom du projet> est obligatoire (il sera comparé au nom lu chez Supabase)');
  }
  if (kind === 'production' && simulate) warnings.push('simulation : pour écrire il faudra --apply, --confirm-ref, la variable de confirmation et la vérification distante');

  if (reasons.length > 0 || !kind) return { ok: false, reasons: [...new Set(reasons)] };
  return {
    ok: true,
    operation: input.operation,
    kind,
    simulate,
    host,
    ref,
    local,
    origin,
    appOrigin,
    envSource,
    positional,
    confirmName,
    secrets: { anonKey, serviceKey, accessToken },
    warnings,
  };
}

/** Résumé sans aucun secret, destiné à l'affichage. */
export function describePlan(plan: GuardPlan): string[] {
  return [
    `opération : ${plan.operation}`,
    `cible : ${plan.kind}${plan.local ? ' (hôte local)' : ''} — ${plan.host}`,
    `environnement lu depuis : ${plan.envSource}`,
    plan.simulate ? 'mode : SIMULATION (aucune écriture, aucune requête distante)' : 'mode : ÉCRITURE (après vérification de l\'identité distante)',
    ...plan.warnings.map((w) => `note : ${w}`),
  ];
}

export function formatRefusal(refusal: GuardRefusal): string {
  return ['REFUS — aucune action n\'a été effectuée :', ...refusal.reasons.map((r) => `  - ${r}`)].join('\n');
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Prouve l'identité de la cible par des requêtes en LECTURE SEULE avant toute écriture. Échoue fermé.
 */
export async function verifyRemoteIdentity(plan: GuardPlan, fetchImpl: FetchLike = fetch): Promise<{ ok: true } | GuardRefusal> {
  const fail = (...reasons: string[]): GuardRefusal => ({ ok: false, reasons });
  try {
    if (plan.operation === 'apply-migration') {
      if (plan.local || !plan.ref) return fail('la Management API ne s\'applique pas à un hôte local : refus');
      const res = await fetchImpl(`https://api.supabase.com/v1/projects/${plan.ref}`, {
        headers: { Authorization: `Bearer ${plan.secrets.accessToken}` },
        redirect: 'error',
      });
      if (!res.ok) return fail(`projet introuvable avec ce jeton d'accès (HTTP ${res.status}) : identité non vérifiable`);
      const info = (await res.json()) as { id?: unknown; ref?: unknown; name?: unknown };
      const remoteRef = typeof info.ref === 'string' ? info.ref : typeof info.id === 'string' ? info.id : '';
      if (remoteRef.toLowerCase() !== plan.ref) return fail('la référence renvoyée par Supabase ne correspond pas à l\'hôte indiqué');
      const name = typeof info.name === 'string' ? info.name : '';
      if (plan.kind === 'test') {
        if (!/test/i.test(name)) return fail('le nom du projet Supabase ne contient pas « test » : refus pour une cible de test');
      } else if (name !== plan.confirmName) {
        return fail('--confirm-name ne correspond pas au nom réel du projet Supabase');
      }
      return { ok: true };
    }

    const res = await fetchImpl(`${plan.origin}/auth/v1/admin/users?page=1&per_page=50`, {
      headers: { apikey: plan.secrets.serviceKey ?? '', Authorization: `Bearer ${plan.secrets.serviceKey}` },
      redirect: 'error',
    });
    if (!res.ok) return fail(`la clé de service n'est pas acceptée par cet hôte (HTTP ${res.status}) : identité non vérifiable`);
    if (plan.kind === 'test') {
      const body = (await res.json()) as { users?: Array<{ email?: unknown }> };
      const users = Array.isArray(body.users) ? body.users : null;
      if (!users) return fail('réponse inattendue de l\'API d\'authentification : contenu de la base non vérifiable');
      if (users.length >= 50) return fail('la base contient 50 comptes ou plus : impossible de prouver qu\'elle ne contient que des comptes fictifs');
      const real = users.filter((u) => typeof u.email !== 'string' || !FICTITIOUS_EMAIL.test(u.email)).length;
      if (real > 0) return fail(`la base contient ${real} compte(s) non fictif(s) (hors @example.com/org/net) : ce n'est pas une base de test`);
    }
    return { ok: true };
  } catch {
    return fail('vérification distante impossible (réseau, redirection ou réponse invalide) : refus par précaution');
  }
}

/** Le fichier de migration doit être un .sql situé sous `supabase/` ou `security/rls/` du dépôt. */
export function resolveMigrationFile(file: string | undefined, root: string): { ok: true; path: string } | GuardRefusal {
  if (!file) return { ok: false, reasons: ['fichier SQL manquant'] };
  const abs = resolve(root, file);
  const rel = relative(root, abs);
  const inside = (dir: string) => rel === dir || rel.startsWith(dir + sep);
  if (rel.startsWith('..') || !(inside('supabase') || inside(['security', 'rls'].join(sep)))) {
    return { ok: false, reasons: ['le fichier doit se trouver sous supabase/ (ou security/rls/) dans le dépôt'] };
  }
  if (!abs.toLowerCase().endsWith('.sql')) return { ok: false, reasons: ['le fichier doit avoir l\'extension .sql'] };
  if (!existsSync(abs)) return { ok: false, reasons: ['fichier SQL introuvable'] };
  return { ok: true, path: abs };
}

/** Message d'erreur sûr : jamais l'objet d'erreur complet (il peut contenir des en-têtes ou des URL avec secrets). */
export function safeErrorMessage(error: unknown, secrets: Array<string | undefined> = []): string {
  let message = error instanceof Error ? error.message : 'erreur inconnue';
  for (const secret of secrets) if (secret && secret.length >= 6) message = message.split(secret).join('***');
  return message.slice(0, 300);
}
