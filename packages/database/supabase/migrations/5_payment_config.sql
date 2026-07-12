-- ============================================================
-- Migración 006 — Configuración de pasarelas de pago
-- Tabla singleton (id = 1) con credenciales de Wompi y MercadoPago.
-- Las credenciales se gestionan desde el panel admin; no requieren
-- variables de entorno para el flujo de checkout.
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_config (
  id               INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  -- Wompi (Bancolombia)
  wompi_public_key       TEXT,
  wompi_private_key      TEXT,
  wompi_integrity_secret TEXT,   -- Firma de payment links (SHA256)
  wompi_events_secret    TEXT,   -- Verificación de webhooks
  wompi_active           BOOLEAN NOT NULL DEFAULT false,

  -- MercadoPago
  mercadopago_access_token  TEXT,
  mercadopago_public_key    TEXT,
  mercadopago_active        BOOLEAN NOT NULL DEFAULT false,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fila singleton
INSERT INTO payment_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS: solo service_role puede leer/escribir (el admin lo hace vía API route server-side)
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_payment_config"
  ON payment_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
