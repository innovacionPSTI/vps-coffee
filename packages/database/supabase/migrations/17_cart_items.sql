-- Migración 17: Carrito persistente en BD para usuarios autenticados
CREATE TABLE IF NOT EXISTS cart_items (
  id            SERIAL PRIMARY KEY,
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  variant_id    INTEGER NOT NULL,
  product_id    INTEGER NOT NULL,
  product_name  TEXT NOT NULL,
  variant_label TEXT NOT NULL,
  qty           INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  price         DECIMAL(10,2) NOT NULL,
  image_url     TEXT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, variant_id)
);

CREATE INDEX IF NOT EXISTS cart_items_customer_idx ON cart_items (customer_id);
