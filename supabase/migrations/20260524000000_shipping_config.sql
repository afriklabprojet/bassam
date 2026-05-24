-- Seed default shipping configuration into site_settings (modes[] format)
INSERT INTO site_settings (key, value) VALUES (
  'shipping_config',
  '{"modes":[{"id":"express","label":"Livraison Express","description":"Aujourd''hui avant 20h (commande avant 12h) — Abidjan uniquement","fee":2500,"enabled":true,"type":"delivery"},{"id":"standard","label":"Livraison Standard","description":"24 à 48h ouvrables — Abidjan et environs","fee":1500,"enabled":true,"type":"delivery"},{"id":"interieur","label":"Livraison Intérieur CI","description":"3 à 5 jours ouvrables — Bouaké, Yamoussoukro, San-Pédro…","fee":3500,"enabled":true,"type":"delivery"},{"id":"retrait","label":"Retrait en boutique","description":"Disponible dans la journée — Marcory, Abidjan","fee":0,"enabled":true,"type":"pickup"}]}'
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = NOW()
  WHERE site_settings.value LIKE '%standard_fee%';
