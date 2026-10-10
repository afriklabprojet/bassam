#!/usr/bin/env tsx
/**
 * Crée (ou met à jour) un compte administrateur Supabase.
 *
 * SÉCURITÉ — voir scripts/lib/target-guard.ts :
 *  - SIMULATION par défaut : sans --apply, aucune requête n'est envoyée.
 *  - La cible est déclarée (--target test|production), confirmée en retapant l'hôte (--confirm-host) et comparée au registre
 *    de production du dépôt. En production, l'écriture exige en plus --confirm-ref, la variable BASSAM_PRODUCTION_CONFIRM
 *    (= hôte) et la vérification distante de la clé de service.
 *  - .env.local n'est JAMAIS chargé implicitement : variables du processus, ou --env-file explicite.
 *
 * Variables : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (jamais en argument).
 *
 * Usage :
 *   npm run create-admin -- <email> [admin|super_admin] --target <test|production> --confirm-host <hôte> [--apply] [--env-file <fichier>]
 */
import { createClient } from '@supabase/supabase-js';
import {
  describePlan,
  formatRefusal,
  planTarget,
  safeErrorMessage,
  verifyRemoteIdentity,
} from './lib/target-guard';

/** Valeurs à masquer dans tout message d'erreur (renseignées après l'analyse de la cible). */
const masked: Array<string | undefined> = [];

async function main(): Promise<number> {
  const plan = planTarget({ operation: 'create-admin', argv: process.argv.slice(2), processEnv: process.env });
  if (!plan.ok) {
    console.error(formatRefusal(plan));
    return 1;
  }
  masked.push(plan.secrets.accessToken, plan.secrets.serviceKey);

  const email = plan.positional[0];
  const adminLevel = (plan.positional[1] || 'admin') as 'admin' | 'super_admin';
  if (!email) {
    console.error('❌ Usage: npm run create-admin -- <email> [admin|super_admin] --target <test|production> --confirm-host <hôte> [--apply]');
    return 1;
  }
  if (!['admin', 'super_admin'].includes(adminLevel)) {
    console.error('❌ Le niveau admin doit être "admin" ou "super_admin"');
    return 1;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('❌ Email invalide');
    return 1;
  }

  console.log(describePlan(plan).join('\n'));
  console.log(`compte : ${email} (niveau ${adminLevel})`);

  if (plan.simulate) {
    console.log('\nSIMULATION : aucune requête n\'a été envoyée. Ajoutez --apply (et les confirmations requises) pour écrire.');
    return 0;
  }

  const identity = await verifyRemoteIdentity(plan);
  if (!identity.ok) {
    console.error(formatRefusal(identity));
    return 1;
  }
  console.log('identité de la cible vérifiée (lecture seule). Création du compte…');

  const supabase = createClient(plan.origin, plan.secrets.serviceKey as string, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Créer l'utilisateur (ou mettre à jour l'existant)
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { role: 'admin', admin_level: adminLevel },
  });

  let adminUser = created.user;
  if (createError) {
    if (!createError.message.includes('already registered')) throw createError;
    console.log('⚠️  L\'utilisateur existe déjà, mise à jour…');
    const { data: existingUser, error: getUserError } = await supabase.auth.admin.listUsers();
    if (getUserError) throw getUserError;
    const foundUser = existingUser.users.find((u) => u.email === email);
    if (!foundUser) throw new Error('Utilisateur non trouvé');
    const { error: updateError } = await supabase.auth.admin.updateUserById(foundUser.id, {
      email_confirm: true,
      app_metadata: { role: 'admin', admin_level: adminLevel },
    });
    if (updateError) throw updateError;
    console.log('✅ Utilisateur mis à jour');
    adminUser = foundUser;
  } else {
    console.log('✅ Utilisateur créé');
  }

  const userId = adminUser?.id;
  if (!userId) throw new Error('ID utilisateur manquant');

  // 2. Créer ou mettre à jour le profil
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      id: userId,
      email,
      preferences: { role: 'admin', admin_level: adminLevel, created_at: new Date().toISOString(), created_by: 'admin-script' },
    },
    { onConflict: 'id' },
  );
  if (profileError) throw profileError;
  console.log('✅ Profil configuré');

  // 3. Aucun mot de passe n'est défini ici : la personne le choisit elle-même.
  //    (Le lien de récupération n'est volontairement ni affiché ni envoyé par ce script.)
  console.log('\n🔐 L\'utilisateur doit : ouvrir /admin/login, cliquer sur « Mot de passe oublié », suivre l\'e-mail reçu, choisir son mot de passe.');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('❌ Erreur :', safeErrorMessage(err, [...masked, process.env.SUPABASE_SERVICE_ROLE_KEY]));
    process.exit(1);
  });
