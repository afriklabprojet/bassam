-- ============================================================
-- Content Management Migration
-- Adds admin-editable content for: collections, services
-- Also seeds additional site_settings keys (email, address)
-- ============================================================

/* ─── 1. Extra site_settings keys ──────────────────────────────────────── */
INSERT INTO site_settings (key, value) VALUES
  ('support_email',    ''),
  ('address_display',  'Abidjan, Côte d''Ivoire'),
  ('address_detail',   'Livraison dans toute l''Afrique de l''Ouest')
ON CONFLICT (key) DO NOTHING;


/* ─── 2. collections_content ─────────────────────────────────────────────
   Stores admin-editable marketing copy for the 4 fixed collections.
   Icons / colors / slugs are kept in code (structural, not content).
────────────────────────────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS collections_content (
  slug         TEXT PRIMARY KEY,  -- 'femme' | 'homme' | 'mixte' | 'nouveautes'
  eyebrow      TEXT NOT NULL DEFAULT '',
  tagline      TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_collections_content_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_collections_content_updated_at
  BEFORE UPDATE ON collections_content
  FOR EACH ROW EXECUTE FUNCTION update_collections_content_ts();

ALTER TABLE collections_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read collections_content"
  ON collections_content FOR SELECT USING (true);

CREATE POLICY "Admins can manage collections_content"
  ON collections_content FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

INSERT INTO collections_content (slug, eyebrow, tagline, description) VALUES
  ('nouveautes',
   'Dernières arrivées',
   'La crème de la nouveauté',
   'Les lancements les plus attendus. Soyez le premier à les découvrir.'),
  ('femme',
   'Collection Femme',
   'L''essence du féminin',
   'Floraux, boisés poudrés, orientaux — l''arc-en-ciel de la féminité.'),
  ('homme',
   'Collection Homme',
   'La signature masculine',
   'Frais, boisés, épicés — des fragrances qui affirment et séduisent.'),
  ('mixte',
   'Collection Mixte',
   'Au-delà des codes',
   'Une sélection de fragrances qui transcendent les conventions.')
ON CONFLICT (slug) DO NOTHING;


/* ─── 3. services_content ────────────────────────────────────────────────
   Full CRUD for the three services.
   Icons / bg colors are kept in code (JSX cannot be stored in DB).
────────────────────────────────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS services_content (
  slug        TEXT PRIMARY KEY,
  ordre       SMALLINT NOT NULL DEFAULT 0,
  titre       TEXT NOT NULL DEFAULT '',
  accroche    TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  details     JSONB NOT NULL DEFAULT '[]',    -- string[]
  cta_label   TEXT NOT NULL DEFAULT '',
  tag         TEXT NOT NULL DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_services_content_ts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_services_content_updated_at
  BEFORE UPDATE ON services_content
  FOR EACH ROW EXECUTE FUNCTION update_services_content_ts();

ALTER TABLE services_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active services_content"
  ON services_content FOR SELECT USING (true);

CREATE POLICY "Admins can manage services_content"
  ON services_content FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

INSERT INTO services_content (slug, ordre, titre, accroche, description, details, cta_label, tag) VALUES
  ('quiz-olfactif', 1,
   'Quiz Olfactif IA',
   'Votre signature en 5 minutes.',
   'Notre algorithme analyse vos préférences — humeur, occasion, notes aimées — et vous recommande les parfums qui vous correspondent avec précision.',
   '["5 étapes guidées","Résultats personnalisés instantanés","Recommandations de 3 à 6 fragrances","Gratuit & sans inscription"]',
   'Démarrer le quiz',
   'Gratuit'),
  ('consultation', 2,
   'Consultation Privée',
   'L''expertise à votre écoute.',
   'Un rendez-vous exclusif avec notre experte parfumerie. Nous construisons ensemble votre garde-robe olfactive, selon votre personnalité, vos envies et votre budget.',
   '["Séance de 60 à 90 minutes","Analyse de votre profil olfactif","Sélection de 6 à 10 fragrances","Disponible en présentiel ou visio"]',
   'Prendre rendez-vous',
   'Sur rendez-vous'),
  ('creation-personnalisee', 3,
   'Création Personnalisée',
   'Un parfum unique, le vôtre.',
   'Nous composons pour vous une fragrance exclusive — accord sur-mesure, flacon gravé, coffret cadeau. Un objet de luxe signé à votre nom.',
   '["Formulation artisanale exclusive","Flacon numéroté & gravé à votre nom","Coffret luxe avec certificat","Idéal comme cadeau prestige"]',
   'Créer mon parfum',
   'Sur-mesure')
ON CONFLICT (slug) DO NOTHING;
