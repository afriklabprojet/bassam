#!/usr/bin/env npx tsx
/**
 * Crée un compte admin démo dans Supabase.
 *
 * Usage :
 *   npx tsx scripts/create-admin.ts
 *
 * Nécessite SUPABASE_SERVICE_ROLE_KEY dans .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '❌ Variables manquantes. Ajoutez dans .env.local :\n' +
    '   NEXT_PUBLIC_SUPABASE_URL=...\n' +
    '   SUPABASE_SERVICE_ROLE_KEY=...'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = 'admin@vip-parfumerie.com';
const ADMIN_PASSWORD = 'Admin2024!VIP';

async function main() {
  console.log('🔑 Création du compte admin démo…\n');

  // Vérifier si l'utilisateur existe déjà
  const { data: existing } = await supabase.auth.admin.listUsers();
  const alreadyExists = existing?.users?.find((u) => u.email === ADMIN_EMAIL);

  if (alreadyExists) {
    // Mettre à jour le rôle si nécessaire
    const role = (alreadyExists.app_metadata as Record<string, unknown>)?.role;
    if (role === 'admin') {
      console.log('✅ Compte admin déjà existant :\n');
      console.log(`   📧 Email    : ${ADMIN_EMAIL}`);
      console.log(`   🔒 Password : ${ADMIN_PASSWORD}`);
      console.log(`   👤 Role     : admin`);
      console.log(`   🆔 ID       : ${alreadyExists.id}\n`);
      return;
    }

    // Promouvoir en admin
    const { error } = await supabase.auth.admin.updateUserById(alreadyExists.id, {
      app_metadata: { role: 'admin' },
    });
    if (error) {
      console.error('❌ Erreur promotion admin :', error.message);
      process.exit(1);
    }
    console.log('✅ Utilisateur existant promu admin :\n');
    console.log(`   📧 Email    : ${ADMIN_EMAIL}`);
    console.log(`   🔒 Password : ${ADMIN_PASSWORD}`);
    console.log(`   👤 Role     : admin`);
    console.log(`   🆔 ID       : ${alreadyExists.id}\n`);
    return;
  }

  // Créer le nouvel utilisateur admin
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata: { role: 'admin' },
    user_metadata: {
      full_name: 'Administrateur VIP',
      first_name: 'Admin',
      last_name: 'VIP',
    },
  });

  if (error) {
    console.error('❌ Erreur création :', error.message);
    process.exit(1);
  }

  // Créer le profil dans la table profiles
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    email: ADMIN_EMAIL,
    full_name: 'Administrateur VIP',
    phone: '+225 0700000000',
  });

  if (profileError) {
    console.warn('⚠️  Profil non créé (la table profiles existe-t-elle ?) :', profileError.message);
  }

  console.log('✅ Compte admin démo créé avec succès !\n');
  console.log('   ┌──────────────────────────────────────┐');
  console.log(`   │ 📧 Email    : ${ADMIN_EMAIL}  │`);
  console.log(`   │ 🔒 Password : ${ADMIN_PASSWORD}        │`);
  console.log('   │ 👤 Role     : admin                   │');
  console.log(`   │ 🆔 ID       : ${data.user.id}│`);
  console.log('   └──────────────────────────────────────┘\n');
  console.log('   → Connectez-vous sur /admin/login');
}

main();
