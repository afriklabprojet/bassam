#!/usr/bin/env tsx
/**
 * Script pour créer des comptes admin en production
 *
 * Usage:
 *   pnpm tsx scripts/create-admin-prod.ts email@example.com [super_admin|admin]
 *
 * Exemple:
 *   pnpm tsx scripts/create-admin-prod.ts nouveau.admin@vip.com admin
 *   pnpm tsx scripts/create-admin-prod.ts boss@vip.com super_admin
 */

import { createClient } from '@supabase/supabase-js';

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
  console.error('❌ Usage: pnpm tsx scripts/create-admin-prod.ts <email> [admin|super_admin]');
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

    // 3. Envoyer un email de réinitialisation de mot de passe
    console.log('📧 Envoi de l\'email de réinitialisation...');
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email
    });

    if (resetError) {
      console.warn('⚠️  Erreur lors de l\'envoi de l\'email:', resetError.message);
      console.log('   L\'utilisateur devra utiliser "Mot de passe oublié" pour se connecter');
    } else {
      console.log('✅ Email de réinitialisation envoyé à', email);
    }

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
    console.log('   1. Vérifier son email pour le lien de réinitialisation');
    console.log('   2. Créer un mot de passe');
    console.log('   3. Se connecter sur', supabaseUrl.replace('https://', 'https://app.'));
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createAdminUser().catch(console.error);
