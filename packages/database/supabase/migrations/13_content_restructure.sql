-- ============================================================
-- Migración 13: Reestructuración del modelo de contenido
--
-- Convierte el sistema de páginas en un constructor genérico
-- de secciones ordenadas, desacoplado del contenido de café.
--
-- Cambios:
--   pages          → agrega page_type, meta_title, meta_description
--                    elimina campos inline (hero_*, intro_*, cta_*)
--   page_sections  → bloques ordenados dentro de una página
--                    (hero | text | cards | faq | cta | testimonials | whatsapp)
--   section_items  → ítems dentro de una sección (cards, FAQs)
--   nav_items      → agrega page_key FK nullable a pages
--   page_items     → se migra a section_items y se elimina
-- ============================================================

-- ─── 1. Nuevos campos en pages ────────────────────────────────────────────────
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS page_type        TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS meta_title       TEXT NULL,
  ADD COLUMN IF NOT EXISTS meta_description TEXT NULL;

-- ─── 2. page_sections — bloques de contenido dentro de una página ─────────────
CREATE TABLE IF NOT EXISTS page_sections (
  id           SERIAL      PRIMARY KEY,
  page_key     TEXT        NOT NULL REFERENCES pages(key) ON DELETE CASCADE,
  section_type TEXT        NOT NULL DEFAULT 'text',
  -- Tipos válidos:
  --   'hero'         → imagen de fondo, título grande, subtítulo, CTA opcional
  --   'text'         → título + cuerpo de texto (párrafos)
  --   'cards'        → grid de tarjetas (ítems via section_items)
  --   'faq'          → acordeón de preguntas frecuentes (ítems via section_items)
  --   'cta'          → llamada a acción centrada con botón
  --   'testimonials' → carrusel de testimonios (tabla testimonials)
  --   'whatsapp'     → botón/formulario de contacto WhatsApp
  title        TEXT        NULL,
  subtitle     TEXT        NULL,
  body         TEXT        NULL,
  image_url    TEXT        NULL,
  cta_label    TEXT        NULL,
  cta_url      TEXT        NULL,
  enabled      BOOLEAN     NOT NULL DEFAULT true,
  order_index  INT         NOT NULL DEFAULT 0,
  -- Datos adicionales específicos del section_type:
  --   testimonials: { "filter_by_page": true }
  --   whatsapp:     { "message_type": "asesoria" | "maquila" | "general" }
  settings     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS page_sections_page_key_idx
  ON page_sections (page_key, order_index);

-- ─── 3. section_items — ítems dentro de una sección ──────────────────────────
CREATE TABLE IF NOT EXISTS section_items (
  id           SERIAL      PRIMARY KEY,
  section_id   INT         NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
  item_type    TEXT        NOT NULL DEFAULT 'card',  -- 'card' | 'faq'
  icon         TEXT        NULL,
  title        TEXT        NULL,
  description  TEXT        NULL,
  question     TEXT        NULL,
  answer       TEXT        NULL,
  image_url    TEXT        NULL,
  enabled      BOOLEAN     NOT NULL DEFAULT true,
  order_index  INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS section_items_section_idx
  ON section_items (section_id, order_index);

-- ─── 4. nav_items: FK opcional a pages ───────────────────────────────────────
-- Permite que un nav_item navegue a una página administrada.
-- Si page_key está presente, el href y label son sobreescribibles desde la página.
ALTER TABLE nav_items
  ADD COLUMN IF NOT EXISTS page_key TEXT NULL REFERENCES pages(key) ON DELETE SET NULL;

-- ─── 5. Migrar pages.hero_* + intro_* + cta_* → page_sections ────────────────
-- Hero sections (para páginas que tenían hero_title o hero_image_url)
INSERT INTO page_sections (page_key, section_type, title, subtitle, image_url, cta_label, cta_url, order_index)
SELECT
  key,
  'hero',
  hero_title,
  hero_subtitle,
  hero_image_url,
  cta_label,
  cta_url,
  1
FROM pages
WHERE hero_title IS NOT NULL
   OR hero_subtitle IS NOT NULL
   OR hero_image_url IS NOT NULL
ON CONFLICT DO NOTHING;

-- Text/intro sections (para páginas que tenían intro_title o intro_body)
INSERT INTO page_sections (page_key, section_type, title, body, order_index)
SELECT
  key,
  'text',
  intro_title,
  intro_body,
  5
FROM pages
WHERE intro_title IS NOT NULL
   OR intro_body IS NOT NULL
ON CONFLICT DO NOTHING;

-- ─── 6. Migrar page_items → page_sections + section_items ────────────────────
-- Crear una sección por cada (page_key, item_type) único.
-- Los cards van a section_type='cards', los faq a section_type='faq'.
-- Luego mover los ítems a la sección correspondiente.

DO $$
DECLARE
  r RECORD;
  new_section_id INT;
  section_title TEXT;
  section_order INT;
BEGIN
  FOR r IN
    SELECT DISTINCT page_key, item_type
    FROM page_items
    ORDER BY page_key, item_type
  LOOP
    -- Título y orden por defecto según tipo
    section_title := CASE r.item_type
      WHEN 'faq'  THEN 'Preguntas frecuentes'
      ELSE             'Contenido'
    END;
    section_order := CASE r.item_type
      WHEN 'faq'  THEN 20
      ELSE             10
    END;

    -- Insertar sección si no existe ya (puede existir si se corre la migración dos veces)
    INSERT INTO page_sections (page_key, section_type, title, order_index)
    VALUES (r.page_key, r.item_type, section_title, section_order)
    ON CONFLICT DO NOTHING
    RETURNING id INTO new_section_id;

    -- Si ya existía (ON CONFLICT), buscarla
    IF new_section_id IS NULL THEN
      SELECT id INTO new_section_id
      FROM page_sections
      WHERE page_key = r.page_key
        AND section_type = r.item_type
      LIMIT 1;
    END IF;

    -- Mover ítems a la nueva sección
    INSERT INTO section_items
      (section_id, item_type, icon, title, description, question, answer, enabled, order_index)
    SELECT
      new_section_id,
      pi.item_type,
      pi.icon, pi.title, pi.description,
      pi.question, pi.answer,
      pi.enabled, pi.order_index
    FROM page_items pi
    WHERE pi.page_key = r.page_key
      AND pi.item_type = r.item_type
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ─── 7. Enlazar nav_items a pages por href coincidente ───────────────────────
UPDATE nav_items ni
SET page_key = p.key
FROM pages p
WHERE (ni.href = '/' || p.slug OR ni.href = p.slug)
  AND ni.page_key IS NULL;

-- ─── 8. Actualizar page_type basado en claves existentes ─────────────────────
-- (Solo si existen filas con esas claves de la seed anterior)
UPDATE pages SET page_type = 'about'    WHERE key = 'nosotros' AND page_type = 'custom';
UPDATE pages SET page_type = 'services' WHERE key IN ('asesorias', 'maquila') AND page_type = 'custom';

-- ─── 9. Eliminar columnas inline de pages (migradas a page_sections) ──────────
ALTER TABLE pages
  DROP COLUMN IF EXISTS hero_title,
  DROP COLUMN IF EXISTS hero_subtitle,
  DROP COLUMN IF EXISTS hero_image_url,
  DROP COLUMN IF EXISTS intro_title,
  DROP COLUMN IF EXISTS intro_body,
  DROP COLUMN IF EXISTS cta_label,
  DROP COLUMN IF EXISTS cta_url;

-- ─── 10. Eliminar tabla page_items (datos ya en section_items) ───────────────
DROP TABLE IF EXISTS page_items CASCADE;
