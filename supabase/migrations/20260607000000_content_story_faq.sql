-- ============================================================
-- Migration : about_story + contact_faq
-- Permet de piloter depuis l'admin les textes éditoriaux de la
-- page À propos (histoire, blockquote) et la FAQ du contact.
-- ============================================================

-- ── about_hero : texte du hero de la page À propos ──────────
CREATE TABLE IF NOT EXISTS about_hero (
  id          smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton
  eyebrow     text NOT NULL DEFAULT 'Notre histoire',
  title_line1 text NOT NULL DEFAULT 'L''excellence olfactive,',
  title_em    text NOT NULL DEFAULT 'au cœur de l''Afrique.',
  subtitle    text NOT NULL DEFAULT 'VIP Parfumerie Bar est né d''une conviction simple : chaque personne mérite d''accéder aux plus beaux parfums du monde, ici, en Afrique de l''Ouest, sans compromis sur l''authenticité ni sur l''expérience.',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Ligne initiale (singleton)
INSERT INTO about_hero (id, eyebrow, title_line1, title_em, subtitle)
VALUES (
  1,
  'Notre histoire',
  'L''excellence olfactive,',
  'au cœur de l''Afrique.',
  'VIP Parfumerie Bar est né d''une conviction simple : chaque personne mérite d''accéder aux plus beaux parfums du monde, ici, en Afrique de l''Ouest, sans compromis sur l''authenticité ni sur l''expérience.'
)
ON CONFLICT (id) DO NOTHING;

-- ── about_story : section histoire (paragraphes + blockquote) ──
CREATE TABLE IF NOT EXISTS about_story (
  id         smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton
  section_eyebrow  text NOT NULL DEFAULT 'Fondation',
  title_line1      text NOT NULL DEFAULT 'Une maison née de la',
  title_em         text NOT NULL DEFAULT 'passion du parfum rare.',
  paragraph1 text NOT NULL DEFAULT 'Fondée à Abidjan en 2022, VIP Parfumerie Bar est née de la frustration de ne pas trouver, en Afrique, des parfums de luxe authentiques à des prix honnêtes. Trop souvent, les Africains se voyaient proposer des contrefaçons, ou devaient faire confiance à des revendeurs opaques.',
  paragraph2 text NOT NULL DEFAULT 'Notre fondatrice a décidé de changer cela. Forte de ses connexions avec les distributeurs officiels en Europe, elle a construit une chaîne d''approvisionnement rigoureuse, transparente et traçable — directement depuis les maisons de parfumerie jusqu''à votre porte.',
  paragraph3 text NOT NULL DEFAULT 'Aujourd''hui, VIP Parfumerie Bar est la référence des amateurs de beaux parfums en Côte d''Ivoire et au-delà. Plus de 5 000 clients font confiance à notre sélection, notre service et notre engagement pour l''authenticité.',
  quote_text text NOT NULL DEFAULT '"Chaque parfum que nous vendons a une histoire. Notre rôle est de vous aider à trouver celle qui vous appartient."',
  quote_author text NOT NULL DEFAULT 'La fondatrice, VIP Parfumerie Bar',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO about_story (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ── contact_faq : questions/réponses FAQ de la page contact ──
CREATE TABLE IF NOT EXISTS contact_faq (
  id         serial PRIMARY KEY,
  question   text NOT NULL,
  reponse    text NOT NULL,
  ordre      smallint NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Données initiales
INSERT INTO contact_faq (question, reponse, ordre) VALUES
  ('Vos parfums sont-ils 100 % authentiques ?',
   'Oui, absolument. Chaque produit est sourcé directement auprès des distributeurs officiels en Europe. Nous fournissons un certificat d''authenticité avec chaque commande.',
   1),
  ('Quels sont les délais de livraison ?',
   '24 à 72h pour Abidjan. 3 à 5 jours ouvrés pour le reste de l''Afrique de l''Ouest. La livraison est offerte à partir de 50 000 FCFA d''achat.',
   2),
  ('Quels modes de paiement acceptez-vous ?',
   'Orange Money, MTN Money, Wave, Moov Money, Djamo. Toutes les transactions sont sécurisées.',
   3),
  ('Puis-je retourner un parfum ?',
   'Les parfums descellés ne peuvent pas être retournés pour des raisons hygiéniques. En revanche, si votre commande est endommagée ou ne correspond pas à la description, nous procédons à un échange ou un remboursement intégral.',
   4),
  ('Proposez-vous des consultations olfactives ?',
   'Oui. Notre service de consultation privée vous permet de bénéficier d''un accompagnement personnalisé — en présentiel à Abidjan ou en visio. Prenez rendez-vous depuis la page Services.',
   5)
ON CONFLICT DO NOTHING;

-- ── RLS ─────────────────────────────────────────────────────
ALTER TABLE about_hero    ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_story   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_faq   ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "public_read_about_hero"  ON about_hero  FOR SELECT USING (true);
CREATE POLICY "public_read_about_story" ON about_story FOR SELECT USING (true);
CREATE POLICY "public_read_contact_faq" ON contact_faq FOR SELECT USING (is_active = true);

-- Écriture admin uniquement
CREATE POLICY "admin_write_about_hero"  ON about_hero  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "admin_write_about_story" ON about_story FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "admin_write_contact_faq" ON contact_faq FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
