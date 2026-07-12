-- Migración 15: Tabla de cupones de descuento
CREATE TABLE IF NOT EXISTS coupons (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(50) UNIQUE NOT NULL,
  type         VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value        DECIMAL(10,2) NOT NULL CHECK (value > 0),
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_uses     INTEGER NULL,          -- NULL = usos ilimitados
  used_count   INTEGER NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ NULL,      -- NULL = nunca expira
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para búsqueda por código (case-insensitive en la aplicación)
CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons (LOWER(code));
