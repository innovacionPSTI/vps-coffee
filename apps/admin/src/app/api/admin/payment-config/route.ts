import { NextRequest, NextResponse } from 'next/server'
import { getPaymentConfig, updatePaymentConfig } from '@vps/database'
import type { PaymentConfig } from '@vps/database'

/** Enmascara los últimos 4 caracteres de un secret. Devuelve null si el campo es null. */
function maskSecret(value: string | null): string | null {
  if (!value) return null
  if (value.length <= 4) return '••••'
  return `••••${value.slice(-4)}`
}

type MaskedPaymentConfig = Omit<
  PaymentConfig,
  'wompi_private_key' | 'wompi_integrity_secret' | 'wompi_events_secret' | 'mercadopago_access_token'
> & {
  wompi_private_key: string | null
  wompi_integrity_secret: string | null
  wompi_events_secret: string | null
  mercadopago_access_token: string | null
  // Indica si cada secret ya tiene un valor guardado (para mostrar en la UI)
  has_wompi_private_key: boolean
  has_wompi_integrity_secret: boolean
  has_wompi_events_secret: boolean
  has_mercadopago_access_token: boolean
}

function maskConfig(config: PaymentConfig): MaskedPaymentConfig {
  return {
    ...config,
    wompi_private_key: maskSecret(config.wompi_private_key),
    wompi_integrity_secret: maskSecret(config.wompi_integrity_secret),
    wompi_events_secret: maskSecret(config.wompi_events_secret),
    mercadopago_access_token: maskSecret(config.mercadopago_access_token),
    // Flags para que la UI sepa si ya hay un valor
    has_wompi_private_key: !!config.wompi_private_key,
    has_wompi_integrity_secret: !!config.wompi_integrity_secret,
    has_wompi_events_secret: !!config.wompi_events_secret,
    has_mercadopago_access_token: !!config.mercadopago_access_token,
  }
}

export async function GET() {
  try {
    const config = await getPaymentConfig()
    if (!config) {
      return NextResponse.json({
        id: 1,
        wompi_public_key: null,
        wompi_private_key: null,
        wompi_integrity_secret: null,
        wompi_events_secret: null,
        wompi_active: false,
        mercadopago_access_token: null,
        mercadopago_public_key: null,
        mercadopago_active: false,
        updated_at: new Date().toISOString(),
        has_wompi_private_key: false,
        has_wompi_integrity_secret: false,
        has_wompi_events_secret: false,
        has_mercadopago_access_token: false,
      })
    }
    return NextResponse.json(maskConfig(config))
  } catch (err) {
    console.error('[admin/payment-config GET]', err)
    return NextResponse.json({ error: 'Error cargando configuración de pagos' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as Partial<Omit<PaymentConfig, 'id' | 'updated_at'>>

    // Validación básica: public_key de Wompi debe empezar con pub_
    if (body.wompi_public_key && !body.wompi_public_key.startsWith('pub_')) {
      return NextResponse.json(
        { error: 'La llave pública de Wompi debe comenzar con "pub_"' },
        { status: 400 },
      )
    }

    const updated = await updatePaymentConfig(body)
    return NextResponse.json(maskConfig(updated))
  } catch (err) {
    console.error('[admin/payment-config PATCH]', err)
    return NextResponse.json({ error: 'Error guardando configuración de pagos' }, { status: 500 })
  }
}
