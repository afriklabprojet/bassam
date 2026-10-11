# Validation préproduction Bassam

Ce plan ne constitue ni une autorisation de déploiement, ni une validation de
la production. F1 à F5 restent non appliquées tant que les étapes ci-dessous
n'ont pas été réalisées sur une pile distincte.

## 1. Identification obligatoire de la pile de test

- Projet Supabase dédié dont le nom contient explicitement `TEST`.
- Projet Vercel distinct, sans alias ni domaine de production.
- Aucun import de données, sauvegarde, URL, clé ou compte de production.
- Comptes de test uniquement, avec des adresses fictives `@example.com`,
  `@example.org` ou `@example.net`.
- Variables conservées dans un fichier local `.env.test*` ignoré par Git.
- Hôte retapé avec `--confirm-host`; toute correspondance avec le registre de
  production provoque un arrêt.

## 2. Préparation manuelle

1. Créer les projets Supabase et Vercel de test.
2. Configurer Vercel sur Node.js 24.x.
3. Installer le schéma suivi complet dans un projet Supabase de test vide.
4. Créer trois identités fictives : administrateur, client et compte sans rôle.
5. Attribuer à l'administrateur `app_metadata.role = admin` côté serveur, puis
   renouveler son jeton. Ne pas utiliser `user_metadata` ni `preferences`.
6. Conserver le diagnostic de `pg_policies`, des triggers de `profiles` et de
   la fonction `public.is_admin()` avant chaque migration.

## 3. Ordre de validation RLS

| Étape | Fichier | Prérequis | Résultat attendu |
|---|---|---|---|
| F1 | `20261011000000_rls_use_is_admin.sql` | Administrateur fictif avec `app_metadata.role` | Admin autorisé ; client et anonyme refusés ; mutation de `role`/`admin_level` refusée |
| F2 | `20261011010000_f2_product_images_admin_only.sql` | F1 | Lecture publique conservée ; upload/suppression client refusés ; admin et service autorisés |
| F3 | `20261011020000_f3_orders_service_only.sql` | Checkout déployé avec service_role | INSERT REST client refusé ; paiement serveur et lecture de ses commandes conservés |
| F4 | `20261011030000_f4_promo_codes_private.sql` | Route de validation déployée avec client service | Énumération REST anonyme vide ; validation exacte et checkout conservés |
| F5 | `20261011040000_f5_reviews_moderated.sql` | F1 | Avis public non approuvé accepté ; auto-approbation refusée ; modération admin conservée |

Chaque migration doit d'abord être exécutée en simulation avec
`npm run apply-migration -- <fichier> --target test --confirm-host <hôte-test> --env-file .env.test.local`.
L'ajout de `--apply` exige une autorisation humaine distincte et ne fait pas
partie de cette préparation locale.

## 4. Matrice Bearer sur la pile déployée de test

| Cas | Cookies | Authorization | Attendu |
|---|---|---|---|
| Administrateur | absent | Bearer admin valide | 200 |
| Client | absent | Bearer client valide | 403 |
| Jeton expiré/révoqué | absent | Bearer invalide | 401 |
| Bearer malformé + cookie admin valide | présent | Bearer malformé | 401, aucun repli cookie |
| Session navigateur admin | présent | absent | comportement cookie existant |
| Route hors `/api/admin/*` | quelconque | Bearer présent | Bearer ignoré par le proxy |

Tester au minimum `/api/admin/stats`, une route liée à la RLS comme
`/api/admin/inventory` et `/api/admin/reviews`.

## 5. Node.js et Vercel

- Référence locale : Node.js 24.x, `npm ci`, TypeScript, ESLint, tests, puis
  `next build` avec valeurs fictives uniquement.
- La validation finale doit être répétée dans le projet Vercel de test et le
  journal doit confirmer Node.js 24.x, l'installation depuis le lockfile et
  l'absence de variables de production.
- Un build local ne valide pas les protections Preview, l'Ignored Build Step,
  les régions, les variables distantes ni les intégrations Vercel.

