// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const NAME = '20261021030000_rls_initplan_and_fk_indexes.sql';
const executable = readFileSync(path.join(MIGRATIONS_DIR, NAME), 'utf8').replace(/^\s*--.*$/gm, '');

describe('migration RLS initplan et index des clés étrangères', () => {
  it('passe après l annulation des commandes abandonnées, dans une transaction', () => {
    const names = readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{14}_.*\.sql$/.test(f)).sort();
    expect(names.indexOf(NAME)).toBeGreaterThan(names.indexOf('20261021020000_cancel_abandoned_orders.sql'));
    expect(executable).toMatch(/^\s*begin;/m);
    expect(executable).toMatch(/commit;\s*$/);
  });

  it('modifie les 13 policies sans en créer ni en supprimer', () => {
    expect(executable.match(/^alter policy /gm)).toHaveLength(13);
    expect(executable).not.toMatch(/create policy|drop policy/i);
  });

  it('n appelle plus jamais auth.uid() ni auth.jwt() hors d un sous-select', () => {
    const bare = executable.replace(/\(select auth\.(uid|jwt|role)\(\)\)/g, '');
    expect(bare).not.toMatch(/auth\.(uid|jwt|role)\(\)/);
  });

  it('conserve les conditions de sécurité clés', () => {
    expect(executable).toMatch(/"Users can view their own orders" on public\.orders\s+using \(\(\(select auth\.uid\(\)\) = user_id\)\)/);
    expect(executable).toMatch(/"Users can update their own profile" on public\.profiles\s+using \(\(\(select auth\.uid\(\)\) = id\)\)/);
    expect(executable).toMatch(/user_id = \(select auth\.uid\(\)\)/);
    expect(executable).toMatch(/source = 'website'::text/);
  });

  it('indexe les 13 clés étrangères', () => {
    expect(executable.match(/^create index if not exists \w+_fkey_idx on public\.\w+ \(\w+\);$/gm)).toHaveLength(13);
    expect(executable).toContain('create index if not exists order_items_product_id_fkey_idx on public.order_items (product_id);');
  });
});
