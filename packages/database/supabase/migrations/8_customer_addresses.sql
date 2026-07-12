-- ============================================================
-- VPS Coffee — Migración 9: Tabla customer_addresses
-- Direcciones de envío guardadas por cada cliente web.
-- ============================================================

-- ─── CUSTOMER_ADDRESSES ───────────────────────────────────────────────────────
-- Cada cliente puede tener múltiples direcciones guardadas.
-- Una sola puede ser la predeterminada (is_default = true).
--
-- IMPORTANTE: estas son direcciones *guardadas para futuros pedidos*.
-- Los pedidos ya creados guardan una snapshot inmutable de la dirección
-- en orders.shipping_addr (JSONB) y esa nunca se modifica.
--
-- Flujo en checkout:
--   1. Si el usuario está logueado → GET /api/account/addresses → pre-llenar formulario.
--   2. Al confirmar pedido → POST /api/account/addresses si "guardar dirección" está activo.
--   3. La dirección elegida se copia también en orders.shipping_addr (snapshot).
CREATE TABLE IF NOT EXISTS customer_addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label        TEXT,                       -- etiqueta amigable: "Casa", "Oficina", etc.
  full_name    TEXT NOT NULL,              -- nombre completo del destinatario
  phone        TEXT,
  address      TEXT NOT NULL,             -- calle, número, barrio
  city         TEXT NOT NULL,
  department   TEXT,
  postal_code  TEXT,
  is_default   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_addresses_customer_idx ON customer_addresses (customer_id);

COMMENT ON TABLE  customer_addresses            IS 'Direcciones de envío guardadas por clientes web para pre-llenar el checkout.';
COMMENT ON COLUMN customer_addresses.is_default IS 'Solo una dirección por cliente puede ser default. La app lo controla antes del INSERT/UPDATE.';
COMMENT ON COLUMN customer_addresses.full_name  IS 'Nombre del destinatario en esta dirección (puede diferir del nombre del cliente).';

ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
-- Sin políticas anon: solo el service_role (backend) accede a esta tabla.
