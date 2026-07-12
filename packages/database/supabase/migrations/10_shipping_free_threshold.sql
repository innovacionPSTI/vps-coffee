-- ============================================================
-- Migration 010 — Shipping: free shipping threshold configurable
-- ============================================================
-- Adds two columns to shipping_config so the free-shipping
-- promotion can be toggled and its minimum amount adjusted
-- from the admin panel without code changes.
-- ============================================================

ALTER TABLE shipping_config
  ADD COLUMN IF NOT EXISTS free_shipping_enabled    BOOLEAN        NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS free_shipping_min_amount NUMERIC(12, 2) NOT NULL DEFAULT 100000;

COMMENT ON COLUMN shipping_config.free_shipping_enabled IS
  'When true, orders whose subtotal >= free_shipping_min_amount pay $0 shipping.';
COMMENT ON COLUMN shipping_config.free_shipping_min_amount IS
  'Minimum order subtotal (COP) to qualify for free shipping.';
