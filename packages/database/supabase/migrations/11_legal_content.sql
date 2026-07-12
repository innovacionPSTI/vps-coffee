-- ============================================================
-- Migration 011 — Legal content in store_config
-- ============================================================
-- Adds editable terms & conditions and privacy policy columns
-- to the store_config singleton so they can be managed from
-- the admin panel without code changes.
-- ============================================================

ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS terms_content   TEXT,
  ADD COLUMN IF NOT EXISTS privacy_content TEXT;

COMMENT ON COLUMN store_config.terms_content IS
  'Markdown content for the Terms & Conditions page (/terminos).';
COMMENT ON COLUMN store_config.privacy_content IS
  'Markdown content for the Privacy Policy page (/privacidad).';
