-- Migration: Valeurs par défaut du branding (Luxury Gold)
-- Ces valeurs correspondent au preset "luxury-dark" (Cormorant + Inter, or chaud sur noir).

INSERT INTO site_settings (key, value) VALUES
  ('brand_color_accent',       '#C5A55A'),
  ('brand_color_accent_light', '#D9BE80'),
  ('brand_color_accent_dark',  '#9B7B38'),
  ('brand_color_accent_muted', 'rgba(197,165,90,0.15)'),
  ('brand_font_serif_family',  '''Cormorant Garamond'', Georgia, ''Times New Roman'', serif'),
  ('brand_font_sans_family',   '''Inter'', -apple-system, BlinkMacSystemFont, sans-serif'),
  ('brand_font_serif_import',  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap'),
  ('brand_font_sans_import',   'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'),
  ('brand_preset',             'luxury-dark')
ON CONFLICT (key) DO NOTHING;
