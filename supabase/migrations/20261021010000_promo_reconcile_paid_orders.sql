-- Rattrapage des usages de codes promo des commandes payées — NON APPLIQUÉE AU MOMENT DE SA CRÉATION.
-- À valider sur la pile Supabase TEST avant la production.
--
-- Complète 20261021000000_promo_reservation_lifecycle. Une commande payée après
-- la libération de son usage est recomptée par le webhook
-- (consume_order_promo_on_payment). Si cet appel échoue, la commande reste
-- payée avec promo_use_counted = false, et ni le webhook (déjà en état final)
-- ni release_stale_promo_reservations (commandes impayées) ne la reprennent.
-- Cette tâche horaire recompte ces usages ; elle est sans effet sur une
-- commande déjà comptée, sans code promo, ou dont le code a été supprimé.
--
-- Rollback de sécurité : migration additive. Désactiver la tâche avec
-- select cron.unschedule('reconcile-paid-order-promo-uses');

begin;

create index if not exists orders_paid_promo_uncounted_idx
  on public.orders (id)
  where payment_status = 'paid' and promo_code_id is not null and not promo_use_counted;

-- Recompte l'usage des commandes payées qui n'en détiennent pas ; renvoie le nombre de commandes rattrapées.
create or replace function public.reconcile_paid_order_promo_uses()
returns integer
language sql
security invoker
set search_path = ''
as $$
  with missed as (
    select id
    from public.orders
    where payment_status = 'paid'
      and promo_code_id is not null
      and not promo_use_counted
    for update skip locked
  ), recounted as (
    update public.orders o
    set promo_use_counted = true
    from missed m
    where o.id = m.id
    returning o.promo_code_id
  ), per_code as (
    select promo_code_id, count(*) as n
    from recounted
    group by promo_code_id
  ), bumped as (
    update public.promo_codes p
    set uses_count = coalesce(p.uses_count, 0) + pc.n
    from per_code pc
    where p.id = pc.promo_code_id
    returning 1
  )
  select count(*)::integer from recounted;
$$;

revoke execute on function public.reconcile_paid_order_promo_uses() from public, anon, authenticated;
grant execute on function public.reconcile_paid_order_promo_uses() to service_role;

-- Toutes les heures à la 47e minute, décalée de la libération (17e minute).
select cron.schedule(
  'reconcile-paid-order-promo-uses',
  '47 * * * *',
  $cron$select public.reconcile_paid_order_promo_uses()$cron$
);

commit;
