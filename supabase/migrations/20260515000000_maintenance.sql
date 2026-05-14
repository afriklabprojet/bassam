-- ─────────────────────────────────────────────────────────────────────────
-- maintenance_logs — contrôle et suivi des tâches de maintenance
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type           TEXT NOT NULL DEFAULT 'preventive'
                 CHECK (type IN ('preventive','corrective','urgent','inspection')),
  title          TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','in_progress','done','cancelled')),
  priority       TEXT NOT NULL DEFAULT 'medium'
                 CHECK (priority IN ('low','medium','high','critical')),
  assigned_to    TEXT,
  scheduled_at   TIMESTAMPTZ,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  notes          TEXT,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_status      ON maintenance_logs (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority    ON maintenance_logs (priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled   ON maintenance_logs (scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_at  ON maintenance_logs (created_at DESC);

ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage maintenance_logs" ON maintenance_logs;

CREATE POLICY "Admins manage maintenance_logs" ON maintenance_logs
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
