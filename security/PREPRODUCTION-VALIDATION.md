# Validation préproduction Bassam

Ce plan ne constitue ni une autorisation de déploiement, ni une validation de
la production. Les huit migrations sont validées sur la pile Supabase TEST,
avec deux cycles distants complets et nettoyés. Un audit production en lecture
seule confirme qu'elles y restent nécessaires ; aucune n'y a été appliquée.

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
- Pour le projet Vercel de production, relever sans modifier la configuration :
  la version Node.js configurée, la date du dernier déploiement réussi et la
  version Node.js affichée dans les journaux de ce déploiement.
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
Le registre npm consulté le 11 octobre 2026 publie toujours `braces@3.0.3` et
`micromatch@4.0.8` comme dernières versions. Réexaminer l'alerte uniquement
lorsqu'une nouvelle version de `braces`, `micromatch` ou de la chaîne
`eslint-config-next` pour Next.js 16 supprime la version vulnérable sans
downgrade majeur.

### 6.1 Diagnostic distant en lecture seule du 12 octobre 2026

Projet Supabase observé dans le Dashboard : nom `test`, référence
`zcflovndysgcvsdyyuxg`. Aucune requête d'écriture n'a été exécutée pendant ce
diagnostic.

| Contrôle distant | Résultat observé |
|---|---|
| Utilisateurs Auth | 0 au total, donc 0 compte non fictif |
| Migrations de préproduction | `20261011000000` à `20261011070000` présentes |
| F1 | `is_admin()` et `protect_profile_privileges()` présents ; 0 politique admin basée sur `preferences` ; 10 politiques admin utilisent `is_admin()` |
| F2 | bucket `product-images` public, limite 5 MiB, 6 types MIME ; 2 politiques d'écriture admin |
| F3 | 0 politique `INSERT` sur `orders` et `order_items` |
| F4 | 0 politique publique/anon de lecture de `promo_codes` |
| F5 | soumission publique non approuvée et modération admin présentes |
| Fonctions signalées | 6 fonctions avec `search_path` durci ; `handle_new_user()` non exécutable par `anon` ou `authenticated` |
| `rls_auto_enable()` | présente, mais non exécutable par `anon` ou `authenticated` |
| Security Advisor | 0 erreur, 2 avertissements |

Les deux avertissements restants correspondent à des comportements publics
actuellement intentionnels :

- `newsletter_subscriptions` autorise l'inscription publique par une politique
  `INSERT WITH CHECK (true)` ; les politiques de lecture et suppression
  utilisent `is_admin()`.
- le bucket public `product-images` autorise la lecture et donc le listing des
  objets ; upload et suppression restent limités aux administrateurs vérifiés.

Ces deux choix doivent être acceptés explicitement ou durcis séparément avant
la production. Ils ne remettent pas en cause les contrôles F1 à F5 ci-dessus.

### 6.2 Diagnostic Vercel et préparation de la pile TEST du 12 octobre 2026

L'inspection initiale ne montrait que le projet `bassam`, relié aux domaines de
production `vipparfumeriebar.com` et `www.vipparfumeriebar.com`. Un projet
isolé `bassam-test` a ensuite été créé sans connexion Git, domaine personnalisé
ni accès à la production, puis déployé depuis la branche locale courante.

| Contrôle distant | Résultat observé |
|---|---|
| Dernier déploiement Production | `Ready`, branche `main`, commit `41f5b4d`, créé le 1er octobre 2026, durée affichée 36 s |
| Runtime configuré | Node.js `24.x` |
| Preview active | branche `fix/header-auth-ui`, dans le même projet `bassam` |
| `NEXT_PUBLIC_SUPABASE_URL` | portée `All Environments` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | portée `All Environments` |
| `SUPABASE_SERVICE_ROLE_KEY` | portée `All Environments`, type `Config`, état `Needs Attention` |
| Projet Vercel TEST | `bassam-test`, ID `prj_n4sdnm1z8Y9RCtQlwHwMTdU10Vy2`, sans connexion Git ni domaine personnalisé |
| Variables du projet TEST | cinq variables limitées à l'environnement `Production` du projet isolé ; clé service-role de type `Secret` |
| Déploiement TEST final | `Ready`, ID `dpl_5RuEP6MXQfPDqaBKbU9nF89uxPPd`, URL stable `https://project-w2myn.vercel.app` |
| Protection du déploiement TEST | désactivée ; `/api/health` est accessible sans session Vercel |
| Contrôles HTTP sans écriture | `/`, `/api/products` et `/api/health` : 200 ; `/api/admin/stats` sans jeton ou avec jeton invalide : 401 |
| Runner distant authentifié | deux exécutions `--apply` réussies, 33/33 contrôles chacune : admin 200, client 403, autorisation invalide 401 sans repli sur un cookie admin, F1 à F5 et Storage |
| Nettoyage après chaque runner | réussi ; le contrôle indépendant final compte 0 utilisateur fictif, 0 commande, 0 code promo, 0 avis et 0 objet Storage temporaire |
| Journaux Vercel TEST | aucune entrée de niveau `error` pendant la fenêtre du second runner |

