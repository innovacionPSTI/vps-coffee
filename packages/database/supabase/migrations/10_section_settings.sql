-- 10_section_settings.sql
-- Configuración de secciones visibles en el sitio web.
-- Permite habilitar/deshabilitar cada sección desde el panel de administración.

CREATE TABLE IF NOT EXISTS section_settings (
  key          TEXT PRIMARY KEY,
  label        TEXT        NOT NULL,
  description  TEXT,
  enabled      BOOLEAN     NOT NULL DEFAULT true,
  order_index  INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: secciones de la home en orden de aparición
INSERT INTO section_settings (key, label, description, enabled, order_index) VALUES
  ('hero',              'Hero / Carrusel',       'Carrusel de imágenes principal en la portada',             true, 1),
  ('featured_products', 'Productos Destacados',  'Grid de productos marcados como destacados en la portada', true, 2),
  ('services',          'Servicios',             'Paneles de servicios configurables (Maquila, Asesorías…)', true, 3),
  ('best_sellers',      'Más Vendidos',          'Vista previa de la tienda con los productos más vendidos', true, 4),
  ('blog_preview',      'Preview del Blog',      'Últimas entradas del blog en la portada',                 true, 5),
  ('newsletter',        'Newsletter',            'Formulario de suscripción al boletín de correo',          true, 6)
ON CONFLICT (key) DO NOTHING;
