// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  describePlan,
  formatRefusal,
  parseArgs,
  planTarget,
  resolveMigrationFile,
  safeErrorMessage,
  sha256,
  verifyRemoteIdentity,
  type GuardPlan,
  type GuardRefusal,
  type Operation,
} from '../../scripts/lib/target-guard';
import { PRODUCTION_TARGET_HASHES } from '../../scripts/lib/production-targets';

// ── Jeux de données entièrement fictifs ─────────────────────────────────────────────────────────────────────────────
const TEST_REF = 'a'.repeat(20);
const TEST_HOST = `${TEST_REF}.supabase.co`;
const PROD_REF = 'p'.repeat(20);
const PROD_HOST = `${PROD_REF}.supabase.co`;
const PROD_APP_HOST = 'production.example.com';
const FAKE_PROD_HASHES = new Set([
  sha256(PROD_HOST),
  sha256(PROD_REF),
  sha256(PROD_APP_HOST),
]);

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (claims: Record<string, unknown>) => `${b64({ alg: 'HS256' })}.${b64(claims)}.${b64('signature-fictive')}`;
const SERVICE_TEST = jwt({ role: 'service_role', ref: TEST_REF });
const SERVICE_PROD = jwt({ role: 'service_role', ref: PROD_REF });
const MODERN_SERVICE = `sb_secret_${'M'.repeat(32)}`;
const SECRETS = [SERVICE_TEST, SERVICE_PROD, MODERN_SERVICE, 'sbp_FAKE_ACCESS_TOKEN_0123456789'];
const TOKEN = 'sbp_FAKE_ACCESS_TOKEN_0123456789';

const testEnv = (extra: Record<string, string | undefined> = {}) => ({
  NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_HOST}`,
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_TEST,
  SUPABASE_ACCESS_TOKEN: TOKEN,
  ...extra,
});
const prodEnv = (extra: Record<string, string | undefined> = {}) => ({
  NEXT_PUBLIC_SUPABASE_URL: `https://${PROD_HOST}`,
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_PROD,
  SUPABASE_ACCESS_TOKEN: TOKEN,
  ...extra,
});

function plan(operation: Operation, argv: string[], env: Record<string, string | undefined>, readEnvFile?: (p: string) => Record<string, string>) {
  return planTarget({ operation, argv, processEnv: env, productionHashes: FAKE_PROD_HASHES, readEnvFile });
}
const refused = (r: GuardPlan | GuardRefusal): GuardRefusal => {
  expect(r.ok).toBe(false);
  return r as GuardRefusal;
};
const accepted = (r: GuardPlan | GuardRefusal): GuardPlan => {
  if (!r.ok) throw new Error(`refus inattendu : ${r.reasons.join(' | ')}`);
  return r;
};
const text = (r: GuardRefusal) => r.reasons.join('\n');
const TEST_ARGS = ['--target', 'test', '--confirm-host', TEST_HOST];
const validationEnv = (extra: Record<string, string | undefined> = {}) =>
  testEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-fictive', ...extra });

