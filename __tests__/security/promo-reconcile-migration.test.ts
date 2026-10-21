// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const NAME = '20261021010000_promo_reconcile_paid_orders.sql';
const executable = readFileSync(path.join(MIGRATIONS_DIR, NAME), 'utf8').replace(/^\s*--.*$/gm, '');

describe('migration de rattrapage des usages des commandes payées', () => {
  it('passe après la migration du cycle de vie, dans une transaction', () => {
    const names = readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{14}_.*\.sql$/.test(f)).sort();
    expect(names.indexOf(NAME)).toBeGreaterThan(names.indexOf('20261021000000_promo_reservation_lifecycle.sql'));
    expect(executable).toMatch(/^\s*begin;/m);
    expect(executable).toMatch(/commit;\s*$/);
  });

  it('ne cible que les commandes payées avec un code et sans usage compté', () => {
    expect(executable).toMatch(/payment_status = 'paid'\s+and promo_code_id is not null\s+and not promo_use_counted/);
    expect(executable).toMatch(/for update skip locked/);
    expect(executable).not.toMatch(/set status\b|set payment_status\b/);
  });

  it('reste réservée au rôle serveur, sans SECURITY DEFINER', () => {
    expect(executable).not.toMatch(/security definer/i);
    expect(executable).toMatch(/set search_path = ''/);
    expect(executable).toContain('revoke execute on function public.reconcile_paid_order_promo_uses() from public, anon, authenticated;');
    expect(executable).toContain('grant execute on function public.reconcile_paid_order_promo_uses() to service_role;');
  });

  it('planifie le rattrapage toutes les heures, décalé de la libération', () => {
    expect(executable).toMatch(/cron\.schedule\(\s*'reconcile-paid-order-promo-uses',\s*'47 \* \* \* \*'/);
  });
});
