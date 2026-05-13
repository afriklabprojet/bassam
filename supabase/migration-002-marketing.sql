-- VIP Parfumerie Bar - Marketing Module
-- Migration 002 : Codes promo + Bannières

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed')) NOT NULL DEFAULT 'percentage',
  value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_uses INT,
  uses_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotional banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  cta_text TEXT,
  cta_link TEXT DEFAULT '/',
  image_url TEXT,
  bg_color TEXT DEFAULT 'linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%)',
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active, display_order) WHERE is_active = TRUE;

-- RLS policies (admin only)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access promo_codes" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND (preferences->>'role')::text = 'admin'
    )
  );

CREATE POLICY "Admin full access banners" ON banners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND (preferences->>'role')::text = 'admin'
    )
  );

-- Public read for active banners (storefront)
CREATE POLICY "Public read active banners" ON banners
  FOR SELECT USING (is_active = TRUE);

-- Public validate promo code (storefront)
CREATE POLICY "Public read active promo codes" ON promo_codes
  FOR SELECT USING (is_active = TRUE);
