-- F2 — NON APPLIQUÉE AU MOMENT DE SA CRÉATION.
-- À valider après F1 sur une pile Supabase de test isolée.
--
-- Les routes d'administration téléversent avec le client service_role. Les
-- politiques Storage directes restent disponibles pour un administrateur
-- authentifié, mais refusent désormais les comptes clients ordinaires.
--
-- Rollback de sécurité : ne pas restaurer auth.role() = 'authenticated'.
-- Corriger par forward-fix en conservant public.is_admin().

begin;

do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'F1 doit être appliquée avant F2';
  end if;

  if to_regclass('storage.objects') is null then
    raise notice 'storage.objects absente : aucune politique à modifier';
    return;
  end if;

  drop policy if exists "product-images: upload admin" on storage.objects;
  create policy "product-images: upload admin"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'product-images'
      and (select public.is_admin())
    );

  drop policy if exists "product-images: suppression admin" on storage.objects;
  create policy "product-images: suppression admin"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'product-images'
      and (select public.is_admin())
    );
end
$$;

commit;
