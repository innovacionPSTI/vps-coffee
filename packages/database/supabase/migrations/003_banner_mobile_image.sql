-- Agrega soporte para imagen mobile en banners
ALTER TABLE banners ADD COLUMN IF NOT EXISTS image_url_mobile TEXT DEFAULT NULL;

COMMENT ON COLUMN banners.image_url IS 'Imagen para escritorio — 1920×600 px recomendado';
COMMENT ON COLUMN banners.image_url_mobile IS 'Imagen para móvil — 750×1000 px recomendado (opcional)';