// ── 1. Analyse des arguments ─────────────────────────────────────────────────────────────────────────────────────────
describe('analyse des arguments', () => {
  it('sépare options et arguments positionnels, accepte --option=valeur', () => {
    const p = parseArgs(['fichier.sql', '--target=test', '--confirm-host', 'h', '--apply']);
    expect(p.errors).toEqual([]);
    expect(p.positional).toEqual(['fichier.sql']);
    expect(p.flags.get('target')).toBe('test');
    expect(p.flags.get('apply')).toBe(true);
  });
  it('refuse les options inconnues, répétées ou sans valeur (pas de --force ni --yes cachés)', () => {
    expect(parseArgs(['--force']).errors.join()).toMatch(/inconnue/);
    expect(parseArgs(['--yes']).errors.join()).toMatch(/inconnue/);
    expect(parseArgs(['--target', 'test', '--target', 'production']).errors.join()).toMatch(/répétée/);
    expect(parseArgs(['--target']).errors.join()).toMatch(/manquante/);
    expect(parseArgs(['--target', '--apply']).errors.join()).toMatch(/manquante/);
    expect(parseArgs(['--apply=false']).errors.join()).toMatch(/n'accepte pas de valeur/);
  });
});

// ── 2. Confirmation et nature de la cible ───────────────────────────────────────────────────────────────────────────
describe('confirmation de la cible', () => {
  it('refuse en l\'absence de --target (aucune valeur par défaut)', () => {
    expect(text(refused(plan('create-admin', ['--confirm-host', TEST_HOST], testEnv())))).toMatch(/--target/);
  });
  it('refuse en l\'absence de --confirm-host, et si l\'hôte retapé diffère', () => {
    expect(text(refused(plan('create-admin', ['--target', 'test'], testEnv())))).toMatch(/--confirm-host/);
    expect(text(refused(plan('create-admin', ['--target', 'test', '--confirm-host', 'autre.supabase.co'], testEnv())))).toMatch(/ne correspond pas/);
  });
  it('accepte une cible de test valide en SIMULATION par défaut', () => {
    const p = accepted(plan('create-admin', TEST_ARGS, testEnv()));
    expect(p.simulate).toBe(true);
    expect(p.kind).toBe('test');
    expect(p.host).toBe(TEST_HOST);
  });
  it('--apply est nécessaire pour sortir de la simulation ; la casse de l\'hôte confirmé est indifférente', () => {
    const p = accepted(plan('create-admin', ['--target', 'test', '--confirm-host', TEST_HOST.toUpperCase(), '--apply'], testEnv()));
    expect(p.simulate).toBe(false);
  });
  it('--confirm-host seul ne suffit pas : une cible de test qui est la production est refusée', () => {
    const r = refused(plan('create-admin', ['--target', 'test', '--confirm-host', PROD_HOST, '--apply'], prodEnv()));
    expect(text(r)).toMatch(/PRODUCTION/);
  });
  it('la validation distante est limitée aux cibles de test et exige la clé anonyme', () => {
    expect(
      text(
        refused(
          plan('validate-supabase-test', ['--target', 'production', '--confirm-host', TEST_HOST], validationEnv()),
        ),
      ),
    ).toMatch(/interdite/);
    expect(
      text(refused(plan('validate-supabase-test', TEST_ARGS, testEnv()))),
    ).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
    expect(accepted(plan('validate-supabase-test', TEST_ARGS, validationEnv())).simulate).toBe(true);
  });
  it('confirme séparément le backend de test et refuse le domaine applicatif de production', () => {
    const testAppHost = 'backend-test.example.com';
    expect(
      text(
        refused(
          plan(
            'validate-supabase-test',
            TEST_ARGS,
            validationEnv({ APP_BASE_URL: `https://${testAppHost}` }),
          ),
        ),
      ),
    ).toMatch(/--confirm-app-host/);

    const valid = accepted(
      plan(
        'validate-supabase-test',
        [...TEST_ARGS, '--confirm-app-host', testAppHost],
        validationEnv({ APP_BASE_URL: `https://${testAppHost}` }),
      ),
    );
    expect(valid.appOrigin).toBe(`https://${testAppHost}`);

    expect(
      text(
        refused(
          plan(
            'validate-supabase-test',
            [...TEST_ARGS, '--confirm-app-host', PROD_APP_HOST],
            validationEnv({ APP_BASE_URL: `https://${PROD_APP_HOST}` }),
          ),
        ),
      ),
    ).toMatch(/APP_BASE_URL correspond à la PRODUCTION/);
  });
});

// ── 3. Hôte absent, inconnu, falsifié ───────────────────────────────────────────────────────────────────────────────
describe('hôte absent, inconnu ou déguisé', () => {
  it('refuse une URL absente (rien n\'est chargé depuis .env.local)', () => {
    const r = refused(plan('create-admin', TEST_ARGS, { SUPABASE_SERVICE_ROLE_KEY: SERVICE_TEST }));
    expect(text(r)).toMatch(/NEXT_PUBLIC_SUPABASE_URL absente/);
  });
  it.each([
    ['domaine personnalisé', 'https://db.exemple.com'],
    ['suffixe trompeur', `https://${TEST_HOST}.evil.com`],
    ['point final', `https://${TEST_HOST}.`],
    ['sous-domaine', `https://x.${TEST_HOST}`],
    ['référence trop courte', 'https://abc.supabase.co'],
  ])('refuse un hôte non vérifiable : %s', (_label, url) => {
    const r = refused(plan('create-admin', ['--target', 'test', '--confirm-host', new URL(url).hostname], testEnv({ NEXT_PUBLIC_SUPABASE_URL: url })));
    expect(text(r)).toMatch(/non vérifiable|ne correspond/);
  });
  it('refuse identifiants dans l\'URL, http, port, chemin ou paramètres', () => {
    expect(text(refused(plan('create-admin', TEST_ARGS, testEnv({ NEXT_PUBLIC_SUPABASE_URL: `https://u:p@${TEST_HOST}` }))))).toMatch(/identifiants/);
    expect(text(refused(plan('create-admin', TEST_ARGS, testEnv({ NEXT_PUBLIC_SUPABASE_URL: `http://${TEST_HOST}` }))))).toMatch(/https/);
    expect(text(refused(plan('create-admin', TEST_ARGS, testEnv({ NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_HOST}:8443` }))))).toMatch(/port/);
    expect(text(refused(plan('create-admin', TEST_ARGS, testEnv({ NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_HOST}/rest/v1?x=1` }))))).toMatch(/URL de base/);
    expect(text(refused(plan('create-admin', TEST_ARGS, testEnv({ NEXT_PUBLIC_SUPABASE_URL: 'pas une url' }))))).toMatch(/pas une URL/);
  });
  it('un hôte local n\'est accepté que pour une cible de test', () => {
    const localEnv = { NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_SERVICE_ROLE_KEY: jwt({ role: 'service_role', iss: 'supabase-demo' }) };
    const ok = accepted(plan('create-admin', ['--target', 'test', '--confirm-host', '127.0.0.1'], localEnv));
    expect(ok.local).toBe(true);
    expect(text(refused(plan('create-admin', ['--target', 'production', '--confirm-host', '127.0.0.1'], localEnv)))).toMatch(/local/);
  });
});

