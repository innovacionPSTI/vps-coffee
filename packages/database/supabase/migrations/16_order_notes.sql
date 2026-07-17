-- Migration 16: Notas internas en pedidos
-- Agrega campo notes (texto libre, uso interno del equipo, no visible al cliente)

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;
