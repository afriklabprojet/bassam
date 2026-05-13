-- ─────────────────────────────────────────────────────────────────────────
-- refunds — gestion des remboursements
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS refunds (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  payment_id     UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount         NUMERIC(10,2) NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'XOF',
  reason         TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','processed','cancelled')),
  refund_method  TEXT DEFAULT 'original'
                 CHECK (refund_method IN ('original','store_credit','bank_transfer','cash','other')),
  notes          TEXT,
  requested_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at   TIMESTAMPTZ,
  transaction_id TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id   ON refunds (order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds (payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status     ON refunds (status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON refunds (created_at DESC);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage refunds" ON refunds;

CREATE POLICY "Admins manage refunds" ON refunds
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
