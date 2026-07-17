-- ============================================================
-- Migración 14: Limpieza estructural y portabilidad
--
-- Objetivos:
--   1. Claves string estables para export/import (section_key, nav_key)
--   2. Contextualizar section_settings por página (no solo home)
--   3. Vincular banners opcionalmente a una página
--   4. Crear la página 'home' en el CMS (primer paso hacia home as CMS page)
--   5. Tabla media_assets para inventario de assets
--
-- No elimina tablas ni columnas existentes — solo additive + PK extension.
-- ============================================================

-- ─── 1. page_sections: clave string estable ───────────────────────────────────
-- Cada sección tiene un UUID estable para referencia en export/import.
-- Los INSERTs nuevos obtienen un UUID automáticamente.
ALTER TABLE page_sections
  ADD COLUMN IF NOT EXISTS section_key UUID NOT NULL DEFAULT gen_random_uuid();

-- Índice único (puede llevar un momento en tablas grandes)
CREATE UNIQUE INDEX IF NOT EXISTS page_sections_section_key_idx
  ON page_sections (section_key);

-- ─── 2. nav_items: clave string estable ───────────────────────────────────────
-- nav_key = slug del label + id para garantizar unicidad.
-- Se puede editar manualmente luego si se quiere un slug legible.
ALTER TABLE nav_items
  ADD COLUMN IF NOT EXISTS nav_key TEXT;

UPDATE nav_items
  SET nav_key = regexp_replace(lower(label), '[^a-z0-9]+', '-', 'g') || '-' || id
  WHERE nav_key IS NULL;

ALTER TABLE nav_items
  ALTER COLUMN nav_key SET NOT NULL,
  ALTER COLUMN nav_key SET DEFAULT gen_random_uuid()::text;

CREATE UNIQUE INDEX IF NOT EXISTS nav_items_nav_key_idx
  ON nav_items (nav_key);

-- ─── 3. banners: FK opcional a pages ─────────────────────────────────────────
-- page_key = NULL → banner global (aparece en el home por defecto).
-- page_key = 'nosotros' → solo en esa página.
ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS page_key TEXT NULL REFERENCES pages(key) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS banners_page_key_idx
  ON banners (page_key);

-- ─── 4. Crear página 'home' en el CMS ────────────────────────────────────────
-- Precondición para la FK de section_settings.
-- slug = '' → ruta raíz (/). page_type = 'home' → trato especial en web.
-- show_in_footer = false → no aparece en el footer.
INSERT INTO pages (key, label, slug, page_type, enabled, show_in_footer, order_index)
VALUES ('home', 'Inicio', '', 'home', true, false, 0)
ON CONFLICT (key) DO UPDATE SET
  label          = EXCLUDED.label,
  page_type      = EXCLUDED.page_type,
  show_in_footer = EXCLUDED.show_in_footer,
  order_index    = EXCLUDED.order_index;

-- ─── 5. section_settings: generalizar por página ─────────────────────────────
-- Antes: PK = key (solo para home implícito).
-- Ahora: PK = (key, page_key) para soportar secciones de cualquier página.

-- 5a. Agregar columna page_key con DEFAULT 'home'
ALTER TABLE section_settings
  ADD COLUMN IF NOT EXISTS page_key TEXT NOT NULL DEFAULT 'home';

-- 5b. Reemplazar clave primaria por clave compuesta
--     (si ya se corrió la migración parcialmente, el DROP puede fallar: usar IF EXISTS)
DO $$
BEGIN
  -- Eliminar constraint PK original si existe bajo el nombre por defecto
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'section_settings'
      AND constraint_type = 'PRIMARY KEY'
      AND constraint_name = 'section_settings_pkey'
  ) THEN
    -- Solo reemplazar si la PK actual es de una sola columna (key)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.key_column_usage
      WHERE table_name = 'section_settings'
        AND constraint_name = 'section_settings_pkey'
        AND column_name = 'page_key'
    ) THEN
      ALTER TABLE section_settings DROP CONSTRAINT section_settings_pkey;
      ALTER TABLE section_settings ADD PRIMARY KEY (key, page_key);
    END IF;
  END IF;
END $$;

-- 5c. FK a pages (idempotente)
ALTER TABLE section_settings
  DROP CONSTRAINT IF EXISTS section_settings_page_key_fk;

ALTER TABLE section_settings
  ADD CONSTRAINT section_settings_page_key_fk
  FOREIGN KEY (page_key) REFERENCES pages(key) ON DELETE CASCADE;

-- 5d. Índice para queries por página
CREATE INDEX IF NOT EXISTS section_settings_page_key_idx
  ON section_settings (page_key, order_index);

-- ─── 6. media_assets — inventario centralizado de archivos ────────────────────
-- Registra cada asset subido con su ubicación y referencias.
-- Los campos image_url existentes NO se alteran — esta tabla es additive.
CREATE TABLE IF NOT EXISTS media_assets (
  key          TEXT PRIMARY KEY,            -- slug legible, ej: 'nosotros-hero-2026'
  url          TEXT NOT NULL,               -- URL pública del archivo
  bucket       TEXT NOT NULL DEFAULT 'public',
  mime_type    TEXT,                        -- 'image/jpeg', 'image/webp', etc.
  size_bytes   INT,
  width_px     INT,                         -- dimensiones originales
  height_px    INT,
  alt_text     TEXT,                        -- texto alternativo SEO
  -- JSON con referencias: [{"table":"page_sections","field":"image_url","id":"<uuid>"}]
  used_in      JSONB NOT NULL DEFAULT '[]',
  uploaded_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_bucket_idx ON media_assets (bucket);
CREATE INDEX IF NOT EXISTS media_assets_mime_idx   ON media_assets (mime_type);

-- RLS: solo service role (los assets se usan desde server-side)
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Lectura pública de metadatos de assets (no de credenciales)
CREATE POLICY "media_assets_public_read" ON media_assets
  FOR SELECT USING (true);

-- ============================================================
-- FIN migración 14
-- ============================================================
