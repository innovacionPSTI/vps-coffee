import { NextResponse } from 'next/server'
import { getPaymentConfig, getActiveGateways } from '@vps/database'

const GATEWAY_META: Record<string, { label: string; desc: string }> = {
  wompi:       { label: 'Wompi',       desc: 'Tarjeta débito/crédito, PSE, Bancolombia' },
  mercadopago: { label: 'MercadoPago', desc: 'Tarjeta, efectivo, Nequi, Daviplata' },
  tucompra:    { label: 'Tu Compra',   desc: 'Tarjeta, efectivo, Nequi, PSE' },
}

/**
 * GET /api/checkout/gateways
 * Returns the list of active payment gateways configured in payment_config.
 * Public endpoint — no auth required.
 */
export async function GET() {
  try {
    const config = await getPaymentConfig()
    if (!config) throw new Error('No payment config')
    const names  = getActiveGateways(config)

    const gateways = names.map((name) => ({
      value: name,
      label: GATEWAY_META[name]?.label ?? name,
      desc:  GATEWAY_META[name]?.desc  ?? '',
    }))

    // Fallback: if nothing is configured yet, show wompi as default so checkout doesn't break
    if (gateways.length === 0) {
      gateways.push({ value: 'wompi', label: 'Wompi', desc: 'Tarjeta débito/crédito, PSE, Bancolombia' })
    }

    return NextResponse.json({ gateways })
  } catch (err) {
    console.error('[checkout/gateways GET]', err)
    // Fallback on DB error
    return NextResponse.json({
      gateways: [{ value: 'wompi', label: 'Wompi', desc: 'Tarjeta débito/crédito, PSE, Bancolombia' }],
    })
  }
}
