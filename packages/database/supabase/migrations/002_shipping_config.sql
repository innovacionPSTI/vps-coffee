-- ============================================================
-- Migration 002 — Shipping Provider Configuration
-- ============================================================
-- Stores the active shipping provider and its credentials.
-- Only one row is expected (singleton config pattern).
-- Credentials for each provider are stored in dedicated columns
-- so that adding a new provider only requires adding columns,
-- never restructuring the table.
-- ============================================================

CREATE TYPE shipping_provider_type AS ENUM ('fixed', 'skydropx');

CREATE TABLE shipping_config (
  id               SERIAL PRIMARY KEY,

  -- Active provider selector
  provider         shipping_provider_type NOT NULL DEFAULT 'fixed',

  -- Fallback / default flat rate (COP).
  -- Used when provider = 'fixed' OR when the selected provider fails.
  fixed_rate       NUMERIC(12, 2) NOT NULL DEFAULT 8000,

  -- ── Skydropx credentials ───────────────────────────────────
  skydropx_client_id       TEXT,
  skydropx_client_secret   TEXT,
  skydropx_address_from_id TEXT,
  skydropx_base_url        TEXT NOT NULL DEFAULT 'https://api-pro.skydropx.com',

  -- ── Extensibility: future providers add columns here ───────
  -- fedex_api_key   TEXT,
  -- deprisa_username TEXT,
  -- ...

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
