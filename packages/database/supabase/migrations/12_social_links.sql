-- ============================================================
-- Migration 012 — Social media links in store_config
-- ============================================================

ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS instagram_url     TEXT,
  ADD COLUMN IF NOT EXISTS instagram_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS facebook_url      TEXT,
  ADD COLUMN IF NOT EXISTS facebook_enabled  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tiktok_url        TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_enabled    BOOLEAN NOT NULL DEFAULT true;
