-- Migration 23: Provider fields for Épica 15 — Arquitectura de Proveedores Intercambiables
--
-- Adds:
--   store_config.email_provider          TEXT DEFAULT 'resend'
--   payment_config.tucompra_merchant_id  TEXT NULL
--   payment_config.tucompra_secret_key   TEXT NULL
--   payment_config.tucompra_sandbox      BOOLEAN DEFAULT true
--   payment_config.tucompra_active       BOOLEAN DEFAULT false

-- ─── store_config: active email provider selector ────────────────────────────
ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS email_provider TEXT NOT NULL DEFAULT 'resend'
    CHECK (email_provider IN ('resend'));
-- NOTE: when new providers are added, the CHECK constraint should be updated via
-- a subsequent migration: ALTER TABLE store_config DROP CONSTRAINT ..., ADD CONSTRAINT ...

-- ─── payment_config: Tu Compra gateway fields ────────────────────────────────
ALTER TABLE payment_config
  ADD COLUMN IF NOT EXISTS tucompra_merchant_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS tucompra_secret_key  TEXT NULL,
  ADD COLUMN IF NOT EXISTS tucompra_sandbox     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tucompra_active      BOOLEAN NOT NULL DEFAULT false;

-- Back-fill existing rows (should only be one — id=1)
UPDATE store_config SET email_provider = 'resend' WHERE email_provider IS NULL;
UPDATE payment_config SET tucompra_active = false, tucompra_sandbox = true
  WHERE tucompra_active IS NULL;
