-- Complément F2 — bucket Storage requis par les routes d'upload.
--
-- Une pile Supabase vide ne contient pas automatiquement product-images.
-- Les politiques F2 peuvent donc être correctes tout en laissant les uploads
-- administrateur inutilisables. Cette migration rend le bucket reproductible
-- et aligne ses limites sur les types acceptés par les routes applicatives.
--
-- Rollback de sécurité : ne pas supprimer un bucket contenant des objets.
-- Corriger ses limites par forward-fix si les besoins applicatifs changent.

begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array[
    'image/avif',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
    'image/x-icon'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
