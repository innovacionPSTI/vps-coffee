-- ============================================================
-- Migración 007 — Configuración de emails transaccionales
-- Agrega campos de Resend a store_config (tabla singleton existente).
-- ============================================================

ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS resend_api_key    TEXT,
  ADD COLUMN IF NOT EXISTS resend_from_email TEXT DEFAULT 'pedidos@vpscoffee.com';
