-- ============================================================
-- Migration 004 — Store Configuration
-- ============================================================
-- Singleton table for all store-level settings:
-- branding, email (Resend), legal content, social links,
-- maintenance mode and analytics toggles.
-- ============================================================

CREATE TABLE IF NOT EXISTS store_config (
  id              INTEGER PRIMARY KEY DEFAULT 1,

  -- ── Branding ────────────────────────────────────────────────
  store_name      TEXT        NOT NULL DEFAULT 'VPS Coffee',
  store_email     TEXT        DEFAULT NULL,
  whatsapp_number TEXT        DEFAULT NULL,
  logo_url        TEXT        DEFAULT NULL,

  -- ── Transactional email (Resend) ────────────────────────────
  resend_api_key    TEXT,
  resend_from_email TEXT,

  -- ── Legal content (Markdown) ────────────────────────────────
  terms_content   TEXT,
  privacy_content TEXT,

  -- ── Social media links ──────────────────────────────────────
  instagram_url     TEXT,
  instagram_enabled BOOLEAN NOT NULL DEFAULT true,
  facebook_url      TEXT,
  facebook_enabled  BOOLEAN NOT NULL DEFAULT true,
  tiktok_url        TEXT,
  tiktok_enabled    BOOLEAN NOT NULL DEFAULT true,

  -- ── Operational toggles ─────────────────────────────────────
  maintenance_mode   BOOLEAN NOT NULL DEFAULT false,
  analytics_enabled  BOOLEAN NOT NULL DEFAULT false,

  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insertar fila inicial si no existe
INSERT INTO store_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- RLS: solo service role accede (contiene API keys y datos sensibles)
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN store_config.terms_content IS
  'Markdown content for the Terms & Conditions page (/terminos).';
COMMENT ON COLUMN store_config.privacy_content IS
  'Markdown content for the Privacy Policy page (/privacidad).';
