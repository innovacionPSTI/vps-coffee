-- Perfiles de envío por usuario (keyed por email de Stack Auth)
CREATE TABLE IF NOT EXISTS shipping_profiles (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  first_name  TEXT,
  last_name   TEXT,
  phone       TEXT,
  address     TEXT,
  city        TEXT,
  department  TEXT,
  postal_code TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shipping_profiles_email_idx ON shipping_profiles (email);

-- RLS: solo service role accede (datos personales de envío del usuario)
ALTER TABLE shipping_profiles ENABLE ROW LEVEL SECURITY;
