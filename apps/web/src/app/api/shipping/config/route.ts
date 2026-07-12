import { NextResponse } from 'next/server'
import { getShippingConfig } from '@vps/database'

/**
 * GET /api/shipping/config
 *
 * Devuelve la configuración de envío pública (sin credenciales).
 * Usada por el carrito y el checkout para mostrar costos reales
 * sin exponer secrets de Skydropx.
 */
export async function GET() {
  try {
    const config = await getShippingConfig()
    return NextResponse.json({
      provider:                 config.provider,
      fixed_rate:               config.fixed_rate,
      free_shipping_enabled:    config.free_shipping_enabled,
      free_shipping_min_amount: config.free_shipping_min_amount,
    })
  } catch {
    // Fallback seguro si la BD no responde
    return NextResponse.json({
      provider:                 'fixed',
      fixed_rate:               8000,
      free_shipping_enabled:    true,
      free_shipping_min_amount: 100000,
    })
  }
}
