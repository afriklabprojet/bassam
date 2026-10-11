-- F5 — NON APPLIQUÉE AU MOMENT DE SA CRÉATION.
-- À valider après F1 sur une pile Supabase de test isolée.
--
-- Les visiteurs peuvent toujours proposer un avis du site, mais ne peuvent ni
-- l'approuver, ni usurper une autre source. Les administrateurs vérifiés par
-- app_metadata conservent la lecture et la modération via leur jeton utilisateur.
--
-- Rollback de sécurité : ne pas restaurer WITH CHECK (true).
-- Corriger le formulaire ou la modération par forward-fix.

begin;

do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'F1 doit être appliquée avant F5';
  end if;
end
$$;

drop policy if exists "Submission publique" on public.reviews;
create policy "Submission publique"
  on public.reviews
  for insert
  to anon, authenticated
  with check (
    is_approved is false
    and source = 'website'
  );

drop policy if exists "Admins manage reviews" on public.reviews;
create policy "Admins manage reviews"
  on public.reviews
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

commit;
