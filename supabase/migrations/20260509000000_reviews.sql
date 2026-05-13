-- VIP Parfumerie Bar — Table des avis clients
-- Exécuter dans Supabase SQL Editor

-- ── Table reviews ──────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  ville        TEXT NOT NULL,
  texte        TEXT NOT NULL,
  rating       SMALLINT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_approved  BOOLEAN NOT NULL DEFAULT FALSE,
  source       TEXT DEFAULT 'website',          -- 'website' | 'admin' | 'whatsapp'
  order_id     UUID REFERENCES orders(id) ON DELETE SET NULL,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Index ──────────────────────────────────────────────────────────────────────
CREATE INDEX idx_reviews_approved ON reviews(is_approved) WHERE is_approved = TRUE;
CREATE INDEX idx_reviews_created  ON reviews(created_at DESC);

-- ── Row Level Security ─────────────────────────────────────────────────────────
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique : uniquement les avis approuvés
CREATE POLICY "Avis approuvés visibles" ON reviews
  FOR SELECT USING (is_approved = TRUE);

-- Insertion publique : n'importe qui peut soumettre un avis (modéré avant publication)
CREATE POLICY "Submission publique" ON reviews
  FOR INSERT WITH CHECK (TRUE);

-- Mise à jour / suppression : admins via service role uniquement (pas de policy → service role only)

-- ── Données de départ (vraies données à remplacer par les vrais avis)  ─────────
-- Ces données sont approuvées par défaut pour que le site ne soit pas vide
INSERT INTO reviews (name, ville, texte, rating, is_approved, source) VALUES
  ('Adjoua M.',   'Abidjan, Cocody',   'Livré le lendemain matin, emballage magnifique et 100% authentique. Je ne commande plus ailleurs.', 5, TRUE, 'admin'),
  ('Ibrahim K.',  'Abidjan, Yopougon', 'Ils m''ont aidé par WhatsApp à choisir entre deux parfums. Prix correct, livraison rapide. Recommandé !', 5, TRUE, 'admin'),
  ('Fatou B.',    'Bouaké',            'Coco Mademoiselle reçu en 48h à Bouaké. Flacon parfait, prix bien meilleur qu''en boutique.', 5, TRUE, 'admin');
