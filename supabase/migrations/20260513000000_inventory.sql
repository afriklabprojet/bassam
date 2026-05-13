-- ─────────────────────────────────────────────────────────────────────────
-- inventory — gestion des stocks produits
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inventory (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           UUID REFERENCES products(id) ON DELETE CASCADE,
  sku                  TEXT UNIQUE,
  name                 TEXT NOT NULL,
  quantity             INT  NOT NULL DEFAULT 0,
  low_stock_threshold  INT  NOT NULL DEFAULT 5,
  location             TEXT,
  unit_cost            NUMERIC(10,2),
  last_updated         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory (product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku        ON inventory (sku);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity   ON inventory (quantity);

-- historique des mouvements de stock
CREATE TABLE IF NOT EXISTS inventory_movements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('in','out','adjustment','return')),
  quantity     INT  NOT NULL,
  reason       TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory_id ON inventory_movements (inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at   ON inventory_movements (created_at DESC);

ALTER TABLE inventory           ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage inventory"           ON inventory;
DROP POLICY IF EXISTS "Admins manage inventory_movements" ON inventory_movements;

CREATE POLICY "Admins manage inventory" ON inventory
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

CREATE POLICY "Admins manage inventory_movements" ON inventory_movements
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
