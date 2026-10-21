# Exploitation Supabase : tâches planifiées, codes promo et commandes

Ce document décrit ce qui tourne en base depuis les migrations des 20 et 21 octobre 2026, comment le vérifier et comment revenir en arrière. Les requêtes se lancent dans le **SQL Editor** de Supabase, en ciblant d'abord le projet TEST (`zcflovndysgcvsdyyuxg`), puis la production (`olpttunchyheradgukdc`, projet « e-commerce »).

## 1. Migrations appliquées

Toutes sont appliquées et enregistrées dans `supabase_migrations.schema_migrations`, en TEST comme en production. Elles ont été appliquées avec le script protégé `npm run apply-migration` (simulation, puis `--apply`, avec la double confirmation pour la production).

| Version | Objet |
|---|---|
| `20261001000000_assistant_unanswered` | Journal des questions sans réponse de l'assistant IA. Elle manquait en production, où elle a été rattrapée le 21/10. |
| `20261020000000_newsletter_insert_hardening` | Inscription publique à la newsletter restreinte : source `website`, inscription active, `user_id` vide ou égal à l'utilisateur connecté, e-mail et téléphone valides. |
| `20261021000000_promo_reservation_lifecycle` | Cycle de vie des usages de codes promo (voir 3) et tâche `release-stale-promo-reservations`. |
| `20261021010000_promo_reconcile_paid_orders` | Tâche `reconcile-paid-order-promo-uses`. |
| `20261021020000_cancel_abandoned_orders` | Annulation des commandes impayées après 48 h (voir 4). |
| `20261021030000_rls_initplan_and_fk_indexes` | `auth.uid()` et `auth.jwt()` évalués une fois par requête dans 13 policies, et index sur 13 clés étrangères. Aucun droit n'est modifié. |

Une migration déjà appliquée ne se modifie pas : toute correction passe par une nouvelle migration.

## 2. Tâches planifiées (`pg_cron`)

| Tâche | Horaire | Effet |
|---|---|---|
| `release-stale-promo-reservations` | toutes les heures, minute 17 | Rend l'usage de code promo des commandes impayées, ou dont le paiement a échoué, depuis plus de 24 h |
| `cancel-abandoned-orders` | toutes les heures, minute 37 | Annule les commandes en attente et impayées depuis plus de 48 h |
| `reconcile-paid-order-promo-uses` | toutes les heures, minute 47 | Recompte l'usage des commandes payées qui ne le détiennent plus |

Vérifier les tâches et leurs dernières exécutions :

```sql
select jobname, schedule, active from cron.job order by jobname;

select j.jobname, d.status, d.return_message, d.start_time
from cron.job_run_details d
join cron.job j on j.jobid = d.jobid
order by d.start_time desc
limit 20;
```

`status` indique si l'exécution a réussi. `return_message` vaut `1 row` : il ne donne **pas** le nombre de commandes traitées. Pour connaître les volumes, interrogez les données, par exemple les commandes annulées automatiquement par jour (voir 4). Pour suspendre une tâche :

```sql
select cron.unschedule('cancel-abandoned-orders');
```

Pour la réactiver, relancer la migration qui la crée : `cron.schedule` met à jour une tâche du même nom.

## 3. Codes promo

Deux colonnes de `orders` décrivent l'usage du code :

- `promo_code_id` : le code appliqué à la commande ;
- `promo_use_counted` : vaut `true` tant que la commande détient un usage compté dans `promo_codes.uses_count`.

Cycle de vie :

1. **Commande** : l'usage est réservé dans la limite de `max_uses`, et la commande est refusée si le code est épuisé.
2. **Paiement réussi** (webhook Jeko) : l'usage est conservé.
3. **L'usage est rendu** si le paiement échoue, si l'admin annule une commande impayée, ou si la commande reste impayée 24 h.
4. **Paiement tardif** d'une commande dont l'usage a été rendu : l'usage est recompté. Le client ayant payé, `max_uses` peut alors être dépassé d'une unité.

Les compteurs ne changent que par des fonctions SQL, chacune en une seule instruction et exécutable par `service_role` uniquement : `claim_promo_code_use`, `unclaim_promo_code_use`, `release_order_promo`, `consume_order_promo_on_payment`, `release_stale_promo_reservations` et `reconcile_paid_order_promo_uses`. Ne pas modifier `uses_count` à la main pendant qu'une promotion est en cours.

Contrôle de cohérence : `usages_detenus` compte les usages rattachés aux commandes passées depuis le 21/10. Pour un code créé après cette date, il doit être égal à `uses_count`. Pour un code plus ancien, `uses_count` contient aussi ses usages historiques, que la migration a conservés sans les rattacher à des commandes : un écart égal au nombre d'usages antérieurs au 21/10 est donc normal, et ne doit pas être « corrigé ».

