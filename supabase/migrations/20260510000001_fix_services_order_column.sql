-- Rename order_num → ordre in services_content if the old column still exists.
-- This migration handles existing databases created before the column rename.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'services_content'
      AND column_name  = 'order_num'
  ) THEN
    ALTER TABLE services_content RENAME COLUMN order_num TO ordre;
  END IF;
END $$;
