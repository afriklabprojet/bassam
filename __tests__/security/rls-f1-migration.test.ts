// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  path.join(process.cwd(), 'supabase', 'migrations', '20261011000000_rls_use_is_admin.sql'),
  'utf8',
);

describe('migration RLS F1', () => {
  it('utilise app_metadata comme source unique du rôle administrateur', () => {
    expect(migration).toContain("auth.jwt() -> 'app_metadata' ->> 'role'");
    expect(migration).toContain('coalesce(');
    expect(migration).not.toMatch(/exists\s*\(\s*select\s+1\s+from\s+(public\.)?profiles/i);
  });

  it('remplace les politiques héritées par une politique is_admin complète', () => {
    expect(migration).toMatch(/coalesce\(qual,\s*''\)\s+ilike\s+'%preferences%'/i);
    expect(migration).toMatch(/for all to authenticated using \(\(select public\.is_admin\(\)\)\) with check/i);
  });

  it('refuse role et admin_level en insertion comme en mise à jour publique', () => {
    expect(migration).toMatch(/before insert or update on public\.profiles/i);
    expect(migration).toContain("in ('anon', 'authenticated')");
    expect(migration).toContain("new_preferences -> 'role'");
    expect(migration).toContain("new_preferences -> 'admin_level'");
    expect(migration).toContain("errcode = '42501'");
  });

  it('interdit de documenter un rollback vers profiles.preferences', () => {
    expect(migration).toMatch(/Rollback de sécurité/i);
    expect(migration).not.toMatch(/create policy[\s\S]+preferences->>/i);
  });
});
