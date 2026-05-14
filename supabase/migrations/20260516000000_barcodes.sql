-- ─────────────────────────────────────────────────────────────────────────
-- barcodes — gestion des codes barres produits
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS barcodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  barcode     TEXT NOT NULL UNIQUE,
  format      TEXT NOT NULL DEFAULT 'EAN13'
              CHECK (format IN ('EAN13','EAN8','QR','CODE128','CODE39','UPC','ITF14','DATAMATRIX')),
  label       TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  printed_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barcodes_product_id ON barcodes (product_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode    ON barcodes (barcode);
CREATE INDEX IF NOT EXISTS idx_barcodes_active     ON barcodes (active);

ALTER TABLE barcodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage barcodes" ON barcodes;

CREATE POLICY "Admins manage barcodes" ON barcodes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.preferences->>'role')::text = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.preferences->>'role')::text = 'admin'
    )
  );
