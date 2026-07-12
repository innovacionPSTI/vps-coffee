-- Migración 14: Modo mantenimiento y Analytics configurables desde el panel admin
ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN NOT NULL DEFAULT FALSE;
