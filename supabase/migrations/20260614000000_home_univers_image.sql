-- Ajoute la colonne image_url sur home_univers pour les photos des cartes univers
ALTER TABLE home_univers ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '';