// ── 4. Production ───────────────────────────────────────────────────────────────────────────────────────────────────
describe('cible de production', () => {
  it('le registre de production du dépôt contient des empreintes SHA-256 valides (jamais de valeurs en clair)', () => {
    expect(PRODUCTION_TARGET_HASHES.size).toBeGreaterThanOrEqual(2);
    for (const h of PRODUCTION_TARGET_HASHES) expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
  it('refuse une cible de test dont la clé de service porte la référence de production (hôte de test + clé de production)', () => {
    const r = refused(plan('create-admin', TEST_ARGS, testEnv({ SUPABASE_SERVICE_ROLE_KEY: SERVICE_PROD })));
    expect(text(r)).toMatch(/PRODUCTION|autre projet/);
  });
  it('refuse une cible de test qui se trouve dans l\'environnement d\'exécution de production', () => {
    expect(text(refused(plan('create-admin', TEST_ARGS, testEnv({ VERCEL_ENV: 'production' }))))).toMatch(/VERCEL_ENV/);
  });
  it('refuse une cible « production » absente du registre (échec fermé)', () => {
    const r = refused(plan('create-admin', ['--target', 'production', '--confirm-host', TEST_HOST], testEnv()));
    expect(text(r)).toMatch(/absente du registre/);
  });
  it('production en simulation : acceptée avec avertissement, sans écriture', () => {
    const p = accepted(plan('create-admin', ['--target', 'production', '--confirm-host', PROD_HOST], prodEnv()));
    expect(p.simulate).toBe(true);
    expect(p.warnings.join()).toMatch(/--confirm-ref/);
  });
  it('production avec --apply : exige --confirm-ref ET la variable de confirmation hors ligne de commande', () => {
    const base = ['--target', 'production', '--confirm-host', PROD_HOST, '--apply'];
    expect(text(refused(plan('create-admin', base, prodEnv())))).toMatch(/--confirm-ref/);
    expect(text(refused(plan('create-admin', [...base, '--confirm-ref', PROD_REF], prodEnv())))).toMatch(/BASSAM_PRODUCTION_CONFIRM/);
    expect(text(refused(plan('create-admin', [...base, '--confirm-ref', 'x'.repeat(20)], prodEnv({ BASSAM_PRODUCTION_CONFIRM: PROD_HOST }))))).toMatch(/--confirm-ref/);
    expect(text(refused(plan('create-admin', [...base, '--confirm-ref', PROD_REF], prodEnv({ BASSAM_PRODUCTION_CONFIRM: 'autre.supabase.co' }))))).toMatch(/BASSAM_PRODUCTION_CONFIRM/);
    const ok = accepted(plan('create-admin', [...base, '--confirm-ref', PROD_REF], prodEnv({ BASSAM_PRODUCTION_CONFIRM: PROD_HOST })));
    expect(ok.simulate).toBe(false);
  });
  it('migration en production : exige aussi --confirm-name', () => {
    const base = ['--target', 'production', '--confirm-host', PROD_HOST, '--apply', '--confirm-ref', PROD_REF];
    const env = prodEnv({ BASSAM_PRODUCTION_CONFIRM: PROD_HOST });
    expect(text(refused(plan('apply-migration', base, env)))).toMatch(/--confirm-name/);
    expect(accepted(plan('apply-migration', [...base, '--confirm-name', 'Nom du projet'], env)).confirmName).toBe('Nom du projet');
  });
  it('setup-database (jeu de démonstration) est interdit sur la production, même avec toutes les confirmations', () => {
    const r = refused(plan('setup-database', ['--target', 'production', '--confirm-host', PROD_HOST, '--confirm-ref', PROD_REF, '--apply'], prodEnv({ BASSAM_PRODUCTION_CONFIRM: PROD_HOST })));
    expect(text(r)).toMatch(/interdite sur une cible « production »/);
  });
});

// ── 5. Origine de l'environnement ───────────────────────────────────────────────────────────────────────────────────
describe('origine de l\'environnement (aucun chargement implicite de .env.local)', () => {
  it('refuse .env.local pour une cible de test, même s\'il contient des valeurs de test', () => {
    const r = refused(plan('create-admin', [...TEST_ARGS, '--env-file', '.env.local'], {}, () => ({ NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_HOST}`, SUPABASE_SERVICE_ROLE_KEY: SERVICE_TEST })));
    expect(text(r)).toMatch(/\.env\.test/);
  });
  it('accepte un fichier .env.test* explicite', () => {
    const p = accepted(plan('create-admin', [...TEST_ARGS, '--env-file', 'config/.env.test.local'], {}, () => ({ NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_HOST}`, SUPABASE_SERVICE_ROLE_KEY: SERVICE_TEST })));
    expect(p.envSource).toContain('.env.test.local');
  });
  it('refuse un fichier illisible ou un conflit entre le processus et le fichier', () => {
    expect(text(refused(plan('create-admin', [...TEST_ARGS, '--env-file', '.env.test'], testEnv(), () => { throw new Error('ENOENT'); })))).toMatch(/illisible/);
    const r = refused(plan('create-admin', [...TEST_ARGS, '--env-file', '.env.test'], testEnv(), () => ({ NEXT_PUBLIC_SUPABASE_URL: `https://${PROD_HOST}` })));
    expect(text(r)).toMatch(/conflit/);
  });
  it('sans variables dans le processus ni fichier désigné : refus (rien n\'est lu ailleurs)', () => {
    expect(text(refused(plan('create-admin', TEST_ARGS, {})))).toMatch(/absente/);
  });
});

// ── 6. Clé de service ───────────────────────────────────────────────────────────────────────────────────────────────
describe('identité de la clé de service', () => {
  it('refuse une clé illisible, sans rôle service_role, sans référence ou d\'un autre projet', () => {
    expect(text(refused(plan('create-admin', TEST_ARGS, testEnv({ SUPABASE_SERVICE_ROLE_KEY: 'pas-un-jwt' }))))).toMatch(/ni un JWT legacy.*ni une clé moderne/);
    expect(text(refused(plan('create-admin', TEST_ARGS, testEnv({ SUPABASE_SERVICE_ROLE_KEY: jwt({ role: 'anon', ref: TEST_REF }) }))))).toMatch(/service_role/);
    expect(text(refused(plan('create-admin', TEST_ARGS, testEnv({ SUPABASE_SERVICE_ROLE_KEY: jwt({ role: 'service_role' }) }))))).toMatch(/référence/);
    expect(text(refused(plan('create-admin', TEST_ARGS, testEnv({ SUPABASE_SERVICE_ROLE_KEY: jwt({ role: 'service_role', ref: 'b'.repeat(20) }) }))))).toMatch(/autre projet/);
  });
  it('accepte une clé moderne uniquement pour un projet hébergé dont la cible reste contrôlée par le registre', () => {
    expect(accepted(plan('create-admin', TEST_ARGS, testEnv({ SUPABASE_SERVICE_ROLE_KEY: MODERN_SERVICE }))).secrets.serviceKey).toBe(MODERN_SERVICE);
    expect(
      accepted(
        plan(
          'create-admin',
          ['--target', 'production', '--confirm-host', PROD_HOST],
          prodEnv({ SUPABASE_SERVICE_ROLE_KEY: MODERN_SERVICE }),
        ),
      ).kind,
    ).toBe('production');
    expect(
      text(
        refused(
          plan(
            'create-admin',
            ['--target', 'test', '--confirm-host', '127.0.0.1'],
            {
              NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
              SUPABASE_SERVICE_ROLE_KEY: MODERN_SERVICE,
            },
          ),
        ),
      ),
    ).toMatch(/projet Supabase hébergé/);
  });
  it('refuse les imitations ou clés modernes tronquées', () => {
    for (const invalid of ['sb_secret_court', `xx_secret_${'x'.repeat(32)}`, `sb_secret_${'!'.repeat(32)}`]) {
      expect(text(refused(plan('create-admin', TEST_ARGS, testEnv({ SUPABASE_SERVICE_ROLE_KEY: invalid }))))).toMatch(/clé moderne Supabase valide/);
    }
  });
});

// ── 7. Vérification distante (lecture seule, fetch simulé) ──────────────────────────────────────────────────────────
type Call = { url: string; init?: RequestInit };
function fakeFetch(handler: (url: string) => { status?: number; body?: unknown } | 'throw') {
  const calls: Call[] = [];
  const impl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const r = handler(url);
    if (r === 'throw') throw new Error('réseau coupé');
    return new Response(JSON.stringify(r.body ?? {}), { status: r.status ?? 200 });
  };
  return { impl, calls };
}
const adminPlan = (kind: 'test' | 'production' = 'test') =>
  kind === 'test'
    ? accepted(plan('create-admin', [...TEST_ARGS, '--apply'], testEnv()))
    : accepted(plan('create-admin', ['--target', 'production', '--confirm-host', PROD_HOST, '--apply', '--confirm-ref', PROD_REF], prodEnv({ BASSAM_PRODUCTION_CONFIRM: PROD_HOST })));
