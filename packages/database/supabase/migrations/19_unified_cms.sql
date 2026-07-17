-- ============================================================
-- Migración 19: Generalización del CMS
-- ============================================================
-- Objetivo: unificar los tres modelos de contenido paralelos
-- (banners, section_settings, testimonials) en el modelo único
-- pages → page_sections → section_items.
--
-- Pasos:
--   1. Extender section_items con campos que tenían los banners
--   2. Asegurar que la página 'home' existe en pages
--   3. Migrar section_settings  → page_sections
--   4. Migrar banners hero      → section_items (sección hero del home)
--   5. Migrar banners services  → section_items (sección services del home)
--   6. Migrar testimonials      → section_items (sección testimonials de asesorias)
--   7. Eliminar tablas legacy: banners, section_settings, testimonials
-- ============================================================

-- ── 1. Extender section_items ─────────────────────────────────────────────────

ALTER TABLE section_items
  ADD COLUMN IF NOT EXISTS image_url_mobile TEXT,
  ADD COLUMN IF NOT EXISTS link_url          TEXT,
  ADD COLUMN IF NOT EXISTS cta_text          TEXT,
  ADD COLUMN IF NOT EXISTS metadata          JSONB DEFAULT '{}';

-- ── 2. Asegurar home page ──────────────────────────────────────────────────────

INSERT INTO pages (key, label, slug, page_type, enabled, show_in_footer, order_index)
VALUES ('home', 'Inicio', 'home', 'home', true, false, 0)
ON CONFLICT (key) DO NOTHING;

-- ── 3. Migrar section_settings → page_sections ────────────────────────────────
-- Cada setting se convierte en una page_section cuyo section_type = key del setting.
-- El contenido libre (metadata) pasa a settings JSONB de la sección.
-- Si ya existe una page_section con ese page_key + section_type se conserva la que existe.

INSERT INTO page_sections (page_key, section_type, title, enabled, order_index, settings)
SELECT
  ss.page_key,
  ss.key            AS section_type,
  ss.label          AS title,
  ss.enabled,
  ss.order_index,
  COALESCE(ss.metadata, '{}')::jsonb AS settings
FROM section_settings ss
ON CONFLICT DO NOTHING;

-- ── 4. Migrar banners hero → section_items ────────────────────────────────────
-- Banners con page_key IS NULL son los slides del carrusel principal del home.
-- Fallback: banners con section='hero' sin page_key.

DO $$
DECLARE v_section_id INTEGER;
BEGIN
  -- Obtener (o crear) la sección hero del home
  SELECT id INTO v_section_id
  FROM page_sections
  WHERE page_key = 'home' AND section_type = 'hero'
  LIMIT 1;

  IF v_section_id IS NULL THEN
    INSERT INTO page_sections (page_key, section_type, title, enabled, order_index, settings)
    VALUES ('home', 'hero', 'Hero / Banner principal', true, 0, '{}')
    RETURNING id INTO v_section_id;
  END IF;

  -- Insertar los slides del hero
  INSERT INTO section_items (
    section_id, item_type, title, description,
    cta_text, link_url, image_url, image_url_mobile,
    enabled, order_index, metadata
  )
  SELECT
    v_section_id,
    'slide',
    b.title,
    b.subtitle,
    b.cta_text,
    b.cta_url,
    b.image_url,
    b.image_url_mobile,
    b.active,
    b.order_index,
    jsonb_build_object('bg_color', COALESCE(b.bg_color, '#614A2A'))
  FROM banners b
  WHERE b.page_key IS NULL;     -- banners globales del home

  -- Fallback: banners con section='hero' sin page_key (versión anterior a migración 14)
  IF NOT FOUND THEN
    INSERT INTO section_items (
      section_id, item_type, title, description,
      cta_text, link_url, image_url, image_url_mobile,
      enabled, order_index, metadata
    )
    SELECT
      v_section_id,
      'slide',
      b.title,
      b.subtitle,
      b.cta_text,
      b.cta_url,
      b.image_url,
      b.image_url_mobile,
      b.active,
      b.order_index,
      jsonb_build_object('bg_color', COALESCE(b.bg_color, '#614A2A'))
    FROM banners b
    WHERE b.section = 'hero';
  END IF;
END;
$$;

-- ── 5. Migrar banners services → section_items ────────────────────────────────

DO $$
DECLARE v_section_id INTEGER;
BEGIN
  SELECT id INTO v_section_id
  FROM page_sections
  WHERE page_key = 'home' AND section_type = 'services'
  LIMIT 1;

  IF v_section_id IS NULL THEN
    INSERT INTO page_sections (page_key, section_type, title, enabled, order_index, settings)
    VALUES ('home', 'services', 'Servicios', true, 20, '{}')
    RETURNING id INTO v_section_id;
  END IF;

  INSERT INTO section_items (
    section_id, item_type, title, description,
    cta_text, link_url, image_url,
    enabled, order_index, metadata
  )
  SELECT
    v_section_id,
    'service',
    b.title,
    b.subtitle,
    b.cta_text,
    b.cta_url,
    b.image_url,
    b.active,
    b.order_index,
    jsonb_build_object('bg_color', COALESCE(b.bg_color, '#614A2A'))
  FROM banners b
  WHERE b.section = 'services';
END;
$$;

-- ── 6. Migrar testimonials → section_items ────────────────────────────────────
-- Los testimonios se ubican bajo la sección 'testimonials' de la página asesorias.

DO $$
DECLARE v_section_id INTEGER;
BEGIN
  -- Intentar encontrar la sección de testimonios de asesorias
  SELECT id INTO v_section_id
  FROM page_sections
  WHERE page_key = 'asesorias' AND section_type = 'testimonials'
  LIMIT 1;

  IF v_section_id IS NULL THEN
    INSERT INTO page_sections (page_key, section_type, title, enabled, order_index, settings)
    VALUES ('asesorias', 'testimonials', 'Testimonios', true, 100, '{}')
    RETURNING id INTO v_section_id;
  END IF;

  INSERT INTO section_items (
    section_id, item_type, title, description, image_url,
    enabled, order_index, metadata
  )
  SELECT
    v_section_id,
    'testimonial',
    t.author_name,
    t.content,
    t.avatar_url,
    t.active,
    t.order_index,
    jsonb_build_object('rating', t.rating, 'role', COALESCE(t.author_role, ''))
  FROM testimonials t
  WHERE t.page_key = 'asesorias' OR t.page_key IS NULL
  ORDER BY t.order_index;
END;
$$;

-- ── 7. Eliminar tablas legacy ─────────────────────────────────────────────────

DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS section_settings CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
