-- ============================================================
-- Migración 21 — favicon_url en store_config
-- ============================================================
-- Agrega el campo favicon_url para que el admin pueda subir
-- un favicon personalizado que reemplaza el favicon.ico estático.
-- ============================================================

ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS favicon_url TEXT;

COMMENT ON COLUMN store_config.favicon_url IS
  'URL del favicon personalizado. Reemplaza el favicon.ico estático en el sitio web. Formato recomendado: PNG cuadrado 64×64 px.';
