-- ============================================================
-- Migración 22 — tabla admin_config
-- ============================================================
-- Configuración visual del panel de administración.
-- Completamente independiente de la tabla themes (que controla
-- la apariencia del sitio web público).
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_config (
  id              INTEGER     PRIMARY KEY DEFAULT 1,
  -- Color de acento (botones, estados activos, links)
  accent_color    TEXT        NOT NULL DEFAULT '#4F46E5',
  -- Color de fondo del sidebar
  sidebar_color   TEXT        NOT NULL DEFAULT '#0F172A',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_config_singleton CHECK (id = 1)
);

INSERT INTO admin_config (id) VALUES (1) ON CONFLICT DO NOTHING;

COMMENT ON TABLE  admin_config IS 'Singleton de apariencia del panel admin. Independiente de la tabla themes (web público).';
COMMENT ON COLUMN admin_config.accent_color  IS 'Color hex para botones, nav activo y elementos interactivos del panel.';
COMMENT ON COLUMN admin_config.sidebar_color IS 'Color hex de fondo del sidebar de navegación.';

-- RLS
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
-- Sin política anon — solo service_role accede a esta tabla.
