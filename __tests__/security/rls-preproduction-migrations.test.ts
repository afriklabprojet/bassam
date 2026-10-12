// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = (name: string) =>
  readFileSync(path.join(process.cwd(), 'supabase', 'migrations', name), 'utf8');

const f2 = migration('20261011010000_f2_product_images_admin_only.sql');
const f2Bucket = migration('20261011050000_f2_product_images_bucket.sql');
const advisorHardening = migration('20261011060000_security_advisor_function_hardening.sql');
const platformFunctionHardening = migration(
  '20261011070000_security_advisor_platform_function_hardening.sql',
);
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
      '20261011050000_f2_product_images_bucket.sql',
      '20261011060000_security_advisor_function_hardening.sql',
      '20261011070000_security_advisor_platform_function_hardening.sql',
    ];
    expect(names).toEqual([...names].sort());
  });

  it('F2 réserve les écritures Storage à is_admin sans rétablir authenticated seul', () => {
    expect(f2).toMatch(/bucket_id = 'product-images'[\s\S]+public\.is_admin\(\)/);
    expect(executable(f2)).not.toMatch(/auth\.role\(\)\s*=\s*'authenticated'/);
  });

  it('F2 crée un bucket public compatible avec toutes les routes d upload', () => {
    expect(f2Bucket).toMatch(/insert into storage\.buckets/i);
    expect(f2Bucket).toContain("'product-images'");
    expect(f2Bucket).toContain('5242880');
    for (const mime of [
      'image/avif',
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/webp',
      'image/x-icon',
    ]) {
      expect(f2Bucket).toContain(`'${mime}'`);
    }
  });

  it('durcit les fonctions de trigger signalées par Security Advisor', () => {
    for (const functionName of [
      'update_site_settings_timestamp',
      'update_collections_content_ts',
      'update_services_content_ts',
      'update_home_hero_ts',
      'update_updated_at_column',
      'handle_new_user',
    ]) {
      expect(advisorHardening).toContain(
        `alter function public.${functionName}() set search_path = '';`,
      );
    }
    expect(advisorHardening).toContain(
      'revoke execute on function public.handle_new_user() from public;',
    );
    expect(advisorHardening).toContain(
      'revoke execute on function public.handle_new_user() from anon;',
    );
    expect(advisorHardening).toContain(
      'revoke execute on function public.handle_new_user() from authenticated;',
    );
  });

  it('retire conditionnellement l exposition RPC de rls_auto_enable', () => {
    expect(platformFunctionHardening).toContain(
      "to_regprocedure('public.rls_auto_enable()') is not null",
    );
    for (const role of ['public', 'anon', 'authenticated']) {
      expect(platformFunctionHardening).toContain(
        `revoke execute on function public.rls_auto_enable() from ${role}`,
      );
    }
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
    for (const sql of [
      f2,
      f2Bucket,
      f3,
      f4,
      f5,
      advisorHardening,
      platformFunctionHardening,
    ]) {
      expect(sql).toMatch(/Rollback de sécurité/i);
      expect(executable(sql)).not.toMatch(/\brollback\b/i);
    }
  });
});
