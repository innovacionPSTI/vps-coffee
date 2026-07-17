-- ============================================================
-- Migración 12: Navegación configurable desde el admin
--
-- Reemplaza el array navLinks hardcodeado en Navbar.tsx con
-- una tabla configurable. Soporta:
--   - Links planos (href no nulo, parent_id nulo)
--   - Grupos con dropdown 1 nivel (href nulo o con link, parent_id nulo,
--     con hijos que tienen parent_id = id del grupo)
--
-- Alteraciones en store_config:
--   - nav_show_cart : ocultar el carrito (ej: sitio catálogo sin compra)
--   - nav_show_auth : ocultar el botón de cuenta/login
-- ============================================================

-- ─── NAV ITEMS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nav_items (
  id           SERIAL      PRIMARY KEY,
  label        TEXT        NOT NULL,
  href         TEXT        NULL,           -- Ruta interna (ej: /tienda). NULL → solo grupo
  enabled      BOOLEAN     NOT NULL DEFAULT true,
  order_index  INT         NOT NULL DEFAULT 0,
  parent_id    INT         NULL REFERENCES nav_items(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para construir el árbol eficientemente
CREATE INDEX IF NOT EXISTS nav_items_parent_idx
  ON nav_items (parent_id, order_index);

-- ─── STORE CONFIG: toggles del navbar ─────────────────────────────────────────
ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS nav_show_cart BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS nav_show_auth BOOLEAN NOT NULL DEFAULT true;

-- ─── SEED: links actuales (preservación del hardcode) ─────────────────────────
-- Estos son exactamente los 5 links que estaban en Navbar.tsx → navLinks[].
-- El administrador puede modificarlos, reordenarlos o agregar más desde /nav.
INSERT INTO nav_items (label, href, enabled, order_index) VALUES
  ('Café',      '/',          true, 1),
  ('Tienda',    '/tienda',    true, 2),
  ('Maquila',   '/maquila',   true, 3),
  ('Asesorías', '/asesorias', true, 4),
  ('Blog',      '/blog',      true, 5)
ON CONFLICT DO NOTHING;