## 6. Résultats locaux observés le 11 octobre 2026

Ces résultats portent sur le dépôt local et les migrations non appliquées. Ils
ne constituent pas une validation Supabase ou Vercel réelle.

| Contrôle | Commande | Résultat |
|---|---|---|
| Tests applicatifs | `npm run test:run -- --maxWorkers=1 --no-file-parallelism` | 308/308, 33 fichiers |
| TypeScript | `npx tsc --noEmit` | réussi |
| ESLint | `npm run lint` | 0 erreur, 4 avertissements préexistants |
| Arbre de dépendances | `npm ls --all` | réussi |
| Cohérence du lockfile | `npm ci --dry-run --ignore-scripts` | réussi |
| Audit de production | `npm audit --omit=dev` | 0 vulnérabilité |
| Audit complet | `npm audit` | 5 alertes HIGH dans la chaîne ESLint de développement via `braces` |
| PGlite principal | `node run-rls-tests.mjs` dans une copie temporaire | 75/75 |
| PGlite complémentaire | `node run-rls-extra.mjs` dans une copie temporaire | 94/94 |
| Build isolé | `npm run build` avec Node 24.19.0 et variables fictives | réussi |

Un premier lancement ciblé de Vitest a validé 108 tests, puis a échoué avant
démarrage du worker Windows de `profile.test.ts`. Ce fichier a été relancé seul
et a réussi 11/11. La suite complète a ensuite réussi 308/308.

Les bancs PGlite ont utilisé les fichiers F1 à F5 exacts dans une arborescence
temporaire hors dépôt. Ils ne reproduisent pas Supabase Auth, PostgREST,
Storage, le renouvellement JWT ni le proxy déployé.

Les quatre avertissements ESLint concernent `AdminShell.tsx`, les pages
`paiements` et `remboursements`, ainsi que `Header.tsx`. Ils sont antérieurs à
ce lot. La correction forcée proposée par `npm audit` installerait une version
majeure incompatible de `eslint-config-next` et ne doit pas être appliquée.

## 7. Rotation des secrets et compte administrateur

1. Inventorier les noms de variables et leurs consommateurs sans copier leurs
   valeurs : Supabase public/service, paiement, webhook, e-mail, IA et WhatsApp.
2. Retirer d'abord les secrets de production des portées Preview et Development.
3. Vérifier le compte administrateur potentiellement exposé : identité,
   `app_metadata.role`, dernière connexion, sessions actives et changement de
   mot de passe effectué par le propriétaire du compte.
4. Créer les nouvelles clés côté fournisseur, les installer sur la pile de
   test, vérifier chaque flux, puis préparer une fenêtre de bascule production.
5. Pour Supabase, conserver les clés JWT legacy tant que le site, les fonctions,
   les scripts et les APK installés n'ont pas tous été migrés et validés.
6. Révoquer une ancienne clé seulement après validation, surveillance et plan
   de retour arrière documenté. Ne jamais journaliser une valeur de clé.

## 8. Risques encore ouverts

- F1 à F5 ne sont appliquées sur aucune pile Supabase réelle.
- Les administrateurs légitimes et le renouvellement de leurs jetons restent à
  vérifier sur la pile TEST avant F1.
- Les réponses 200/401/403 et l'absence de repli cookie après un Bearer invalide
  restent à valider sur le déploiement TEST.
- Les secrets de production doivent être retirés des portées Preview et
  Development avant toute validation distante.
- Le téléphone complet reste renvoyé par la route publique de suivi de commande
  tant qu'aucune décision produit distincte n'est prise.
- Les cinq alertes npm HIGH de développement restent ouvertes faute de correctif
  compatible démontré.

## 9. Conditions d'arrêt

Arrêter sans appliquer si l'identité de la cible n'est pas prouvée, si un compte
non fictif apparaît, si une politique diffère du diagnostic attendu, si un test
Bearer/RLS échoue, si une variable de production est détectée ou si le rollback
proposé rétablit une autorisation vulnérable.
