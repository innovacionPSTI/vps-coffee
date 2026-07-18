import { createServerClient } from '../client'
import type { PaymentConfig } from '../types'

/** Lee la configuración de pasarelas de pago (singleton id=1) */
export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('payment_config')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // sin filas
    throw error
  }
  return data as PaymentConfig
}

/** Actualiza la configuración de pasarelas de pago.
 *  Los campos de secret que vengan como string vacío se omiten para
 *  evitar sobreescribir credenciales existentes accidentalmente. */
export async function updatePaymentConfig(
  input: Partial<Omit<PaymentConfig, 'id' | 'updated_at'>>,
): Promise<PaymentConfig> {
  const supabase = createServerClient()

  // Filtrar strings vacíos en campos de credenciales secretas
  const secretFields = [
    'wompi_public_key',
    'wompi_private_key',
    'wompi_integrity_secret',
    'wompi_events_secret',
    'mercadopago_access_token',
    'mercadopago_public_key',
    'tucompra_merchant_id',
    'tucompra_secret_key',
  ] as const

  const sanitized: typeof input = { ...input }
  for (const field of secretFields) {
    if (field in sanitized && sanitized[field] === '') {
      delete sanitized[field]
    }
  }

  const { data, error } = await supabase
    .from('payment_config')
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single()

  if (error) throw error
  return data as PaymentConfig
}
