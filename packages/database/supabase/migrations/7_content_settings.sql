-- ============================================================
-- VPS Coffee — Migración 7: Configuración de contenido
--
-- Agrupa las tablas de contenido configurable desde el admin:
--   - section_settings : secciones habilitables del home
--   - coupons          : cupones de descuento
--   - testimonials     : testimonios para /asesorias
--   - themes           : paleta de colores y tipografía
-- ============================================================

-- ─── SECTION SETTINGS ─────────────────────────────────────────────────────────
-- Permite habilitar/deshabilitar cada sección de la home desde el admin.
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

-- ─── COUPONS ──────────────────────────────────────────────────────────────────
-- Cupones de descuento: porcentaje o monto fijo, con límite de usos y expiración.
CREATE TABLE IF NOT EXISTS coupons (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(50) UNIQUE NOT NULL,
  type             VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value            DECIMAL(10,2) NOT NULL CHECK (value > 0),
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_uses         INTEGER NULL,          -- NULL = usos ilimitados
  used_count       INTEGER NOT NULL DEFAULT 0,
  expires_at       TIMESTAMPTZ NULL,      -- NULL = nunca expira
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsqueda por código (case-insensitive en la aplicación)
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons (LOWER(code));

-- ─── TESTIMONIALS ─────────────────────────────────────────────────────────────
-- Testimonios de clientes para la página de Asesorías.
CREATE TABLE IF NOT EXISTS testimonials (
  id          SERIAL PRIMARY KEY,
  author_name VARCHAR(100) NOT NULL,
  author_role VARCHAR(100) NULL,
  content     TEXT NOT NULL,
  avatar_url  TEXT NULL,
  rating      INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS testimonials_order_idx ON testimonials (order_index, id);

-- ─── THEMES ───────────────────────────────────────────────────────────────────
-- Temas visuales: paleta de colores y tipografía configurable.
-- El tema activo se inyecta como CSS custom properties en el layout del sitio.
CREATE TABLE IF NOT EXISTS themes (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT false,
  is_default      BOOLEAN NOT NULL DEFAULT false,

  -- Paleta de colores (hex, ej: '#614A2A')
  color_primary      TEXT NOT NULL DEFAULT '#614A2A',
  color_dark         TEXT NOT NULL DEFAULT '#604B30',
  color_cream        TEXT NOT NULL DEFAULT '#FFF0D1',
  color_cream_warm   TEXT NOT NULL DEFAULT '#FFF1D3',
  color_yellow       TEXT NOT NULL DEFAULT '#FFF6B8',
  color_yellow_pale  TEXT NOT NULL DEFAULT '#FDF8B9',
  color_text         TEXT NOT NULL DEFAULT '#2D1A0A',

  -- Fuentes (identificador: 'cormorant' | 'playfair' | 'dm-sans' | 'inter')
  font_display  TEXT NOT NULL DEFAULT 'cormorant',
  font_body     TEXT NOT NULL DEFAULT 'dm-sans',

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Solo un tema activo a la vez (índice parcial único)
CREATE UNIQUE INDEX IF NOT EXISTS themes_active_unique
  ON themes (is_active)
  WHERE is_active = true;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_themes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS themes_updated_at ON themes;
CREATE TRIGGER themes_updated_at
  BEFORE UPDATE ON themes
  FOR EACH ROW EXECUTE FUNCTION update_themes_updated_at();

-- Seed: tema por defecto VPS Coffee (paleta original extraída de tailwind.config.ts)
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
