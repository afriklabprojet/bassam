// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const NAME = '20261021000000_promo_reservation_lifecycle.sql';
const executable = readFileSync(path.join(MIGRATIONS_DIR, NAME), 'utf8').replace(/^\s*--.*$/gm, '');
const FUNCTIONS = [
  'claim_promo_code_use(uuid)',
  'unclaim_promo_code_use(uuid)',
  'release_order_promo(uuid)',
  'consume_order_promo_on_payment(uuid)',
  'release_stale_promo_reservations(interval)',
];

describe('migration du cycle de vie des usages de codes promo', () => {
  it('passe après la migration newsletter, dans une transaction', () => {
    const names = readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{14}_.*\.sql$/.test(f)).sort();
    expect(names.indexOf(NAME)).toBeGreaterThan(names.indexOf('20261020000000_newsletter_insert_hardening.sql'));
    expect(executable).toMatch(/^\s*begin;/m);
    expect(executable).toMatch(/commit;\s*$/);
  });

  it('ajoute des colonnes compatibles avec l ancien code et indexe la clé étrangère', () => {
    expect(executable).toMatch(/promo_code_id uuid references public\.promo_codes \(id\) on delete set null/);
    expect(executable).toMatch(/promo_use_counted boolean not null default false/);
    expect(executable).toMatch(/create index if not exists orders_promo_code_id_idx\s+on public\.orders \(promo_code_id\)/);
  });

  it('écrit des fonctions sans SECURITY DEFINER, avec search_path vide', () => {
    expect(executable).not.toMatch(/security definer/i);
    expect(executable.match(/security invoker/g)).toHaveLength(FUNCTIONS.length);
    expect(executable.match(/set search_path = ''/g)).toHaveLength(FUNCTIONS.length);
  });

  it('réserve l exécution des fonctions au rôle serveur', () => {
    for (const fn of FUNCTIONS) {
      expect(executable).toContain(`revoke execute on function public.${fn} from public, anon, authenticated;`);
      expect(executable).toContain(`grant execute on function public.${fn} to service_role;`);
    }
  });

  it('borne la réservation par max_uses et ne descend jamais sous zéro', () => {
    expect(executable).toMatch(/max_uses is null or coalesce\(uses_count, 0\) < max_uses/);
    expect(executable).toMatch(/greatest\(coalesce\(uses_count, 0\) - 1, 0\)/);
  });

  it('planifie la libération horaire des commandes impayées depuis 24 h', () => {
    expect(executable).toMatch(/create extension if not exists pg_cron/);
    expect(executable).toMatch(/cron\.schedule\(\s*'release-stale-promo-reservations',\s*'17 \* \* \* \*'/);
    expect(executable).toMatch(/default interval '24 hours'/);
    expect(executable).toMatch(/for update skip locked/);
  });

  it('ne rend jamais l usage d une commande payée ou remboursée', () => {
    const release = executable.slice(executable.indexOf('function public.release_order_promo'), executable.indexOf('function public.consume_order_promo_on_payment'));
    expect(release).toMatch(/payment_status is distinct from 'paid'/);
    expect(release).toMatch(/payment_status is distinct from 'refunded'/);
  });

  it('rattrape aussi les paiements échoués dont la libération n a pas abouti', () => {
    const stale = executable.slice(executable.indexOf('function public.release_stale_promo_reservations'));
    expect(stale).toMatch(/payment_status in \('pending', 'failed'\)/);
    expect(stale).not.toMatch(/'paid'/);
  });

  it('ne modifie jamais le statut des commandes', () => {
    expect(executable).not.toMatch(/set status\b/);
    expect(executable).not.toMatch(/set payment_status\b/);
  });
});