Aucune valeur de variable n'a été révélée. La portée `All Environments`
confirme cependant que les déploiements Preview et Development du projet de
production reçoivent les mêmes variables Supabase. Le projet TEST séparé est
maintenant déployé. Le fichier `vercel.json` du dépôt impose les deux alias de
production ; une première promotion TEST les a donc demandés et Vercel les a
refusés parce qu'ils appartiennent déjà à `bassam`. Le domaine de production
est resté sur le déploiement historique `dpl_CS8D2AaTds6V8e1Y45GbHGTRKhsL`.
Les déploiements TEST suivants utilisent la configuration locale ignorée
`.vercel/vercel.test.json`, identique sans le champ `alias`.

Les quatre variables Supabase/Resend sensibles ont ensuite été retirées des
portées Preview et Development du projet `bassam`. Les variables Supabase et
`RESEND_API_KEY` ciblent uniquement Production ; `SUPABASE_SERVICE_ROLE_KEY`
est de type Secret. Une nouvelle clé serveur moderne dédiée à Vercel
production a été installée sans afficher sa valeur. La clé moderne `default`,
exposée pendant l'audit, a été révoquée et la clé dédiée a été conservée.
Aucun déploiement n'a consommé ces changements.

Les clés TEST ont été transférées sans être consignées dans ce document. Le
runner a d'abord réussi en simulation avec `.env.test.local` et l'hôte
`project-w2myn.vercel.app` : cible Supabase et hôte applicatif confirmés,
aucune requête distante et aucune donnée créée. Après autorisation explicite,
deux exécutions en écriture ont créé trois identités fictives, émis leurs
sessions réelles, validé les 33 contrôles puis supprimé toutes les données.
Un audit distinct en lecture seule a confirmé le nettoyage après le second
cycle.

### 6.3 Audit production en lecture seule du 12 octobre 2026

L'audit a été exécuté par la Management API Supabase authentifiée et n'a
retourné que des agrégats, sans adresse, téléphone, jeton ni valeur de clé.

| Contrôle production | Résultat |
|---|---|
| Administrateurs `app_metadata.role = admin` | 3 |
| Sessions / refresh tokens administrateur | 0 / 0 |
| Politiques fondées sur `preferences` | 10 |
| Trigger `protect_profile_privileges` | absent |
| Politiques INSERT client sur `orders` / `order_items` | 2 |
| Politiques SELECT publiques sur `promo_codes` | 1 |
| Soumission publique d'avis | 1 politique, à remplacer par F5 |
| Bucket `product-images` | présent et public ; 2 politiques d'écriture |
| Fonctions applicatives ciblées | 6 présentes, 0 avec `search_path` durci |
| `handle_new_user()` | exécutable par `public` |
| `rls_auto_enable()` | présente et exécutable par `public` |
| Migrations `20261011000000` à `20261011070000` | 0/8 enregistrée |

Les huit fichiers ont ensuite réussi leur simulation locale ordonnée contre
l'identité production enregistrée : 8/8, zéro requête distante et zéro
écriture. La simulation utilisait un jeton factice explicitement limité à ce
contrôle hors ligne ; l'application réelle exigera un jeton Management valide,
`--apply`, `--confirm-ref`, `--confirm-name` et la seconde confirmation
`BASSAM_PRODUCTION_CONFIRM`.

Ordre de la fenêtre de production, après validation téléphone et autorisation
de déploiement :

1. déployer le backend contenant les routes serveur checkout et validation de
   code promo, puis vérifier health, authentification admin et paiement ;
2. appliquer strictement `20261011000000` à `20261011070000`, un fichier à la
   fois, sans rétablir de politique vulnérable en rollback ;
3. après chaque fichier, exécuter son diagnostic SQL et arrêter au premier
   écart ;
4. refaire les contrôles admin 200, client 403, jeton invalide 401, checkout,
   code promo, avis et Storage ;
5. surveiller les journaux avant toute révocation de clé legacy.

## 7. Rotation des secrets et compte administrateur

1. L'inventaire des consommateurs et la restriction des portées Vercel sont
   terminés.
2. Le mot de passe du compte administrateur exposé a été remplacé par une
   valeur forte, la connexion et le rôle ont été vérifiés, puis toutes les
   sessions et tous les refresh tokens administrateur ont été révoqués.
3. Le secret temporaire doit être importé par le propriétaire dans son
   gestionnaire de mots de passe, puis supprimé du poste.
4. Vercel production utilise une clé serveur moderne dédiée. La clé moderne
   exposée a été révoquée.
5. Conserver provisoirement la clé JWT legacy tant que les fonctions, scripts
   locaux et consommateurs non-Vercel n'ont pas tous été migrés et validés.
6. Ne révoquer la legacy qu'après déploiement, surveillance et preuve qu'aucun
   consommateur ne l'utilise. Ne jamais journaliser une valeur de clé.

## 8. Checklist opérationnelle de la pile TEST

Après application des migrations et déploiement du backend de test, exécuter
d'abord le validateur en simulation :

