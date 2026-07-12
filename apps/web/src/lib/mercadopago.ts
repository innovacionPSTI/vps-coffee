const MP_API_BASE = 'https://api.mercadopago.com'

export interface MPItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  currency_id?: string
}

export interface MPBackUrls {
  success: string
  failure: string
  pending: string
}

export interface MPPreferenceResult {
  id: string
  init_point: string
  sandbox_init_point: string
}

/**
 * Crea una preferencia de pago en MercadoPago.
 * Docs: https://www.mercadopago.com.co/developers/es/reference/preferences/_checkout_preferences/post
 *
 * El accessToken se lee desde la BD (payment_config); no usa process.env.
 */
export async function createMercadoPagoPreference(
  accessToken: string,
  params: {
    externalReference: string
    items: MPItem[]
    payerEmail: string
    backUrls: MPBackUrls
    notificationUrl: string
  },
): Promise<MPPreferenceResult> {
  const body = {
    external_reference: params.externalReference,
    items: params.items.map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: item.currency_id ?? 'COP',
    })),
    payer: { email: params.payerEmail },
    back_urls: params.backUrls,
    auto_return: 'approved',
    notification_url: params.notificationUrl,
    statement_descriptor: 'VPS Coffee',
  }

  const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`MercadoPago API error ${res.status}: ${err}`)
  }

  return res.json() as Promise<MPPreferenceResult>
}

/**
 * Consulta el estado de un pago en MercadoPago por su ID.
 * Usado desde el webhook para obtener external_reference y status reales.
 */
export async function getMercadoPagoPayment(
  accessToken: string,
  paymentId: string,
): Promise<{
  id: number
  status: string
  external_reference: string
  transaction_amount: number
}> {
  const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`MercadoPago payment fetch error ${res.status}: ${err}`)
  }

  return res.json()
}

/** Mapea el status de MercadoPago a nuestros valores internos */
export function mapMercadoPagoStatus(mpStatus: string): 'approved' | 'rejected' | 'pending' {
  const map: Record<string, 'approved' | 'rejected' | 'pending'> = {
    approved: 'approved',
    authorized: 'approved',
    rejected: 'rejected',
    cancelled: 'rejected',
    refunded: 'rejected',
    charged_back: 'rejected',
    pending: 'pending',
    in_process: 'pending',
    in_mediation: 'pending',
  }
  return map[mpStatus] ?? 'pending'
}

/** Un access token TEST-... es de sandbox */
export function isMercadoPagoSandbox(accessToken: string): boolean {
  return accessToken.startsWith('TEST-')
}