const modernAdminPlan = (kind: 'test' | 'production' = 'test') =>
  kind === 'test'
    ? accepted(plan('create-admin', [...TEST_ARGS, '--apply'], testEnv({ SUPABASE_SERVICE_ROLE_KEY: MODERN_SERVICE })))
    : accepted(
        plan(
          'create-admin',
          ['--target', 'production', '--confirm-host', PROD_HOST, '--apply', '--confirm-ref', PROD_REF],
          prodEnv({
            BASSAM_PRODUCTION_CONFIRM: PROD_HOST,
            SUPABASE_SERVICE_ROLE_KEY: MODERN_SERVICE,
          }),
        ),
      );
const migrationPlan = (kind: 'test' | 'production' = 'test') =>
  kind === 'test'
    ? accepted(plan('apply-migration', [...TEST_ARGS, '--apply'], testEnv()))
    : accepted(plan('apply-migration', ['--target', 'production', '--confirm-host', PROD_HOST, '--apply', '--confirm-ref', PROD_REF, '--confirm-name', 'Vrai nom'], prodEnv({ BASSAM_PRODUCTION_CONFIRM: PROD_HOST })));

describe('preuve d\'identité distante avant écriture', () => {
  it('cible de test : accepte une base ne contenant que des comptes fictifs, par une requête GET en lecture seule', async () => {
    const f = fakeFetch(() => ({ body: { users: [{ email: 'a@example.com' }, { email: 'b@EXAMPLE.org' }] } }));
    expect(await verifyRemoteIdentity(adminPlan(), f.impl)).toEqual({ ok: true });
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].url).toBe(`https://${TEST_HOST}/auth/v1/admin/users?page=1&per_page=50`);
    expect(f.calls[0].init?.method ?? 'GET').toBe('GET');
    expect(f.calls[0].init?.redirect).toBe('error');
  });
  it('cible de test : refuse si la base contient un compte non fictif', async () => {
    const f = fakeFetch(() => ({ body: { users: [{ email: 'a@example.com' }, { email: 'cliente@gmail.com' }] } }));
    const r = refused((await verifyRemoteIdentity(adminPlan(), f.impl)) as GuardRefusal);
    expect(text(r)).toMatch(/non fictif/);
    expect(text(r)).not.toContain('gmail');
  });
  it('cible de test : refuse si elle contient 50 comptes ou plus, une réponse inattendue ou une erreur HTTP', async () => {
    const many = Array.from({ length: 50 }, (_, i) => ({ email: `u${i}@example.com` }));
    expect(text(refused((await verifyRemoteIdentity(adminPlan(), fakeFetch(() => ({ body: { users: many } })).impl)) as GuardRefusal))).toMatch(/50 comptes/);
    expect(text(refused((await verifyRemoteIdentity(adminPlan(), fakeFetch(() => ({ body: { autre: 1 } })).impl)) as GuardRefusal))).toMatch(/inattendue/);
    expect(text(refused((await verifyRemoteIdentity(adminPlan(), fakeFetch(() => ({ status: 401 })).impl)) as GuardRefusal))).toMatch(/n'est pas acceptée/);
  });
  it('échoue fermé si le réseau échoue', async () => {
    const r = refused((await verifyRemoteIdentity(adminPlan(), fakeFetch(() => 'throw').impl)) as GuardRefusal);
    expect(text(r)).toMatch(/impossible/);
  });
  it('production : la clé doit être acceptée par l\'hôte (aucun contrôle de contenu)', async () => {
    expect(await verifyRemoteIdentity(adminPlan('production'), fakeFetch(() => ({ body: { users: [{ email: 'client@gmail.com' }] } })).impl)).toEqual({ ok: true });
    expect(text(refused((await verifyRemoteIdentity(adminPlan('production'), fakeFetch(() => ({ status: 403 })).impl)) as GuardRefusal))).toMatch(/n'est pas acceptée/);
  });
  it('clé moderne : exige la même preuve distante avant écriture en test et en production', async () => {
    expect(await verifyRemoteIdentity(modernAdminPlan(), fakeFetch(() => ({ body: { users: [] } })).impl)).toEqual({ ok: true });
    expect(await verifyRemoteIdentity(modernAdminPlan('production'), fakeFetch(() => ({ body: { users: [] } })).impl)).toEqual({ ok: true });
    const denied = await verifyRemoteIdentity(modernAdminPlan('production'), fakeFetch(() => ({ status: 401 })).impl);
    expect(text(refused(denied as GuardRefusal))).toMatch(/n'est pas acceptée/);
  });
  it('migration : le projet est retrouvé par la Management API (GET), la référence doit correspondre', async () => {
    const f = fakeFetch(() => ({ body: { id: TEST_REF, name: 'Parfumerie TEST' } }));
    expect(await verifyRemoteIdentity(migrationPlan(), f.impl)).toEqual({ ok: true });
    expect(f.calls[0].url).toBe(`https://api.supabase.com/v1/projects/${TEST_REF}`);
    expect(f.calls[0].init?.method ?? 'GET').toBe('GET');
    expect(text(refused((await verifyRemoteIdentity(migrationPlan(), fakeFetch(() => ({ body: { id: 'z'.repeat(20), name: 'test' } })).impl)) as GuardRefusal))).toMatch(/ne correspond pas/);
    expect(text(refused((await verifyRemoteIdentity(migrationPlan(), fakeFetch(() => ({ status: 404 })).impl)) as GuardRefusal))).toMatch(/introuvable/);
  });
  it('migration, cible de test : le nom du projet doit contenir « test »', async () => {
    const r = refused((await verifyRemoteIdentity(migrationPlan(), fakeFetch(() => ({ body: { id: TEST_REF, name: 'Boutique' } })).impl)) as GuardRefusal);
    expect(text(r)).toMatch(/« test »/);
  });
  it('migration, production : --confirm-name doit égaler le nom réel lu chez Supabase', async () => {
    expect(await verifyRemoteIdentity(migrationPlan('production'), fakeFetch(() => ({ body: { id: PROD_REF, name: 'Vrai nom' } })).impl)).toEqual({ ok: true });
    const r = refused((await verifyRemoteIdentity(migrationPlan('production'), fakeFetch(() => ({ body: { id: PROD_REF, name: 'Autre nom' } })).impl)) as GuardRefusal);
    expect(text(r)).toMatch(/--confirm-name/);
    expect(text(r)).not.toContain('Autre nom');
  });
});

// ── 8. Simulation, fuites de secrets, fichier de migration ──────────────────────────────────────────────────────────
describe('simulation et absence de fuite de secrets', () => {
  it('describePlan (affiché en simulation) ne contient ni clé, ni jeton', () => {
    const p = accepted(plan('create-admin', TEST_ARGS, testEnv()));
    const shown = describePlan(p).join('\n');
    for (const s of SECRETS) expect(shown).not.toContain(s);
    expect(shown).toMatch(/SIMULATION/);
  });
  it('aucun message de refus ne contient de secret, quel que soit le motif', async () => {
    const attempts: Array<GuardRefusal> = [
      refused(plan('create-admin', ['--target', 'test'], testEnv())),
      refused(plan('create-admin', ['--target', 'test', '--confirm-host', PROD_HOST, '--apply'], prodEnv())),
      refused(plan('create-admin', TEST_ARGS, testEnv({ SUPABASE_SERVICE_ROLE_KEY: SERVICE_PROD }))),
      refused(plan('create-admin', TEST_ARGS, testEnv({ SUPABASE_SERVICE_ROLE_KEY: 'x' }))),
      refused(plan('create-admin', ['--target', 'production', '--confirm-host', PROD_HOST, '--apply'], prodEnv())),
      refused(plan('apply-migration', TEST_ARGS, testEnv({ NEXT_PUBLIC_SUPABASE_URL: `https://u:${TOKEN}@${TEST_HOST}` }))),
      refused((await verifyRemoteIdentity(adminPlan(), fakeFetch(() => 'throw').impl)) as GuardRefusal),
      refused((await verifyRemoteIdentity(migrationPlan(), fakeFetch(() => ({ status: 401 })).impl)) as GuardRefusal),
    ];
    for (const a of attempts) {
      const shown = formatRefusal(a);
      for (const s of SECRETS) expect(shown).not.toContain(s);
      expect(shown).toMatch(/^REFUS/);
    }
  });
  it('safeErrorMessage masque les secrets et tronque', () => {
    const msg = safeErrorMessage(new Error(`échec avec ${SERVICE_TEST} et ${TOKEN}`), [SERVICE_TEST, TOKEN]);
    expect(msg).not.toContain(SERVICE_TEST);
    expect(msg).not.toContain(TOKEN);
    expect(msg).toContain('***');
    expect(safeErrorMessage('chaîne')).toBe('erreur inconnue');
    expect(safeErrorMessage(new Error('x'.repeat(1000))).length).toBeLessThanOrEqual(300);
  });
});

describe('fichier de migration', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'guard-mig-'));
    mkdirSync(path.join(root, 'supabase', 'migrations'), { recursive: true });
    writeFileSync(path.join(root, 'supabase', 'migrations', 'a.sql'), 'select 1;');
    writeFileSync(path.join(root, 'supabase', 'migrations', 'a.txt'), 'x');
    writeFileSync(path.join(root, 'secret.sql'), 'select 2;');
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));
  it('accepte un .sql existant sous supabase/', () => {
    expect(resolveMigrationFile('supabase/migrations/a.sql', root).ok).toBe(true);
  });
  it('refuse l\'absence, les chemins hors dépôt ou hors supabase/, une mauvaise extension, un fichier inexistant', () => {
    expect(resolveMigrationFile(undefined, root).ok).toBe(false);
    expect(resolveMigrationFile('../x.sql', root).ok).toBe(false);
    expect(resolveMigrationFile('secret.sql', root).ok).toBe(false);
    expect(resolveMigrationFile(path.resolve(root, '..', 'a.sql'), root).ok).toBe(false);
    expect(resolveMigrationFile('supabase/migrations/a.txt', root).ok).toBe(false);
    expect(resolveMigrationFile('supabase/migrations/absent.sql', root).ok).toBe(false);
  });
});

