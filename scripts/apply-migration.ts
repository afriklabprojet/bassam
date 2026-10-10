#!/usr/bin/env npx tsx
/**
 * Applique un fichier SQL de supabase/migrations sur un projet Supabase via la Management API
 * (aucun mot de passe Postgres ni psql requis).
 *
 * SÉCURITÉ — voir scripts/lib/target-guard.ts :
 *  - SIMULATION par défaut : sans --apply, rien n'est envoyé (aucune requête distante).
 *  - La cible est déclarée (--target test|production) et confirmée en retapant l'hôte (--confirm-host) ;
 *    l'hôte et la référence du projet sont aussi comparés au registre de production du dépôt.
 *  - .env.local n'est JAMAIS chargé implicitement : variables du processus, ou --env-file explicite
 *    (.env.test* obligatoire pour une cible de test).
 *  - Avant d'écrire, le projet est retrouvé par la Management API (lecture seule) : sa référence doit correspondre ;
 *    cible de test : le nom doit contenir « test » ; production : --confirm-name doit égaler le nom réel.
 *
 * Variables : NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co , SUPABASE_ACCESS_TOKEN=sbp_… (jamais en argument).
 *
 * Exemples :
 *   Simulation (test) :
 *     npm run apply-migration -- supabase/migrations/X.sql --target test --confirm-host <ref>.supabase.co --env-file .env.test
 *   Écriture en production (réservée, doubles confirmations — voir le plan de sécurité) :
 *     BASSAM_PRODUCTION_CONFIRM=<hôte> npm run apply-migration -- supabase/migrations/X.sql --target production \
 *       --confirm-host <hôte> --confirm-ref <ref> --confirm-name "<nom du projet>" --apply --env-file .env.local
 */
import { readFileSync } from 'node:fs';
import {
  describePlan,
  formatRefusal,
  planTarget,
  resolveMigrationFile,
  safeErrorMessage,
  verifyRemoteIdentity,
} from './lib/target-guard';

/** Valeurs à masquer dans tout message d'erreur (renseignées après l'analyse de la cible). */
const masked: Array<string | undefined> = [];

async function main(): Promise<number> {
  const plan = planTarget({ operation: 'apply-migration', argv: process.argv.slice(2), processEnv: process.env });
  if (!plan.ok) {
    console.error(formatRefusal(plan));
    return 1;
  }
  masked.push(plan.secrets.accessToken, plan.secrets.serviceKey);
  const file = resolveMigrationFile(plan.positional[0], process.cwd());
  if (!file.ok) {
    console.error(formatRefusal(file));
    return 1;
  }
  const sql = readFileSync(file.path, 'utf8');
  console.log(describePlan(plan).join('\n'));
  console.log(`fichier : ${plan.positional[0]} (${sql.length} caractères)`);

  if (plan.simulate) {
    console.log('\nSIMULATION : aucune requête n\'a été envoyée. Ajoutez --apply (et les confirmations requises) pour écrire.');
    return 0;
  }

  const identity = await verifyRemoteIdentity(plan);
  if (!identity.ok) {
    console.error(formatRefusal(identity));
    return 1;
  }
  console.log('identité de la cible vérifiée (lecture seule). Envoi de la migration…');

  const res = await fetch(`https://api.supabase.com/v1/projects/${plan.ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${plan.secrets.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
    redirect: 'error',
  });
  if (!res.ok) {
    // Le corps de réponse peut contenir du SQL ou des détails : on n'affiche que le statut.
    console.error(`❌ Échec (HTTP ${res.status}).`);
    return 1;
  }
  console.log('✅ Migration appliquée.');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('❌ Erreur :', safeErrorMessage(err, [...masked, process.env.SUPABASE_ACCESS_TOKEN]));
    process.exit(1);
  });
