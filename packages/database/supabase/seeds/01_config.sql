-- ============================================================
-- seeds/01_config.sql — Datos de configuración base
-- ============================================================
-- Ejecutar DESPUÉS de 01_schema.sql.
-- Solo contiene la fila inicial de configuración.
-- Personalizar antes del primer despliegue.
-- ============================================================

-- ── Tema por defecto ─────────────────────────────────────────────────────────
INSERT INTO themes (
  name, is_active, is_default,
  color_primary, color_dark, color_cream, color_cream_warm,
  color_yellow, color_yellow_pale, color_text,
  font_display, font_body
) VALUES (
  'VPS Coffee (Por defecto)', true, true,
  '#614A2A', '#604B30', '#FFF0D1', '#FFF1D3',
  '#FFF6B8', '#FDF8B9', '#2D1A0A',
  'cormorant', 'dm-sans'
) ON CONFLICT DO NOTHING;

-- ── Tipos de variante para tienda de café ────────────────────────────────────
INSERT INTO variant_types (name, values, display_type, order_index) VALUES
  ('Tueste',   '["Claro", "Medio", "Oscuro"]',                'pill', 0),
  ('Peso',     '["250g", "500g", "1kg"]',                     'pill', 1),
  ('Molienda', '["Grano entero", "Media", "Fina", "Gruesa"]', 'pill', 2)
ON CONFLICT (name) DO NOTHING;

-- ── Categorías de producto ───────────────────────────────────────────────────
INSERT INTO categories (name, slug, description, order_index) VALUES
  ('Café Claro',  'cafe-claro',  'Tueste claro — notas frutales y florales, ideal para filtrado', 1),
  ('Café Medio',  'cafe-medio',  'Tueste medio balanceado, versátil para cualquier método',       2),
  ('Café Oscuro', 'cafe-oscuro', 'Tueste oscuro — cuerpo intenso, ideal para espresso',           3)
ON CONFLICT (slug) DO NOTHING;

-- ── Nav items base ───────────────────────────────────────────────────────────
INSERT INTO nav_items (nav_key, label, href, enabled, order_index) VALUES
  ('cafe-1',      'Café',      '/',          true, 1),
  ('tienda-2',    'Tienda',    '/tienda',    true, 2),
  ('maquila-3',   'Maquila',   '/maquila',   true, 3),
  ('asesorias-4', 'Asesorías', '/asesorias', true, 4),
  ('blog-5',      'Blog',      '/blog',      true, 5)
ON CONFLICT (nav_key) DO NOTHING;

-- ── Configuración visual del panel de administración ────────────────────────
-- Paleta corporativa slate/indigo — independiente del tema del sitio web.
INSERT INTO admin_config (id, accent_color, sidebar_color)
VALUES (1, '#4F46E5', '#0F172A')
ON CONFLICT DO NOTHING;
