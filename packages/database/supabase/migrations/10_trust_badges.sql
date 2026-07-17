-- Migration 10: trust badges configurables en store_config
-- Agrega un arreglo JSONB de badges de confianza (texto + activado) que se
-- muestran en la página de producto. Por defecto vacío — el admin los configura.

ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS trust_badges JSONB NOT NULL DEFAULT '[]'::jsonb;
