-- F1 — NON APPLIQUÉE AU MOMENT DE SA CRÉATION.
-- À valider sur une pile Supabase de test isolée avant toute application.
--
-- Remplace les politiques administrateur qui font confiance à
-- profiles.preferences->>'role' par app_metadata.role, contrôlé par Supabase
-- Auth côté serveur. Empêche aussi les rôles publics de modifier les clés de
-- privilège conservées dans preferences pour compatibilité applicative.
--
-- Prérequis :
--   - chaque administrateur légitime possède app_metadata.role = 'admin' ;
--   - son jeton a été renouvelé après l'attribution du rôle ;
--   - le diagnostic des politiques de la base de test a été conservé.
--
-- Rollback de sécurité : ne pas restaurer les politiques fondées sur
-- profiles.preferences. En cas d'incompatibilité, corriger app_metadata ou
-- appliquer un forward-fix qui conserve public.is_admin() et le déclencheur.

begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

comment on function public.is_admin() is
  'Vrai si le jeton porte app_metadata.role = admin. app_metadata est modifiable uniquement côté serveur.';

do $$
declare
  table_name text;
  policy record;
  admin_tables text[] := array[
    'inventory',
    'inventory_movements',
    'payments',
    'refunds',
    'barcodes',
    'maintenance_logs',
    'stock_alerts',
    'newsletter_campaigns',
    'promo_codes',
    'banners'
  ];
begin
  for policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (admin_tables)
      and (
        coalesce(qual, '') ilike '%preferences%'
        or coalesce(with_check, '') ilike '%preferences%'
      )
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy.policyname,
      policy.schemaname,
      policy.tablename
    );
  end loop;

  foreach table_name in array admin_tables loop
    if to_regclass('public.' || table_name) is null then
      raise notice 'table absente, ignorée : public.%', table_name;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'drop policy if exists %I on public.%I',
      'Admins manage ' || table_name,
      table_name
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      'Admins manage ' || table_name,
      table_name
    );
  end loop;
end
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  old_preferences jsonb :=
    case
      when tg_op = 'UPDATE' then coalesce(old.preferences, '{}'::jsonb)
      else '{}'::jsonb
    end;
  new_preferences jsonb := coalesce(new.preferences, '{}'::jsonb);
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if (new_preferences -> 'role') is distinct from (old_preferences -> 'role')
       or (new_preferences -> 'admin_level') is distinct from (old_preferences -> 'admin_level') then
      raise exception 'Les clés role et admin_level de preferences ne sont pas modifiables'
        using errcode = '42501';
    end if;
  end if;

  return new;
end
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileges();

commit;
