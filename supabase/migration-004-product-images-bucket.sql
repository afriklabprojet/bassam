-- Migration 004 : bucket Supabase Storage pour les images produits
-- À exécuter dans le SQL Editor Supabase ou via psql

-- 1. Créer le bucket public "product-images"
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 Mo en octets
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Politique de lecture publique (tout le monde peut lire les images)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'product-images: lecture publique'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "product-images: lecture publique"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'product-images')
    $policy$;
  END IF;
END;
$$;

-- 3. Politique d'upload réservée aux admins authentifiés
--    (la vérification du rôle est faite côté API route Next.js + service role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'product-images: upload admin'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "product-images: upload admin"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'product-images'
          AND auth.role() = 'authenticated'
        )
    $policy$;
  END IF;
END;
$$;

-- 4. Politique de suppression réservée aux admins authentifiés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'product-images: suppression admin'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "product-images: suppression admin"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'product-images'
          AND auth.role() = 'authenticated'
        )
    $policy$;
  END IF;
END;
$$;