```sql
select p.code, p.uses_count,
       count(o.id) filter (where o.promo_use_counted) as usages_detenus
from promo_codes p
left join orders o on o.promo_code_id = p.id
group by p.id, p.code, p.uses_count
order by p.code;
```

## 4. Commandes abandonnées

Une commande `pending` / `pending` depuis plus de 48 h passe en `cancelled` :

- `payment_status` reste `pending` ;
- la note « Annulée automatiquement : non payée après 48 h. » est ajoutée à la suite de la note du client ;
- aucun e-mail n'est envoyé.

Si le client paie malgré tout, le webhook Jeko remet la commande en `confirmed` / `paid`.

Le premier passage, le 21/10, a annulé les 28 commandes en attente du 16 juin au 12 octobre.

Retrouver les commandes annulées par ce mécanisme :

```sql
select id, created_at, total_amount
from orders
where notes like '%Annulée automatiquement : non payée après%'
  and status = 'cancelled' and payment_status = 'pending'
order by created_at;
```

Volumes par jour (date de passage en annulée) :

```sql
select updated_at::date as jour, count(*)
from orders
where notes like '%Annulée automatiquement : non payée après%'
  and status = 'cancelled'
group by 1
order by 1 desc;
```

Remettre une commande en attente (après avoir suspendu la tâche si besoin). Le `WHERE` ne restaure qu'une commande **toujours** annulée automatiquement et impayée au moment de l'écriture. Une commande payée entre-temps (le webhook l'a repassée en `confirmed` / `paid`) n'est donc jamais rétrogradée, et la requête ne modifie alors aucune ligne :

```sql
update orders
set status = 'pending',
    notes = nullif(
      replace(
        replace(notes, E'\nAnnulée automatiquement : non payée après 48 h.', ''),
        'Annulée automatiquement : non payée après 48 h.', ''
      ),
      ''
    )
where id = '<id>'
  and status = 'cancelled'
  and payment_status = 'pending'
  and notes like '%Annulée automatiquement : non payée après 48 h.%';
```

## 5. Mots de passe

- **Règles** : au moins 8 caractères, avec au moins une lettre et un chiffre. Elles sont appliquées à deux endroits, qu'il faut garder synchronisés :
  - Supabase : réglages Auth du mot de passe (longueur minimale 8, caractères requis « lettres et chiffres »), soit `password_min_length` et `password_required_characters` dans la Management API ;
  - le site : `lib/password-policy.ts`.
- **Mots de passe compromis** : le site interroge Pwned Passwords dans le navigateur, au moment de l'inscription et du changement de mot de passe (`lib/pwned-password.ts`). Seuls 5 caractères de l'empreinte SHA-1 sont envoyés. Si le service est indisponible, la vérification est ignorée. La protection native de Supabase (`auth_leaked_password_protection`) demande l'offre Pro.
- **Messages d'erreur** : Supabase répond en anglais. `lib/auth-errors.ts` traduit tous ses codes, et un code inconnu affiche un message générique en français.
- **Délai d'application** : un changement de réglage Auth via l'API ou le tableau de bord met environ une minute à s'appliquer. Pour le vérifier, n'utilisez pas une inscription qui pourrait créer un vrai compte. Testez plutôt un mot de passe trop court avec une adresse `@example.com` : Supabase refuse cette adresse si le mot de passe passe la règle, donc aucun compte ne peut être créé.

## 6. Scripts et accès

Les scripts ne chargent **jamais** un fichier d'environnement implicitement : passez-le avec `--env-file`. Un fichier `.env.test*` est obligatoire pour une cible TEST.

| Script | Variables requises |
|---|---|
| `npm run apply-migration` | `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_ACCESS_TOKEN` (jeton personnel Supabase, utilisé pour la Management API) |
| `npm run test:supabase:test` (`validate-supabase-test`) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` ; aucun jeton personnel n'est nécessaire |

Pour `apply-migration`, créez un jeton dédié avec l'accès en écriture à la base. Ne le collez jamais dans une conversation, et révoquez-le après usage. Les jetons utilisés les 20 et 21/10 sont révoqués, et les lignes `SUPABASE_ACCESS_TOKEN=` de `.env.local` et `.env.test.local` sont vides.

## 7. Points ouverts

- **Avis Supabase `multiple_permissive_policies`** (63) : des policies de lecture publique et d'écriture admin se superposent. Le gain d'une fusion est négligeable au volume actuel, pour un risque de modifier les droits. Plusieurs policies d'écriture vérifient `auth.jwt() ->> 'role' = 'service_role'`, alors que ce rôle contourne déjà la RLS : elles sont sans effet.
- **Avis `unused_index`** : index récents, ou tables encore peu utilisées.
- **Limitation de débit** : elle est gardée en mémoire, par instance Vercel. Une limite partagée demande un service externe (Upstash ou équivalent).
- **Alertes npm `braces`** : elles ne touchent que les outils de développement (ESLint), et aucune version corrigée n'existe à ce jour.
