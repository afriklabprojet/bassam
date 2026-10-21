// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');
const NAME = '20261020000000_newsletter_insert_hardening.sql';
const sql = readFileSync(path.join(MIGRATIONS_DIR, NAME), 'utf8');
const executable = sql.replace(/^\s*--.*$/gm, '');

describe('migration newsletter : durcissement de l inscription publique', () => {
  it('passe après les migrations de sécurité F1 à F5 et Security Advisor', () => {
    const names = readdirSync(MIGRATIONS_DIR).filter((f) => /^\d{14}_.*\.sql$/.test(f)).sort();
    expect(names.indexOf(NAME)).toBeGreaterThan(
      names.indexOf('20261011070000_security_advisor_platform_function_hardening.sql'),
    );
  });

  it('remplace la politique WITH CHECK (true) dans une transaction', () => {
    expect(executable).toMatch(/^\s*begin;/m);
    expect(executable).toMatch(/commit;\s*$/);
    expect(executable).toMatch(/drop policy if exists "Anyone can subscribe to newsletter"/);
    expect(executable).not.toMatch(/with check\s*\(\s*true\s*\)/i);
  });

  it('impose la source, l état actif et le rattachement à l utilisateur courant', () => {
    expect(executable).toMatch(/source = 'website'/);
    expect(executable).toMatch(/is_active is true/);
    expect(executable).toMatch(/user_id is null or user_id = auth\.uid\(\)/);
  });

  it('borne le format et la taille de l email et du téléphone', () => {
    expect(executable).toMatch(/char_length\(email\) <= 254/);
    expect(executable).toMatch(/email ~\*/);
    expect(executable).toMatch(/char_length\(phone\) <= 32/);
  });

  it('reste limitée à l insertion par anon et authenticated', () => {
    expect(executable).toMatch(/for insert\s+to anon, authenticated/);
  });
});
