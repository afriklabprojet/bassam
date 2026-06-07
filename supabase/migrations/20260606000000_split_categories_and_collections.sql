-- Separate business categories from commercial collections.
-- Cleanup existing data where the legacy categories table mixed both concepts.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.collections(id),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'collections'
      AND policyname = 'Collections are viewable by everyone'
  ) THEN
    CREATE POLICY "Collections are viewable by everyone"
      ON public.collections FOR SELECT
      USING (TRUE);
  END IF;
END $$;

INSERT INTO public.collections (id, name, slug, description, image_url, parent_id, display_order, created_at, updated_at)
SELECT c.id, c.name, c.slug, c.description, c.image_url, NULL, c.display_order, c.created_at, c.updated_at
FROM public.categories c
WHERE c.slug NOT IN ('homme', 'femme', 'mixte')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_gender_check;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.products RENAME COLUMN category_id TO collection_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
      AND column_name = 'gender'
  ) THEN
    ALTER TABLE public.products RENAME COLUMN gender TO category;
  END IF;
END $$;

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS collection_id UUID;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;

UPDATE public.products
SET collection_id = NULL
WHERE collection_id IS NOT NULL
  AND collection_id NOT IN (SELECT id FROM public.collections);

ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_collection_id_fkey;
ALTER TABLE public.products
  ADD CONSTRAINT products_collection_id_fkey
  FOREIGN KEY (collection_id)
  REFERENCES public.collections(id)
  ON DELETE SET NULL;

DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_gender;
CREATE INDEX IF NOT EXISTS idx_products_collection ON public.products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

DELETE FROM public.categories;

WITH desired_categories AS (
  SELECT *
  FROM (
    VALUES
      ('homme', 'Homme', 'Des fragrances masculines puissantes et raffinées', 1),
      ('femme', 'Femme', 'Des senteurs féminines élégantes et envoûtantes', 2),
      ('mixte', 'Mixte', 'Des fragrances unisexes modernes', 3)
  ) AS defaults(slug, name, description, display_order)
),
existing_categories AS (
  SELECT DISTINCT
    p.category AS slug,
    INITCAP(REPLACE(p.category, '-', ' ')) AS name,
    'Catégorie produit migrée depuis les données existantes.' AS description,
    100 AS display_order
  FROM public.products p
  WHERE p.category IS NOT NULL AND BTRIM(p.category) <> ''
)
INSERT INTO public.categories (id, name, slug, description, image_url, parent_id, display_order)
SELECT
  gen_random_uuid(),
  source.name,
  source.slug,
  source.description,
  NULL,
  NULL,
  source.display_order
FROM (
  SELECT * FROM desired_categories
  UNION ALL
  SELECT * FROM existing_categories
  WHERE slug NOT IN (SELECT slug FROM desired_categories)
) AS source
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_collections_updated_at'
  ) THEN
    CREATE TRIGGER update_collections_updated_at
      BEFORE UPDATE ON public.collections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;