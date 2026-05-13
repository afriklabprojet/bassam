-- Site settings table — key/value store for admin-editable config
-- Manages: phone, WhatsApp, social media URLs

CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_site_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_site_settings_timestamp();

-- RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for WhatsApp FAB, Footer on public pages)
CREATE POLICY "Public can read site_settings"
  ON site_settings FOR SELECT
  USING (true);

-- Only admins can write (role is set via app_metadata in Supabase Auth)
CREATE POLICY "Admins can upsert site_settings"
  ON site_settings FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Seed default (empty) values
INSERT INTO site_settings (key, value) VALUES
  ('support_phone',         ''),
  ('support_phone_display', ''),
  ('whatsapp_number',       ''),
  ('whatsapp_display',      ''),
  ('instagram_url',         ''),
  ('facebook_url',          ''),
  ('tiktok_url',            '')
ON CONFLICT (key) DO NOTHING;
