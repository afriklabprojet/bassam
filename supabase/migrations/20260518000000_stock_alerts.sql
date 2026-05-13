-- ─────────────────────────────────────────────────────────────────────────
-- stock_alerts — alertes de stock bas / rupture
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stock_alerts (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id       UUID        REFERENCES inventory(id) ON DELETE CASCADE,
  product_name       TEXT        NOT NULL,
  sku                TEXT,
  current_quantity   INT         NOT NULL,
  threshold          INT         NOT NULL,
  severity           TEXT        NOT NULL DEFAULT 'warning'
                                 CHECK (severity IN ('critical', 'warning')),
  status             TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  acknowledged_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at    TIMESTAMPTZ,
  resolved_at        TIMESTAMPTZ,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_status       ON stock_alerts (status);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_severity     ON stock_alerts (severity);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_inventory_id ON stock_alerts (inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_created_at   ON stock_alerts (created_at DESC);

ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage stock_alerts" ON stock_alerts;

CREATE POLICY "Admins manage stock_alerts" ON stock_alerts
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
