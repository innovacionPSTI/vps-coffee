-- ============================================================
-- Migración 15: Campos SEO en store_config
--
-- Agrega descripción y palabras clave para metadata dinámica
-- en el sitio web, configurables desde el panel de administración.
-- ============================================================

ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS store_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords      TEXT;

-- Valores por defecto para la fila existente (id = 1)
UPDATE store_config
SET
  store_description = COALESCE(store_description, 'Bienvenido a nuestra tienda en línea.'),
  seo_keywords      = COALESCE(seo_keywords, 'tienda online, ecommerce, compras en línea')
WHERE id = 1;
