-- ============================================================
-- Migration 002 — Shipping Provider Configuration
-- ============================================================
-- Stores the active shipping provider, its credentials,
-- free-shipping rules, and the sender address used for
-- Skydropx quotations and shipment labels.
-- Only one row is expected (singleton config pattern).
-- ============================================================

CREATE TYPE shipping_provider_type AS ENUM ('fixed', 'skydropx');

CREATE TABLE shipping_config (
  id               SERIAL PRIMARY KEY,

  -- Active provider selector
  provider         shipping_provider_type NOT NULL DEFAULT 'fixed',

  -- Fallback / default flat rate (COP).
  -- Used when provider = 'fixed' OR when the selected provider fails.
  fixed_rate       NUMERIC(12, 2) NOT NULL DEFAULT 8000,

  -- ── Free shipping promotion ─────────────────────────────────
  free_shipping_enabled    BOOLEAN        NOT NULL DEFAULT true,
  free_shipping_min_amount NUMERIC(12, 2) NOT NULL DEFAULT 100000,

  -- ── Skydropx credentials ───────────────────────────────────
  skydropx_client_id       TEXT,
  skydropx_client_secret   TEXT,
  skydropx_address_from_id TEXT,
  skydropx_base_url        TEXT NOT NULL DEFAULT 'https://api-pro.skydropx.com',

  -- ── Skydropx origin address ────────────────────────────────
  -- Used in quotations (postal_code, neighborhood, city, department)
  -- and shipment labels (name, street, city, department, postal_code, phone, email)
  origin_name         TEXT,
  origin_street       TEXT,
  origin_neighborhood TEXT,
  origin_city         TEXT,
  origin_department   TEXT,
  origin_postal_code  TEXT,
  origin_phone        TEXT,
  origin_email        TEXT,

  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Singleton: only one config row is allowed
CREATE UNIQUE INDEX shipping_config_singleton ON shipping_config ((TRUE));

-- Default row: starts with fixed rate until admin configures a provider
INSERT INTO shipping_config (provider, fixed_rate)
VALUES ('fixed', 8000);

-- ── RLS ────────────────────────────────────────────────────────────────────────
ALTER TABLE shipping_config ENABLE ROW LEVEL SECURITY;

-- Public read (needed so checkout API can read the config)
CREATE POLICY "Public can read shipping_config"
  ON shipping_config FOR SELECT USING (TRUE);

-- Only service role (admin) can write
CREATE POLICY "Service role can update shipping_config"
  ON shipping_config FOR UPDATE
  USING (auth.role() = 'service_role');

COMMENT ON TABLE shipping_config IS
  'Singleton table that stores the active shipping provider and its credentials. '
  'Managed from the admin panel. Credentials are stored here instead of env vars '
  'so they can be updated at runtime without redeployment.';

COMMENT ON COLUMN shipping_config.free_shipping_enabled IS
  'When true, orders whose subtotal >= free_shipping_min_amount pay $0 shipping.';
COMMENT ON COLUMN shipping_config.free_shipping_min_amount IS
  'Minimum order subtotal (COP) to qualify for free shipping.';

-- ─── SHIPPING PROFILES ────────────────────────────────────────────────────────
-- Perfil de envío por usuario (keyed por email de Stack Auth).
-- Guarda los datos de contacto y dirección de uso frecuente del comprador.
CREATE TABLE IF NOT EXISTS shipping_profiles (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  first_name  TEXT,
  last_name   TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  department  TEXT,
  postal_code TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shipping_profiles_email_idx ON shipping_profiles (email);

-- RLS: solo service role accede (datos personales de envío del usuario)
ALTER TABLE shipping_profiles ENABLE ROW LEVEL SECURITY;
