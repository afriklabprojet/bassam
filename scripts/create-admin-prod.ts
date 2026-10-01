#!/usr/bin/env tsx
/**
 * Script pour créer des comptes admin en production
 *
 * Usage:
 *   npm run create-admin -- email@example.com [super_admin|admin]
 *
 * Exemple:
 *   npm run create-admin -- nouveau.admin@exemple.com admin
 *   npm run create-admin -- boss@exemple.com super_admin
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Charge .env.local (ignoré par git) ; les variables déjà définies dans le shell restent prioritaires.
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Vérifier les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Parse des arguments
const email = process.argv[2];
const adminLevel = (process.argv[3] || 'admin') as 'admin' | 'super_admin';

if (!email) {
  console.error('❌ Usage: npm run create-admin -- <email> [admin|super_admin]');
  process.exit(1);
}

if (!['admin', 'super_admin'].includes(adminLevel)) {
  console.error('❌ Le niveau admin doit être "admin" ou "super_admin"');
  process.exit(1);
}

// Validation email basique
if (!email.includes('@') || !email.includes('.')) {
  console.error('❌ Email invalide:', email);
  process.exit(1);
}

console.log('🚀 Création d\'un compte admin en production...');
console.log('   Email:', email);
console.log('   Niveau:', adminLevel);
console.log('   URL Supabase:', supabaseUrl);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    // 1. Créer l'utilisateur
    console.log('📝 Création de l\'utilisateur...');
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      app_metadata: {
        role: 'admin',
        admin_level: adminLevel
      }
    });

    if (createError) {
      if (createError.message.includes('already registered')) {
        console.log('⚠️  L\'utilisateur existe déjà, mise à jour...');

        // Récupérer l'utilisateur existant
        const { data: existingUser, error: getUserError } = await supabase.auth.admin.listUsers();
        if (getUserError) throw getUserError;

        const foundUser = existingUser.users.find(u => u.email === email);
        if (!foundUser) throw new Error('Utilisateur non trouvé');

        // Mettre à jour les métadonnées
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          foundUser.id,
          {
            email_confirm: true,
            app_metadata: {
              role: 'admin',
              admin_level: adminLevel
            }
          }
        );

        if (updateError) throw updateError;
        console.log('✅ Utilisateur mis à jour:', foundUser.id);

        // Utiliser l'utilisateur existant
        user.user = foundUser;
      } else {
        throw createError;
      }
    } else {
      console.log('✅ Utilisateur créé:', user.user?.id);
    }

    const userId = user.user?.id;
    if (!userId) throw new Error('ID utilisateur manquant');

    // 2. Créer ou mettre à jour le profil
    console.log('📝 Configuration du profil...');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email,
        preferences: {
          role: 'admin',
          admin_level: adminLevel,
          created_at: new Date().toISOString(),
          created_by: 'admin-script'
        }
      }, {
        onConflict: 'id'
      });

    if (profileError) throw profileError;
    console.log('✅ Profil configuré');

    // 3. Aucun mot de passe n'est défini ici : la personne le choisit elle-même.
    //    (Le lien de récupération n'est volontairement ni affiché ni envoyé par ce script.)

    // 4. Résumé
    console.log('');
    console.log('✨ Compte admin créé avec succès!');
    console.log('');
    console.log('📋 Résumé:');
    console.log('   ID:', userId);
    console.log('   Email:', email);
    console.log('   Rôle:', 'admin');
    console.log('   Niveau:', adminLevel);
    console.log('   Email confirmé:', '✓');
    console.log('');
    console.log('🔐 L\'utilisateur doit:');
    console.log('   1. Ouvrir /admin/login sur le site');
    console.log('   2. Cliquer sur « Mot de passe oublié » et suivre l\'email reçu');
    console.log('   3. Choisir son mot de passe puis se connecter');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createAdminUser().catch(console.error);
