-- Cycle de vie des usages de codes promo — NON APPLIQUÉE AU MOMENT DE SA CRÉATION.
-- À valider sur la pile Supabase TEST avant la production.
--
-- Un usage est réservé à la création de la commande (max_uses toujours
-- respecté), puis :
--   - confirmé par le paiement (webhook Jeko) ;
--   - rendu si le paiement échoue, si l'admin annule la commande impayée, ou
--     si la commande reste impayée plus de 24 h (tâche pg_cron horaire, qui
--     rattrape aussi un paiement échoué dont la libération n'a pas abouti) ;
--   - jamais rendu pour une commande payée ou remboursée ;
--   - recompté si une commande dont l'usage a été rendu est finalement payée
--     (le client a payé : on ne le refuse pas, quitte à dépasser max_uses).
-- Le statut des commandes n'est jamais modifié par ces fonctions.
--
-- Chaque fonction tient en une instruction : Postgres réévalue le WHERE après
-- le verrou de ligne, donc aucune réservation concurrente ne dépasse le plafond
-- et aucune libération n'est comptée deux fois. Exécution réservée au rôle
-- serveur (service_role).
--
-- Rollback de sécurité : migration additive (l'ancien code ignore les nouvelles
-- colonnes). Corriger par forward-fix ; désactiver la tâche avec
-- select cron.unschedule('release-stale-promo-reservations');

begin;

alter table public.orders
  add column if not exists promo_code_id uuid references public.promo_codes (id) on delete set null,
  add column if not exists promo_use_counted boolean not null default false;

create index if not exists orders_promo_code_id_idx
  on public.orders (promo_code_id)
  where promo_code_id is not null;

drop index if exists public.orders_stale_promo_use_idx;
create index orders_stale_promo_use_idx
  on public.orders (created_at)
  where promo_use_counted and payment_status in ('pending', 'failed');

-- Réserve un usage si le plafond le permet.
create or replace function public.claim_promo_code_use(p_promo_id uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with claimed as (
    update public.promo_codes
    set uses_count = coalesce(uses_count, 0) + 1
    where id = p_promo_id
      and (max_uses is null or coalesce(uses_count, 0) < max_uses)
    returning 1
  )
  select exists (select 1 from claimed);
$$;

-- Rend un usage réservé pour une commande qui n'a pas pu être créée.
create or replace function public.unclaim_promo_code_use(p_promo_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.promo_codes
  set uses_count = greatest(coalesce(uses_count, 0) - 1, 0)
  where id = p_promo_id;
$$;

-- Rend l'usage compté d'une commande (paiement échoué, annulation) ; sans effet s'il est déjà rendu
-- ou si la commande a été payée entre-temps (une annulation admin concurrente d'un paiement).
create or replace function public.release_order_promo(p_order_id uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with released as (
    update public.orders
    set promo_use_counted = false
    where id = p_order_id
      and promo_use_counted
      and payment_status is distinct from 'paid'
      and payment_status is distinct from 'refunded'
    returning promo_code_id
  ), unclaimed as (
    update public.promo_codes p
    set uses_count = greatest(coalesce(p.uses_count, 0) - 1, 0)
    from released r
    where p.id = r.promo_code_id
    returning 1
  )
  select exists (select 1 from released);
$$;

-- Recompte l'usage d'une commande payée dont l'usage avait été rendu ; sans effet sinon.
create or replace function public.consume_order_promo_on_payment(p_order_id uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  with consumed as (
    update public.orders
    set promo_use_counted = true
    where id = p_order_id and promo_code_id is not null and not promo_use_counted
    returning promo_code_id
  ), counted as (
    update public.promo_codes p
    set uses_count = coalesce(p.uses_count, 0) + 1
    from consumed c
    where p.id = c.promo_code_id
    returning 1
  )
  select exists (select 1 from consumed);
$$;

-- Rend les usages des commandes impayées depuis plus de p_max_age ; renvoie le nombre de commandes libérées.
-- Inclut les paiements échoués dont la libération immédiate (webhook) n'a pas abouti.
create or replace function public.release_stale_promo_reservations(p_max_age interval default interval '24 hours')
returns integer
language sql
security invoker
set search_path = ''
as $$
  with stale as (
    select id
    from public.orders
    where promo_use_counted
      and payment_status in ('pending', 'failed')
      and created_at < now() - p_max_age
    for update skip locked
  ), released as (
    update public.orders o
    set promo_use_counted = false
    from stale s
    where o.id = s.id
    returning o.promo_code_id
  ), per_code as (
    select promo_code_id, count(*) as n
    from released
    where promo_code_id is not null
    group by promo_code_id
  ), unclaimed as (
    update public.promo_codes p
    set uses_count = greatest(coalesce(p.uses_count, 0) - pc.n, 0)
    from per_code pc
    where p.id = pc.promo_code_id
    returning 1
  )
  select count(*)::integer from released;
$$;

revoke execute on function public.claim_promo_code_use(uuid) from public, anon, authenticated;
revoke execute on function public.unclaim_promo_code_use(uuid) from public, anon, authenticated;
revoke execute on function public.release_order_promo(uuid) from public, anon, authenticated;
revoke execute on function public.consume_order_promo_on_payment(uuid) from public, anon, authenticated;
revoke execute on function public.release_stale_promo_reservations(interval) from public, anon, authenticated;

grant execute on function public.claim_promo_code_use(uuid) to service_role;
grant execute on function public.unclaim_promo_code_use(uuid) to service_role;
grant execute on function public.release_order_promo(uuid) to service_role;
grant execute on function public.consume_order_promo_on_payment(uuid) to service_role;
grant execute on function public.release_stale_promo_reservations(interval) to service_role;

create extension if not exists pg_cron with schema pg_catalog;

-- Toutes les heures à la 17e minute ; cron.schedule met à jour une tâche du même nom.
select cron.schedule(
  'release-stale-promo-reservations',
  '17 * * * *',
  $cron$select public.release_stale_promo_reservations()$cron$
);

commit;