```powershell
npm run test:supabase:test -- --target test --confirm-host <ref-test>.supabase.co --confirm-app-host <backend-test>
```

Le runner ne charge jamais `.env.local`. Il lit uniquement les variables du
processus (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` et, facultativement, `APP_BASE_URL`). La simulation
n'envoie aucune requête et ne crée aucune donnée. Après vérification manuelle
des deux hôtes, ajouter `--apply`. Avant la création de comptes fictifs et de
données temporaires, le runner vérifie que la cible Supabase n'est pas connue
comme production et qu'elle ne contient que des comptes `@example.com`,
`@example.org` ou `@example.net`. Si `APP_BASE_URL` est définie, son hôte doit
être retapé avec `--confirm-app-host` et ne doit pas correspondre au registre
de production. Toute vérification incertaine échoue fermée.

| # | Action | Preuve de réussite | Arrêt immédiat si |
|---|---|---|---|
| 1 | Identifier le projet Supabase TEST | Nom contenant `TEST`, référence et hôte retapés | La cible correspond au registre de production ou reste ambiguë |
| 2 | Identifier le projet Vercel TEST | Projet distinct, sans domaine ni alias de production | Le projet ou son alias dessert la production |
| 3 | Contrôler les portées Preview/Development | Aucune variable n'utilise une valeur de production | Une valeur de production est détectée |
| 4 | Préparer données, comptes et clés fictifs | Tous les comptes utilisent les domaines `example.*` | Un compte ou un jeu de données réel apparaît |
| 5 | Appliquer F1 sur TEST | Migration réussie et diagnostic des politiques conservé | Le schéma diffère des prérequis ou la migration échoue |
| 6 | Valider les rôles administrateurs | `app_metadata.role = admin`, nouveau JWT émis | Le rôle dépend de `preferences` ou l'ancien JWT reste utilisé |
| 7 | Tester l'authentification API admin | Admin 200, client 403, jeton invalide/expiré 401 | Un statut attendu diffère |
| 8 | Tester l'absence de repli cookie | Bearer invalide + cookie admin valide donne 401 | La requête est autorisée par le cookie |
| 9 | Appliquer et tester F2 | Lecture publique conservée, écritures client refusées, admin/service autorisés | Une écriture client passe ou une lecture publique régresse |
| 10 | Appliquer et tester F3 | INSERT REST refusé et checkout complet réussi | Le checkout échoue ou un INSERT client passe |
| 11 | Déployer la route F4 puis appliquer F4 | Validation exacte réussie avant et après migration, énumération REST vide | La route serveur n'est pas déployée ou un code valide devient inutilisable |
| 12 | Appliquer et tester F5 | Soumission non approuvée acceptée, auto-approbation refusée, modération admin réussie | Une soumission légitime régresse ou un client peut modérer |
| 13 | Examiner les journaux TEST | Aucun secret, jeton ou donnée sensible dans les journaux | Une fuite ou une erreur non expliquée apparaît |
| 14 | Exécuter le contrôle final TEST | Tests, build et déploiement TEST réussis avec Node.js 24.x | Un contrôle échoue ou la version Node.js diffère |

## 9. Risques encore ouverts

- Les huit migrations sont validées sur TEST et simulées hors ligne pour la
  cible production, mais restent volontairement non appliquées. L'audit
  production confirme 10 politiques `preferences`, 2 INSERT commandes,
  1 lecture publique promo et les fonctions non durcies.
- Les identités fictives et leurs sessions ont été validées pendant deux cycles
  temporaires, puis supprimées. Aucun compte persistant n'est conservé : les
  comptes destinés au téléphone devront être créés juste avant les essais et
  supprimés ensuite.
- Les réponses admin 200, client 403 et autorisation invalide 401 sans repli
  sur un cookie admin sont validées sur le déploiement TEST. L'expiration
  naturelle suivie du renouvellement de session reste à vérifier sur Android.
- Le projet Vercel TEST `bassam-test` reste accessible sans protection Vercel ;
  il ne contient que les variables TEST minimales.
- Les avertissements Advisor sur l'inscription newsletter publique et le
  listing du bucket public doivent être acceptés ou durcis explicitement.
- Le backend corrigé n'est ni committé ni déployé. La route publique de suivi
  masque maintenant le téléphone côté serveur, mais la production historique
  ne recevra ce correctif qu'après le déploiement autorisé.
- La clé JWT legacy reste active pour compatibilité jusqu'à la validation de
  tous ses consommateurs après déploiement.
- Les scénarios S00 à S05 restent bloqués tant qu'aucun téléphone Android n'est
  connecté.
- Les cinq alertes npm HIGH de développement restent ouvertes faute de correctif
  compatible démontré.

## 10. Conditions d'arrêt

Arrêter sans appliquer si l'identité de la cible n'est pas prouvée, si un compte
non fictif apparaît, si une politique diffère du diagnostic attendu, si un test
Bearer/RLS échoue, si une variable de production est détectée ou si le rollback
proposé rétablit une autorisation vulnérable.
