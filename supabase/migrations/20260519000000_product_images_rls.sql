-- Migration 019: Politiques RLS pour le bucket product-images
-- Le bucket a été créé via l'API Storage (public: true)
-- Ces politiques ajoutent une couche de sécurité explicite

-- Lecture publique (redondante avec public:true mais explicite)
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

-- Upload réservé aux utilisateurs authentifiés
-- (contrôle admin supplémentaire dans l'API route Next.js)
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

-- Suppression réservée aux utilisateurs authentifiés
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
