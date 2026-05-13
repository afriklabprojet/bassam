-- ─────────────────────────────────────────────────────────────────────────
-- newsletter_campaigns — historique des campagnes email envoyées
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject       TEXT NOT NULL,
  preview_text  TEXT,
  body_html     TEXT NOT NULL,
  recipients_count INT NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'sent'
                CHECK (status IN ('sent', 'failed', 'draft')),
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_sent_at
  ON newsletter_campaigns (sent_at DESC);

ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage newsletter_campaigns" ON newsletter_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (profiles.preferences->>'role')::text = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND (profiles.preferences->>'role')::text = 'admin'
    )
  );
