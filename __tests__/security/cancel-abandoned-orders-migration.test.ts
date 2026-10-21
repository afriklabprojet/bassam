// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const NAME = '20261021020000_cancel_abandoned_orders.sql';
const executable = readFileSync(path.join(MIGRATIONS_DIR, NAME), 'utf8').replace(/^\s*--.*$/gm, '');

describe('migration d annulation des commandes abandonnées', () => {
  it('passe après les migrations promo, dans une transaction', () => {
    const names = readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{14}_.*\.sql$/.test(f)).sort();
    expect(names.indexOf(NAME)).toBeGreaterThan(names.indexOf('20261021010000_promo_reconcile_paid_orders.sql'));
    expect(executable).toMatch(/^\s*begin;/m);
    expect(executable).toMatch(/commit;\s*$/);
  });

  it('n annule que les commandes en attente et impayées au-delà de 48 h', () => {
    expect(executable).toMatch(/status = 'pending'\s+and payment_status = 'pending'\s+and created_at < now\(\) - p_max_age/);
    expect(executable).toMatch(/default interval '48 hours'/);
    expect(executable).toMatch(/for update skip locked/);
  });

  it('laisse le statut de paiement intact pour qu un paiement tardif reste possible', () => {
    expect(executable).toMatch(/set status = 'cancelled'/);
    expect(executable).not.toMatch(/payment_status\s*=\s*'failed'/);
    expect(executable).not.toMatch(/set payment_status/);
  });

  it('rend l usage promo encore détenu et ajoute une note visible', () => {
    expect(executable).toMatch(/promo_use_counted as was_counted/);
    expect(executable).toMatch(/where was_counted and promo_code_id is not null/);
    expect(executable).toMatch(/Annulée automatiquement : non payée après/);
  });

  it('reste réservée au rôle serveur et tourne chaque heure', () => {
    expect(executable).not.toMatch(/security definer/i);
    expect(executable).toMatch(/set search_path = ''/);
    expect(executable).toContain('revoke execute on function public.cancel_abandoned_orders(interval) from public, anon, authenticated;');
    expect(executable).toContain('grant execute on function public.cancel_abandoned_orders(interval) to service_role;');
    expect(executable).toMatch(/cron\.schedule\(\s*'cancel-abandoned-orders',\s*'37 \* \* \* \*'/);
  });
});
