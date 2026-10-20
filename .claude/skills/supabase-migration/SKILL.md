---
name: supabase-migration
description: Crée une nouvelle migration SQL Supabase selon les conventions du repo (nom horodaté, transaction, en-tête de rollback, RLS, test statique associé). À utiliser quand l'utilisateur veut ajouter une table, une colonne, une policy RLS, une fonction SQL, un bucket Storage ou modifier le schéma.
---

# Nouvelle migration Supabase

## 1. Nommer le fichier

- Liste `supabase/migrations/` et prends le dernier horodatage.
- Nouveau fichier : `supabase/migrations/YYYYMMDDHHMMSS_description_snake_case.sql`, strictement postérieur au dernier (l'ordre lexical est l'ordre d'application).
- Ne modifie jamais une migration déjà existante : corrige par une nouvelle migration (forward-fix).

## 2. Écrire le SQL

Modèle :

```sql
-- <Ce que fait la migration et pourquoi, en français.>
--
-- Rollback de sécurité : <comment revenir en arrière, ou pourquoi seul un
-- forward-fix est acceptable>.

begin;

-- ...

commit;
```

Règles :
- Nouvelle table : `alter table ... enable row level security;` puis des policies explicites par opération (select / insert / update / delete).
- Accès admin : `public.is_admin()`. Jamais `auth.role() = 'authenticated'` seul pour une écriture.
- Fonctions : `set search_path = ''`, objets qualifiés (`public.x`), `security definer` seulement si nécessaire, puis `revoke execute ... from public, anon, authenticated` si la fonction n'est pas appelée par l'API.
- Données réservées au serveur (commandes, codes promo…) : aucune policy pour `anon`/`authenticated`, accès via le client service côté serveur uniquement.
- Si le schéma de référence est concerné, mets aussi à jour `supabase/schema.sql`.

## 3. Ajouter le test

Pour toute migration qui touche à la sécurité (RLS, droits, fonctions, Storage), ajoute des assertions dans `__tests__/security/` sur le modèle de `rls-preproduction-migrations.test.ts` : lecture du fichier SQL, retrait des commentaires, `toMatch` / `not.toMatch` sur les clauses attendues et interdites.

Lance `npx vitest run __tests__/security`.

## 4. Relire

Lance l'agent `supabase-rls-reviewer` sur la migration.

N'applique pas la migration sur une base distante (`npm run apply-migration`, MCP Supabase) sans accord explicite de l'utilisateur.
