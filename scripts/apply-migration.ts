#!/usr/bin/env npx tsx
/**
 * Applique un fichier SQL de supabase/migrations sur le projet Supabase via la
 * Management API (aucun mot de passe Postgres ni psql requis).
 *
 * Usage :
 *   npm run apply-migration -- supabase/migrations/20261001000000_assistant_unanswered.sql
 *
 * Prérequis dans .env.local (jamais commité) :
 *   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
 *   SUPABASE_ACCESS_TOKEN=sbp_...   (Supabase > Account > Access Tokens)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const file = process.argv[2];
const token = process.env.SUPABASE_ACCESS_TOKEN;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!file) {
  console.error('❌ Usage : npm run apply-migration -- <fichier.sql>');
  process.exit(1);
}
if (!token || !url) {
  console.error('❌ SUPABASE_ACCESS_TOKEN et NEXT_PUBLIC_SUPABASE_URL doivent être définis dans .env.local');
  process.exit(1);
}

const projectRef = new URL(url).hostname.split('.')[0];
const sql = readFileSync(resolve(process.cwd(), file), 'utf8');

console.log(`▶ Projet : ${projectRef}`);
console.log(`▶ Fichier : ${file} (${sql.length} caractères)`);

async function main() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.text();
  if (!res.ok) {
    console.error(`❌ Échec (${res.status}) : ${body}`);
    process.exit(1);
  }
  console.log('✅ Migration appliquée.');
}

main().catch((err) => {
  console.error('❌ Erreur :', err instanceof Error ? err.message : err);
  process.exit(1);
});
