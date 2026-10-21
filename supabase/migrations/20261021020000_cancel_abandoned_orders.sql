-- Annulation automatique des commandes abandonnées — NON APPLIQUÉE AU MOMENT DE SA CRÉATION.
-- À valider sur la pile Supabase TEST avant la production.
--
-- Une commande restée « en attente » sans paiement plus de 48 h passe en
-- « annulée ». Dans la même instruction, l'usage de code promo qu'elle détient
-- encore est rendu, et une note visible dans l'admin est ajoutée.
-- payment_status reste 'pending' : si le client paie malgré tout plus tard,
-- le webhook Jeko (qui ne s'arrête que sur paid / failed / refunded) remet la
-- commande en « confirmée / payée » et recompte son usage promo.
-- Aucun e-mail n'est envoyé (seul le trigger updated_at s'exécute).
--
-- Rollback de sécurité : désactiver la tâche avec
-- select cron.unschedule('cancel-abandoned-orders');
-- les commandes annulées par ce mécanisme se retrouvent grâce à leur note.

begin;

create index if not exists orders_abandoned_idx
  on public.orders (created_at)
  where status = 'pending' and payment_status = 'pending';

-- Annule les commandes impayées depuis plus de p_max_age ; renvoie le nombre de commandes annulées.
create or replace function public.cancel_abandoned_orders(p_max_age interval default interval '48 hours')
returns integer
language sql
security invoker
set search_path = ''
as $$
  with abandoned as (
    select id, promo_code_id, promo_use_counted as was_counted
    from public.orders
    where status = 'pending'
      and payment_status = 'pending'
      and created_at < now() - p_max_age
    for update skip locked
  ), cancelled as (
    update public.orders o
    set status = 'cancelled',
        promo_use_counted = false,
        notes = concat_ws(
          E'\n',
          nullif(o.notes, ''),
          'Annulée automatiquement : non payée après '
            || (extract(epoch from p_max_age) / 3600)::integer || ' h.'
        )
    from abandoned a
    where o.id = a.id
    returning a.promo_code_id, a.was_counted
  ), per_code as (
    select promo_code_id, count(*) as n
    from cancelled
    where was_counted and promo_code_id is not null
    group by promo_code_id
  ), unclaimed as (
    update public.promo_codes p
    set uses_count = greatest(coalesce(p.uses_count, 0) - pc.n, 0)
    from per_code pc
    where p.id = pc.promo_code_id
    returning 1
  )
  select count(*)::integer from cancelled;
$$;

revoke execute on function public.cancel_abandoned_orders(interval) from public, anon, authenticated;
grant execute on function public.cancel_abandoned_orders(interval) to service_role;

-- Toutes les heures à la 37e minute.
select cron.schedule(
  'cancel-abandoned-orders',
  '37 * * * *',
  $cron$select public.cancel_abandoned_orders()$cron$
);

commit;
