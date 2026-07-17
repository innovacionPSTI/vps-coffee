-- ============================================================
-- BACKUP: Navegación hardcodeada antes de la migración 12
-- ============================================================
-- Este archivo preserva los links que estaban en Navbar.tsx
-- como constante navLinks[]. Una vez ejecutada la migración
-- 12_nav_items.sql, el seed de esa migración los inserta
-- automáticamente. Este archivo sirve solo como referencia.
-- ============================================================

-- Insertar en nav_items (ejecutar DESPUÉS de 12_nav_items.sql
-- si por algún motivo el seed no corrió o se necesita restaurar)
INSERT INTO nav_items (label, href, enabled, order_index) VALUES
  ('Café',      '/',          true, 1),
  ('Tienda',    '/tienda',    true, 2),
  ('Maquila',   '/maquila',   true, 3),
  ('Asesorías', '/asesorias', true, 4),
  ('Blog',      '/blog',      true, 5)
ON CONFLICT DO NOTHING;