// ── 9. Scripts en ligne de commande (processus réels, réseau interdit) ──────────────────────────────────────────────
describe('scripts en ligne de commande (aucun réseau, aucune base)', () => {
  const repo = process.cwd();
  const tsx = path.join(repo, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  // Barres obliques : les antislashs seraient interprétés comme des échappements dans NODE_OPTIONS.
  const noNet = path.join(repo, '__tests__', 'scripts', 'fixtures', 'no-network.cjs').split(path.sep).join('/');
  const migration = path.join('supabase', 'migrations', readdirSync(path.join(repo, 'supabase', 'migrations')).filter((f) => f.endsWith('.sql')).sort()[0]);
  let cwdDir: string;
  beforeEach(() => {
    cwdDir = mkdtempSync(path.join(tmpdir(), 'guard-cli-'));
  });
  afterEach(() => rmSync(cwdDir, { recursive: true, force: true }));

  function run(script: string, args: string[], env: Record<string, string>, cwd = repo) {
    const clean = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP, USERPROFILE: process.env.USERPROFILE, NODE_OPTIONS: `--require "${noNet}"`, ...env } as unknown as NodeJS.ProcessEnv;
    return spawnSync(process.execPath, [tsx, path.join(repo, 'scripts', script), ...args], { cwd, env: clean, encoding: 'utf8', timeout: 60_000 });
  }

  it('apply-migration sans argument : refus, aucune requête', () => {
    const r = run('apply-migration.ts', [], {});
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/REFUS/);
    expect(r.stderr).not.toMatch(/NETWORK_ATTEMPT/);
  }, 90_000);

  it('ne charge JAMAIS .env.local : un fichier .env.local présent dans le répertoire courant est ignoré', () => {
    writeFileSync(path.join(cwdDir, '.env.local'), `NEXT_PUBLIC_SUPABASE_URL=https://${TEST_HOST}\nSUPABASE_SERVICE_ROLE_KEY=${SERVICE_TEST}\nSUPABASE_ACCESS_TOKEN=${TOKEN}\n`);
    const r = run('create-admin-prod.ts', ['a@example.com', ...TEST_ARGS], {}, cwdDir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/absente/);
    expect(r.stdout + r.stderr).not.toContain(TEST_HOST);
  }, 90_000);

  it('create-admin : simulation d\'une cible de test valide = aucune écriture, aucun réseau, aucun secret affiché', () => {
    const r = run('create-admin-prod.ts', ['a@example.com', ...TEST_ARGS], { NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_HOST}`, SUPABASE_SERVICE_ROLE_KEY: SERVICE_TEST });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/SIMULATION/);
    expect(r.stderr).not.toMatch(/NETWORK_ATTEMPT/);
    for (const s of SECRETS) expect(r.stdout + r.stderr).not.toContain(s);
  }, 90_000);

  it('create-admin : refuse --apply sans la vérification requise pour la production (variable de confirmation absente)', () => {
    const r = run('create-admin-prod.ts', ['a@example.com', '--target', 'production', '--confirm-host', TEST_HOST, '--apply'], { NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_HOST}`, SUPABASE_SERVICE_ROLE_KEY: SERVICE_TEST });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/REFUS/);
    expect(r.stderr).not.toMatch(/NETWORK_ATTEMPT/);
  }, 90_000);

  it('apply-migration : simulation valide = aucune requête envoyée', () => {
    const r = run('apply-migration.ts', [migration, ...TEST_ARGS], { NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_HOST}`, SUPABASE_ACCESS_TOKEN: TOKEN });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/SIMULATION/);
    expect(r.stderr).not.toMatch(/NETWORK_ATTEMPT/);
    expect(r.stdout + r.stderr).not.toContain(TOKEN);
  }, 90_000);

  it('setup-database : refusé sur une cible « production » et simulation valide sur une cible de test', () => {
    const env = { NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_HOST}`, SUPABASE_SERVICE_ROLE_KEY: SERVICE_TEST };
    const denied = run('setup-database.ts', ['--target', 'production', '--confirm-host', TEST_HOST], env);
    expect(denied.status).toBe(1);
    expect(denied.stderr).toMatch(/interdite/);
    const ok = run('setup-database.ts', TEST_ARGS, env);
    expect(ok.status).toBe(0);
    expect(ok.stdout).toMatch(/SIMULATION/);
    expect(ok.stderr).not.toMatch(/NETWORK_ATTEMPT/);
  }, 120_000);

  it('validate-supabase-test : simulation valide = aucune écriture et aucun réseau', () => {
    const r = run(
      'validate-supabase-test.mjs',
      TEST_ARGS,
      {
        NEXT_PUBLIC_SUPABASE_URL: `https://${TEST_HOST}`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-fictive',
        SUPABASE_SERVICE_ROLE_KEY: SERVICE_TEST,
      },
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/SIMULATION/);
    expect(r.stderr).not.toMatch(/NETWORK_ATTEMPT/);
    for (const s of SECRETS) expect(r.stdout + r.stderr).not.toContain(s);
  }, 90_000);
});

