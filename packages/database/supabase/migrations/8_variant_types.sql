-- ============================================================
-- VPS Coffee — Migración 8: Tipos de variante globales
--
-- Permite crear plantillas reutilizables de atributo
-- (ej: "Tueste" → ["Claro", "Medio", "Oscuro"]) que luego se
-- asignan a productos para generar combinaciones automáticamente
-- desde el panel de administración.
--
-- Las extensiones de product_variants (attributes, dimensions) y
-- de products (variant_options) ya están en la migración 1.
-- ============================================================

CREATE TABLE IF NOT EXISTS variant_types (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,           -- "Tueste", "Peso", "Color"
  values       JSONB NOT NULL DEFAULT '[]',    -- ["Claro", "Medio", "Oscuro"]
  display_type TEXT NOT NULL DEFAULT 'pill'
               CHECK (display_type IN ('pill', 'swatch')),
  active       BOOLEAN NOT NULL DEFAULT true,
  order_index  INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para ordenar por order_index en listados
CREATE INDEX IF NOT EXISTS variant_types_order_idx ON variant_types (order_index, id);

-- RLS habilitado (acceso solo vía service role desde el backend)
ALTER TABLE variant_types ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (la tienda necesita leer los tipos para filtros)
CREATE POLICY "variant_types_select_public"
  ON variant_types FOR SELECT
  USING (true);

-- Política de escritura solo para service role
CREATE POLICY "variant_types_service_role_write"
  ON variant_types FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Seed: tipos comunes para una tienda de café
INSERT INTO variant_types (name, values, display_type, order_index) VALUES
  ('Tueste',   '["Claro", "Medio", "Oscuro"]',               'pill', 0),
  ('Peso',     '["250g", "500g", "1kg"]',                    'pill', 1),
  ('Molienda', '["Grano entero", "Media", "Fina", "Gruesa"]','pill', 2)
ON CONFLICT (name) DO NOTHING;
