-- ────────────────────────────────────────────────────────────────────────────
-- 11_themes.sql
-- Tabla de temas visuales: paleta de colores y tipografía configurable.
-- ────────────────────────────────────────────────────────────────────────────

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
