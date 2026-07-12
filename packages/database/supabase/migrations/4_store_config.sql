-- Configuración general de la tienda (fila única, id = 1)
CREATE TABLE IF NOT EXISTS store_config (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  whatsapp_number TEXT    DEFAULT NULL,
  store_name      TEXT    NOT NULL DEFAULT 'VPS Coffee',
  store_email     TEXT    DEFAULT NULL,
  logo_url        TEXT    DEFAULT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insertar fila inicial si no existe
INSERT INTO store_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- RLS: solo service role accede (contiene API keys de Resend y datos de tienda)
ALTER TABLE store_config ENABLE ROW LEVEL SECURITY;
