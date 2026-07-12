-- Migration 13: Origin address for Skydropx shipments
-- These fields define the sender's address used in quotations and shipment labels.
-- Quotation uses: origin_postal_code, origin_neighborhood, origin_city, origin_department
-- Shipment uses:  origin_name, origin_street, origin_city, origin_department,
--                 origin_postal_code, origin_phone, origin_email

ALTER TABLE shipping_config
  ADD COLUMN IF NOT EXISTS origin_name         TEXT,
  ADD COLUMN IF NOT EXISTS origin_street       TEXT,
  ADD COLUMN IF NOT EXISTS origin_neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS origin_city         TEXT,
  ADD COLUMN IF NOT EXISTS origin_department   TEXT,
  ADD COLUMN IF NOT EXISTS origin_postal_code  TEXT,
  ADD COLUMN IF NOT EXISTS origin_phone        TEXT,
  ADD COLUMN IF NOT EXISTS origin_email        TEXT;
