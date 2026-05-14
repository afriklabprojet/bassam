-- Add olfactory notes (pyramid: top/heart/base) to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS notes JSONB DEFAULT NULL;

COMMENT ON COLUMN products.notes IS 'Olfactory pyramid: {"top":["bergamote"],"heart":["rose"],"base":["musc"]}';
