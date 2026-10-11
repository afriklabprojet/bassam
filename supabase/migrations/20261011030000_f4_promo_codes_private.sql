-- F4 — NON APPLIQUÉE AU MOMENT DE SA CRÉATION.
-- À valider après F1 et après déploiement de la route de validation utilisant
-- createServiceClient(). Dans l'ordre inverse, tous les codes paraîtraient
-- invalides aux clients.
--
-- Rollback de sécurité : ne pas rétablir la lecture publique de la table.
-- Corriger la route serveur par forward-fix.

begin;

do $$
declare
  policy record;
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'F1 doit être appliquée avant F4';
  end if;

  for policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'promo_codes'
      and cmd = 'SELECT'
      and (
        roles @> array['public']::name[]
        or roles @> array['anon']::name[]
      )
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy.policyname,
      policy.schemaname,
      policy.tablename
    );
  end loop;
end
$$;

commit;
