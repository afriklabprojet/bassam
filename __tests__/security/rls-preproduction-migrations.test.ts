// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = (name: string) =>
  readFileSync(path.join(process.cwd(), 'supabase', 'migrations', name), 'utf8');

const f2 = migration('20261011010000_f2_product_images_admin_only.sql');
const f3 = migration('20261011020000_f3_orders_service_only.sql');
const f4 = migration('20261011030000_f4_promo_codes_private.sql');
const f5 = migration('20261011040000_f5_reviews_moderated.sql');
const executable = (sql: string) => sql.replace(/^\s*--.*$/gm, '');

describe('migrations RLS de préproduction', () => {
  it('ordonne F2 à F5 après F1', () => {
    const names = [
      '20261011000000_rls_use_is_admin.sql',
      '20261011010000_f2_product_images_admin_only.sql',
      '20261011020000_f3_orders_service_only.sql',
      '20261011030000_f4_promo_codes_private.sql',
      '20261011040000_f5_reviews_moderated.sql',
    ];
    expect(names).toEqual([...names].sort());
  });

  it('F2 réserve les écritures Storage à is_admin sans rétablir authenticated seul', () => {
    expect(f2).toMatch(/bucket_id = 'product-images'[\s\S]+public\.is_admin\(\)/);
    expect(executable(f2)).not.toMatch(/auth\.role\(\)\s*=\s*'authenticated'/);
  });

  it('F3 supprime toutes les politiques INSERT client sur orders et order_items', () => {
    expect(f3).toContain("tablename in ('orders', 'order_items')");
    expect(f3).toContain("cmd = 'INSERT'");
    expect(f3).not.toMatch(/create policy/i);
  });

  it('F4 retire la lecture publique sans supprimer la politique administrateur', () => {
    expect(f4).toContain("tablename = 'promo_codes'");
    expect(f4).toMatch(/roles @> array\['public'\]/);
    expect(f4).not.toMatch(/drop policy[\s\S]+Admins manage promo_codes/i);
  });

  it('F5 conserve une soumission non approuvée du site et ajoute la modération admin', () => {
    expect(f5).toMatch(/is_approved is false[\s\S]+source = 'website'/);
    expect(f5).toMatch(/create policy "Admins manage reviews"[\s\S]+public\.is_admin\(\)/);
    expect(executable(f5)).not.toMatch(/with check\s*\(\s*true\s*\)/i);
  });

  it('aucun rollback ne restaure explicitement les politiques vulnérables', () => {
    for (const sql of [f2, f3, f4, f5]) {
      expect(sql).toMatch(/Rollback de sécurité/i);
      expect(executable(sql)).not.toMatch(/\brollback\b/i);
    }
  });
});
