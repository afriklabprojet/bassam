-- ============================================================
-- Home hero content
-- Makes the homepage hero editable from the admin panel.
-- ============================================================

CREATE TABLE IF NOT EXISTS home_hero (
  id                  TEXT PRIMARY KEY DEFAULT 'home' CHECK (id = 'home'),
  eyebrow             TEXT NOT NULL DEFAULT '',
  title               TEXT NOT NULL DEFAULT '',
  title_accent        TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  primary_cta_label   TEXT NOT NULL DEFAULT '',
  primary_cta_href    TEXT NOT NULL DEFAULT '/',
  secondary_cta_label TEXT NOT NULL DEFAULT '',
  secondary_cta_href  TEXT NOT NULL DEFAULT '/',
  trust_items         JSONB NOT NULL DEFAULT '[]',
  stats               JSONB NOT NULL DEFAULT '[]',
  showcase_eyebrow    TEXT NOT NULL DEFAULT '',
  showcase_title      TEXT NOT NULL DEFAULT '',
  product_visuals     JSONB NOT NULL DEFAULT '[]',
  collection_links    JSONB NOT NULL DEFAULT '[]',
  brand_ticker        JSONB NOT NULL DEFAULT '[]',
  scroll_label        TEXT NOT NULL DEFAULT '',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_home_hero_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_home_hero_updated_at ON home_hero;
CREATE TRIGGER trg_home_hero_updated_at
  BEFORE UPDATE ON home_hero
  FOR EACH ROW EXECUTE FUNCTION update_home_hero_ts();

ALTER TABLE home_hero ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read home_hero" ON home_hero;
CREATE POLICY "Public can read home_hero"
  ON home_hero FOR SELECT USING (true);

INSERT INTO home_hero (
  id,
  eyebrow,
  title,
  title_accent,
  description,
  primary_cta_label,
  primary_cta_href,
  secondary_cta_label,
  secondary_cta_href,
  trust_items,
  stats,
  showcase_eyebrow,
  showcase_title,
  product_visuals,
  collection_links,
  brand_ticker,
  scroll_label
) VALUES (
  'home',
  'Haute parfumerie authentique',
  'Votre parfum signature,',
  'choisi avec précision.',
  'Une sélection premium de maisons iconiques et de fragrances rares, livrée rapidement en Côte d''Ivoire avec accompagnement personnalisé.',
  'Voir les best-sellers',
  '/#top-ventes',
  'Trouver mon parfum',
  '/services/quiz-olfactif',
  '["Authenticité vérifiée","Livraison 24 h à Abidjan","Paiement Orange Money, MTN, Wave","Conseil olfactif personnalisé"]',
  '[{"value":"300+","label":"Fragrances"},{"value":"40+","label":"Maisons"},{"value":"100%","label":"Authentique"}]',
  'Édition 2026',
  'VIP Selection',
  '[{"src":"/images/products/dior-sauvage.svg","alt":"Flacon Dior Sauvage disponible chez VIP Parfumerie Bar"},{"src":"/images/products/oud-wood.svg","alt":"Flacon Tom Ford Oud Wood disponible chez VIP Parfumerie Bar"},{"src":"/images/products/black-opium.svg","alt":"Flacon Black Opium disponible chez VIP Parfumerie Bar"}]',
  '[{"href":"/collections/femme","name":"Femme","count":"Floraux, ambrés, poudrés","tone":"#C5A55A"},{"href":"/collections/homme","name":"Homme","count":"Boisés, frais, cuirés","tone":"#7896B2"},{"href":"/collections/mixte","name":"Mixte","count":"Oud, santal, muscs","tone":"#A89B7A"}]',
  '["Dior","Chanel","Creed","Tom Ford","Maison Francis Kurkdjian","Le Labo","Guerlain","Jo Malone"]',
  'Explorer'
)
ON CONFLICT (id) DO NOTHING;

-- Writes are performed through the trusted admin API with the service role.