-- ─────────────────────────────────────────────────────────────────────────
-- payments — suivi des paiements liés aux commandes
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount         NUMERIC(10,2) NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'XOF',
  method         TEXT NOT NULL DEFAULT 'card'
                 CHECK (method IN ('card','mobile_money','cash','transfer','other')),
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','completed','failed','cancelled','refunded')),
  transaction_id TEXT,
  provider       TEXT,
  metadata       JSONB DEFAULT '{}',
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id      ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at    ON payments (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments (transaction_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage payments" ON payments;

CREATE POLICY "Admins manage payments" ON payments
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
