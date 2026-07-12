-- ============================================================
-- VPS Coffee — Migración 8: Tabla customers
-- Mirror de usuarios web desde Stack Auth hacia Supabase.
-- Permite consultas SQL sin depender de la API de Stack Auth.
-- ============================================================

-- ─── CUSTOMERS ────────────────────────────────────────────────────────────────
-- Clientes web (compradores en el sitio público).
-- Separado de profiles, que es exclusivo para usuarios del panel admin.
--
-- Flujo de sincronización:
--   1. El comprador se registra en el sitio web vía Stack Auth.
--   2. /api/auth/welcome hace upsert de este registro con stack_id + email.
--   3. Los pedidos previos del mismo email se vinculan con UPDATE orders SET customer_id.
--
-- stack_id es NULL para compradores invitados (guest checkout); se completa
-- si el mismo email luego crea una cuenta.
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id    TEXT UNIQUE,                            -- ID en Stack Auth (null = guest)
  email       TEXT UNIQUE NOT NULL,
  name        TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_email_idx   ON customers (email);
CREATE INDEX IF NOT EXISTS customers_stack_id_idx ON customers (stack_id) WHERE stack_id IS NOT NULL;

COMMENT ON TABLE  customers             IS 'Compradores web. Mirror de Stack Auth. Separado de profiles (admin).';
COMMENT ON COLUMN customers.stack_id   IS 'ID del usuario en Stack Auth. NULL para compradores invitados.';
COMMENT ON COLUMN customers.email      IS 'Clave de enlace con Stack Auth y con orders.customer_email.';

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- Sin políticas anon: solo el service_role (backend) accede a esta tabla.

-- ─── FK orders → customers ────────────────────────────────────────────────────
-- orders.customer_id ya existe como UUID sin FK (migración 1).
-- Aquí le añadimos la restricción hacia customers.
ALTER TABLE orders
  ADD CONSTRAINT orders_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE SET NULL;   -- si se elimina el customer, el pedido queda sin FK pero conserva customer_email