// ── 10. Scripts shell qui agissaient sur la base ────────────────────────────────────────────────────────────────────
describe('scripts shell (apply-schema.sh, create-admins-prod.sh)', () => {
  const repo = process.cwd();
  const read = (f: string) => readFileSync(path.join(repo, 'scripts', f), 'utf8').replace(/\r\n/g, '\n');

  it('apply-schema.sh est désactivé AVANT toute commande psql ou toute lecture de mot de passe', () => {
    const src = read('apply-schema.sh');
    const stop = src.indexOf('exit 1');
    expect(stop).toBeGreaterThan(-1);
    for (const dangerous of ['psql ', 'read -rsp', 'DATABASE_URL=', 'setup-database.ts']) {
      const first = src.indexOf(dangerous);
      if (first !== -1) expect(first).toBeGreaterThan(stop);
    }
  });

  it('apply-schema.sh : exécuté pour de vrai, il refuse (code 1) et n\'atteint pas psql', () => {
    const probe = spawnSync('bash', ['-c', 'true'], { encoding: 'utf8' });
    if (probe.error) return; // bash indisponible sur ce poste : le test statique ci-dessus reste valable
    const r = spawnSync('bash', [path.join(repo, 'scripts', 'apply-schema.sh')], { cwd: repo, encoding: 'utf8', env: { PATH: process.env.PATH ?? '' } as unknown as NodeJS.ProcessEnv, timeout: 30_000 });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/DÉSACTIVÉ/);
    expect(r.stdout + r.stderr).not.toMatch(/psql non trouvé|Mot de passe|Connexion/);
  });

  it('create-admins-prod.sh transmet les options de garde-fou à create-admin-prod.ts à chaque appel', () => {
    const calls = read('create-admins-prod.sh').split('\n').filter((l) => l.trim().startsWith('pnpm tsx scripts/create-admin-prod.ts'));
    expect(calls).toHaveLength(3);
    for (const line of calls) expect(line).toContain('"$@"');
  });
});

