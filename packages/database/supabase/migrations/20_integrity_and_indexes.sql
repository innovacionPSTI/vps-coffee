-- ============================================================
-- Migración 20: Integridad referencial e índices de rendimiento
-- ============================================================
-- Objetivo: fortalecer el modelo de datos post-migración 19 con:
--   1. NOT NULL en section_items.metadata (columna añadida en migración 19)
--   2. Índices compuestos para patrones de consulta frecuentes
--   3. Índice GIN en media_assets.used_in para búsquedas JSONB
--   4. Trigger updated_at en section_items (consistencia con page_sections)
--   5. CHECK constraint en page_sections.section_type (enum de tipos conocidos)
--   6. Comentarios de tabla para documentación del esquema
-- ============================================================

-- ── 1. Garantizar NOT NULL en section_items.metadata ─────────────────────────
-- La columna fue añadida en migración 19 con DEFAULT '{}' pero sin NOT NULL,
-- lo que permite NULLs en filas existentes. Corregimos antes de añadir el constraint.

UPDATE section_items
SET metadata = '{}'::jsonb
WHERE metadata IS NULL;

ALTER TABLE section_items
  ALTER COLUMN metadata SET NOT NULL,
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb;

-- ── 2. Índices compuestos — page_sections ─────────────────────────────────────

-- Consulta más frecuente: secciones de una página, filtrando habilitadas, ordenadas
CREATE INDEX IF NOT EXISTS page_sections_page_enabled_idx
  ON page_sections (page_key, enabled, order_index)
  WHERE enabled = true;

-- Lookup directo por tipo de sección dentro de una página (getSection('hero'), etc.)
CREATE INDEX IF NOT EXISTS page_sections_page_type_idx
  ON page_sections (page_key, section_type);

-- ── 3. Índices compuestos — section_items ─────────────────────────────────────

-- El índice existente en migración 13 cubre (section_id, order_index).
-- Añadimos el filtro de enabled para el patrón más común de producción:
--   WHERE section_id = $1 AND enabled = true ORDER BY order_index
CREATE INDEX IF NOT EXISTS section_items_section_enabled_idx
  ON section_items (section_id, enabled, order_index)
  WHERE enabled = true;

-- Lookup por item_type dentro de una sección (testimonials, slides, etc.)
CREATE INDEX IF NOT EXISTS section_items_type_idx
  ON section_items (section_id, item_type);

-- ── 4. Índice GIN en media_assets.used_in ────────────────────────────────────
-- Permite búsquedas de containment: "¿qué assets usa esta sección?" con @> operator.
-- Ejemplo: WHERE used_in @> '[{"table":"section_items","id":42}]'

CREATE INDEX IF NOT EXISTS media_assets_used_in_gin_idx
  ON media_assets USING GIN (used_in);

-- ── 5. Trigger updated_at en section_items ───────────────────────────────────
-- page_sections ya tiene updated_at; section_items solo tiene created_at.
-- Añadimos updated_at para auditoría completa.

ALTER TABLE section_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Función genérica (reutilizable si no existe ya)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para section_items
DROP TRIGGER IF EXISTS section_items_updated_at ON section_items;
CREATE TRIGGER section_items_updated_at
  BEFORE UPDATE ON section_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger para nav_items (también le falta)
ALTER TABLE nav_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS nav_items_updated_at ON nav_items;
CREATE TRIGGER nav_items_updated_at
  BEFORE UPDATE ON nav_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 6. CHECK constraint para section_type ────────────────────────────────────
-- Previene tipos inválidos en la base de datos.
-- La lista incluye todos los tipos reconocidos por el frontend.
-- Para añadir nuevos tipos, se requiere una migración explícita.

-- Primero, normalizar cualquier section_type que no esté en la lista de tipos
-- conocidos. Esto puede ocurrir si la migración 19 migró section_settings con
-- claves personalizadas. Los registros desconocidos se convierten a 'text'
-- (tipo genérico, seguro como fallback) para no perder contenido.
UPDATE page_sections
SET section_type = 'text'
WHERE section_type NOT IN (
  'hero', 'text', 'cards', 'faq', 'cta', 'testimonials', 'whatsapp',
  'services', 'featured_products', 'best_sellers', 'historia',
  'blog_preview', 'newsletter'
);

ALTER TABLE page_sections
  DROP CONSTRAINT IF EXISTS page_sections_section_type_check;

ALTER TABLE page_sections
  ADD CONSTRAINT page_sections_section_type_check
  CHECK (section_type IN (
    'hero', 'text', 'cards', 'faq', 'cta', 'testimonials', 'whatsapp',
    'services', 'featured_products', 'best_sellers', 'historia',
    'blog_preview', 'newsletter'
  ));

-- ── 7. Comentarios de tabla para documentación del esquema ───────────────────

COMMENT ON TABLE pages IS
  'Páginas del sitio. Cada página tiene page_type (home|static|landing) y puede anidarse en page_sections.';

COMMENT ON TABLE page_sections IS
  'Bloques de contenido dentro de una página. section_type define el componente a renderizar.
   Reemplaza las tablas legacy: banners, section_settings, testimonials (eliminadas en migración 19).';

COMMENT ON TABLE section_items IS
  'Ítems individuales dentro de una sección (slides de hero, tarjetas, testimonios, FAQ, servicios...).
   metadata JSONB almacena campos variables según el tipo: bg_color (hero/services), rating+role (testimonials).';

COMMENT ON TABLE nav_items IS
  'Ítems del menú de navegación principal. page_key apunta opcionalmente a una página del CMS.';

COMMENT ON TABLE media_assets IS
  'Inventario centralizado de archivos subidos. used_in es un array JSONB de referencias
   a las entidades que usan el asset (para limpieza de archivos huérfanos).';

COMMENT ON COLUMN section_items.metadata IS
  'Campos variables por tipo de ítem. Ejemplos:
   hero/services: {"bg_color": "#614A2A"}
   testimonials:  {"rating": 5, "role": "Cliente frecuente"}';

COMMENT ON COLUMN page_sections.settings IS
  'Configuración propia de la sección. Ejemplos:
   historia: {"title": "...", "body": "...", "image_url": "..."}
   newsletter: {"placeholder": "Tu email..."}';
