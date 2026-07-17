-- Migration 17: metadata JSONB en section_settings + sección Historia
--
-- Propósito:
--   Permite que cualquier sección del home tenga contenido configurable
--   (título, subtítulo, CTA, color de fondo, etc.) sin necesidad de código.
--   El campo metadata es un JSONB libre: cada sección define sus propias claves.
--
-- Sección Historia: guarda el contenido que estaba hardcodeado en el JSX.

-- ── 1. Columna metadata ─────────────────────────────────────────────────────
ALTER TABLE section_settings
  ADD COLUMN IF NOT EXISTS metadata JSONB NULL;

-- ── 2. Insertar sección Historia ────────────────────────────────────────────
INSERT INTO section_settings (key, page_key, label, description, enabled, order_index, metadata)
VALUES (
  'historia',
  'home',
  'Historia / Nosotros',
  'Bloque de texto destacado con frase principal y enlace a la página Nosotros',
  true,
  7,
  '{
    "title":    "Vivir para Servir",
    "subtitle": "Cada taza que preparamos lleva el compromiso de la excelencia y el cuidado desde el origen hasta tu mesa.",
    "cta_text": "Conoce nuestra historia →",
    "cta_url":  "/nosotros"
  }'::jsonb
)
ON CONFLICT (key, page_key) DO UPDATE
  SET metadata    = EXCLUDED.metadata,
      label       = EXCLUDED.label,
      description = EXCLUDED.description,
      order_index = EXCLUDED.order_index;
