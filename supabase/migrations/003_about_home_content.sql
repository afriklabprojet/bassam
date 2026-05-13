-- ============================================================
-- Migration 003 — Contenu CMS : À propos & Accueil (Univers)
-- ============================================================

-- ── Table : Statistiques de la page À propos ────────────────
CREATE TABLE IF NOT EXISTS about_stats (
  slug        TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  label       TEXT NOT NULL DEFAULT '',
  ordre       INT  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Données initiales
INSERT INTO about_stats (slug, value, label, ordre) VALUES
  ('stat-references', '150+',    'Références en stock',   1),
  ('stat-maisons',    '40+',     'Maisons de luxe',       2),
  ('stat-clients',    '5 000+',  'Clients satisfaits',    3),
  ('stat-annees',     '3',       'Années d''excellence',  4)
ON CONFLICT (slug) DO NOTHING;

-- ── Table : Valeurs de la page À propos ─────────────────────
CREATE TABLE IF NOT EXISTS about_valeurs (
  slug        TEXT PRIMARY KEY,
  num         TEXT NOT NULL DEFAULT '01',
  titre       TEXT NOT NULL DEFAULT '',
  texte       TEXT NOT NULL DEFAULT '',
  ordre       INT  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO about_valeurs (slug, num, titre, texte, ordre) VALUES
  ('valeur-authenticite', '01', 'Authenticité garantie',
   'Chaque flacon vendu chez VIP Parfumerie Bar est 100 % authentique, sourcé directement auprès des distributeurs officiels et des maisons de parfumerie européennes. Aucun compromis sur la qualité.',
   1),
  ('valeur-excellence',   '02', 'Excellence de service',
   'De la sélection du parfum à la livraison à domicile, chaque étape est pensée pour vous offrir une expérience à la hauteur des plus grandes maisons. Notre équipe vous accompagne avec discrétion et expertise.',
   2),
  ('valeur-accessibilite','03', 'Accessibilité du luxe',
   'Le luxe ne devrait pas être réservé à quelques-uns. Nous rendons les parfums d''exception accessibles à toute l''Afrique de l''Ouest grâce au paiement Mobile Money et à une logistique locale maîtrisée.',
   3)
ON CONFLICT (slug) DO NOTHING;

-- ── Table : Engagements de la page À propos ─────────────────
CREATE TABLE IF NOT EXISTS about_engagements (
  slug        TEXT PRIMARY KEY,
  titre       TEXT NOT NULL DEFAULT '',
  texte       TEXT NOT NULL DEFAULT '',
  ordre       INT  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO about_engagements (slug, titre, texte, ordre) VALUES
  ('engagement-tracabilite', 'Traçabilité totale',
   'Chaque produit est accompagné de son certificat d''authenticité et de son numéro de lot vérifiable.', 1),
  ('engagement-emballage',   'Emballage premium',
   'Coffrets signature, papier de soie et ruban or — votre commande arrive comme un cadeau.', 2),
  ('engagement-paiement',    'Paiement sécurisé',
   'Mobile Money, carte bancaire, Orange Money, Wave — nous acceptons tous vos moyens de paiement locaux.', 3),
  ('engagement-livraison',   'Livraison rapide',
   '24 à 72h à Abidjan, 3 à 5 jours dans toute l''Afrique de l''Ouest.', 4),
  ('engagement-sav',         'Service après-vente',
   'Un problème ? Notre équipe répond en moins de 2h par WhatsApp, 7j/7.', 5),
  ('engagement-conseil',     'Conseil personnalisé',
   'Pas sûr(e) de votre choix ? Notre quiz olfactif IA vous guide vers votre signature parfaite.', 6)
ON CONFLICT (slug) DO NOTHING;

-- ── Table : Univers de la page Accueil ──────────────────────
CREATE TABLE IF NOT EXISTS home_univers (
  slug        TEXT PRIMARY KEY CHECK (slug IN ('femme', 'homme', 'mixte')),
  tagline     TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  notes       TEXT[] NOT NULL DEFAULT '{}',
  ordre       INT  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO home_univers (slug, tagline, description, notes, ordre) VALUES
  ('femme', 'La féminité sublimée',
   'Floraux envoûtants, orientaux profonds, boisés soyeux — les plus grandes maisons pour elle.',
   ARRAY['Jasmin', 'Rose', 'Vanille', 'Oud'], 1),
  ('homme', 'La force en signature',
   'Fraîcheurs marines, bois nobles, muscs intenses — des fragrances qui définissent le caractère.',
   ARRAY['Cèdre', 'Vétiver', 'Bergamote', 'Ambre'], 2),
  ('mixte', 'Au-delà des genres',
   'Fragrances unisexes qui transcendent les conventions et les saisons.',
   ARRAY['Poivre', 'Santal', 'Iris', 'Patchouli'], 3)
ON CONFLICT (slug) DO NOTHING;

-- ── RLS — accès public en lecture, admin en écriture ────────
ALTER TABLE about_stats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_valeurs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_univers      ENABLE ROW LEVEL SECURITY;

-- Lecture publique (ISR frontend)
CREATE POLICY "public_read_about_stats"       ON about_stats       FOR SELECT USING (true);
CREATE POLICY "public_read_about_valeurs"     ON about_valeurs     FOR SELECT USING (true);
CREATE POLICY "public_read_about_engagements" ON about_engagements FOR SELECT USING (true);
CREATE POLICY "public_read_home_univers"      ON home_univers      FOR SELECT USING (true);

-- Écriture via service role uniquement (API admin utilise createServiceClient)
-- Le service role bypasse RLS — aucune policy supplémentaire requise.
