-- Add hero_image_url column to services_content for configurable hero backgrounds
ALTER TABLE services_content ADD COLUMN IF NOT EXISTS hero_image_url TEXT NOT NULL DEFAULT '';
