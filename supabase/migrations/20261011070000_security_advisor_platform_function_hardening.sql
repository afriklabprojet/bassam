-- Retire l'exposition RPC d'une fonction SECURITY DEFINER créée hors des
-- migrations applicatives. La migration reste compatible avec les projets où
-- Supabase n'a pas créé cette fonction.
--
-- Les triggers et les appels internes ne dépendent pas des droits EXECUTE
-- accordés aux rôles API.
--
-- Rollback de sécurité : ne pas rétablir les droits EXECUTE publics. Corriger
-- toute incompatibilité par forward-fix après avoir identifié l'appel interne.

begin;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public';
    execute 'revoke execute on function public.rls_auto_enable() from anon';
    execute 'revoke execute on function public.rls_auto_enable() from authenticated';
  end if;
end
$$;

commit;
