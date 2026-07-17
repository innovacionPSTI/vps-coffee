-- ============================================================
-- VPS Coffee — Migración 5: Clientes web y carrito persistente
--
-- customers: mirror de usuarios web desde Stack Auth hacia Supabase.
--   Permite consultas SQL sin depender de la API de Stack Auth.
--
-- cart_items: carrito persistente en BD para usuarios autenticados.
--   FK a customers (cascade), products e product_variants.
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

CREATE INDEX IF NOT EXISTS customers_email_idx    ON customers (email);
CREATE INDEX IF NOT EXISTS customers_stack_id_idx ON customers (stack_id) WHERE stack_id IS NOT NULL;

COMMENT ON TABLE  customers           IS 'Compradores web. Mirror de Stack Auth. Separado de profiles (admin).';
COMMENT ON COLUMN customers.stack_id  IS 'ID del usuario en Stack Auth. NULL para compradores invitados.';
COMMENT ON COLUMN customers.email     IS 'Clave de enlace con Stack Auth y con orders.customer_email.';

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- Sin políticas anon: solo el service_role (backend) accede a esta tabla.

-- ─── FK orders → customers ────────────────────────────────────────────────────
-- orders.customer_id ya existe como UUID sin FK (migración 1).
-- Lo añadimos aquí porque customers se crea en esta misma migración.
ALTER TABLE orders
  ADD CONSTRAINT orders_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE SET NULL;   -- si se elimina el customer, el pedido conserva customer_email

-- ─── CART ITEMS ───────────────────────────────────────────────────────────────
-- Carrito persistente en BD para usuarios autenticados.
-- Permite recuperar el carrito al volver a sesión desde otro dispositivo.
--
-- FKs con ON DELETE CASCADE:
--   - customer_id → si se elimina el customer, se eliminan sus ítems.
--   - product_id  → si se elimina el producto, se eliminan sus ítems.
--   - variant_id  → si se elimina la variante, se eliminan sus ítems.
--   El carrito es transiente; si el producto/variante desaparece, el ítem no es válido.
CREATE TABLE IF NOT EXISTS cart_items (
  id            SERIAL PRIMARY KEY,
  customer_id   UUID    NOT NULL REFERENCES customers(id)        ON DELETE CASCADE,
  variant_id    INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  product_id    INTEGER NOT NULL REFERENCES products(id)         ON DELETE CASCADE,
  product_name  TEXT    NOT NULL,
  variant_label TEXT    NOT NULL,
  qty           INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  price         DECIMAL(10,2) NOT NULL,
  image_url     TEXT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, variant_id)
);

CREATE INDEX IF NOT EXISTS cart_items_customer_idx ON cart_items (customer_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
-- Sin políticas anon: solo el service_role (backend) accede a esta tabla.