// ── 11. Garde-fou contre les régressions : tout nouveau script qui touche aux secrets Supabase doit passer par le garde-fou ──
describe('politique : les scripts qui écrivent dans Supabase passent par target-guard', () => {
  const dir = path.join(process.cwd(), 'scripts');
  const scripts = readdirSync(dir).filter((f) => /\.(?:mjs|ts)$/.test(f));
  const source = (f: string) => readFileSync(path.join(dir, f), 'utf8');

  it('chaque script JS/TS qui référence Supabase sensible importe le garde-fou', () => {
    const sensitive = scripts.filter((f) => /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|api\.supabase\.com|\.auth\.admin\.|@supabase\/supabase-js/.test(source(f)));
    expect(sensitive.length).toBeGreaterThanOrEqual(3);
    for (const f of sensitive) {
      expect(source(f), `${f} doit importer le garde-fou`).toMatch(
        /from '\.\/lib\/target-guard(?:\.ts)?'/,
      );
    }
  });

  it('aucun script gardé ne charge .env.local (ni via dotenv, ni par chemin en dur)', () => {
    for (const f of ['apply-migration.ts', 'setup-database.ts', 'create-admin-prod.ts']) {
      const code = source(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(code, f).not.toMatch(/dotenv|\.env\.local|loadEnvFile|process\.loadEnvFile/);
    }
  });

  it('aucun script gardé ne contient d\'URL, de référence de projet ou de mot de passe en dur', () => {
    const files = ['apply-migration.ts', 'setup-database.ts', 'create-admin-prod.ts', path.join('lib', 'target-guard.ts'), path.join('lib', 'production-targets.ts')];
    for (const f of files) {
      const code = readFileSync(path.join(dir, f), 'utf8');
      expect(code, f).not.toMatch(/https:\/\/[a-z0-9]{20}\.supabase\.co/);
      expect(code, f).not.toMatch(/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\./);
      expect(code, f).not.toMatch(/sbp_[A-Za-z0-9]{10,}/);
    }
  });
});
