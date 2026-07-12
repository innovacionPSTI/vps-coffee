import { createHash } from 'crypto'

const WOMPI_CHECKOUT_BASE = 'https://checkout.wompi.co/p/'

/**
 * Construye la URL de pago de Wompi (Hosted Checkout).
 * Docs: https://docs.wompi.co/docs/en/widget-checkout-web
 *
 * La firma de integridad es SHA256(`{reference}{amountInCents}{currency}{integritySecret}`)
 * Las credenciales se leen desde la BD vía getPaymentConfig(); no usan process.env.
 */
export function buildWompiCheckoutUrl(params: {
  publicKey: string
  integritySecret: string
  reference: string
  amountInCents: number
  currency?: string
  redirectUrl: string
  customerData?: {
    email?: string
    fullName?: string
    phoneNumber?: string
    legalId?: string
    legalIdType?: string
  }
}): string {
  const currency = params.currency ?? 'COP'
  const signature = createHash('sha256')
    .update(`${params.reference}${params.amountInCents}${currency}${params.integritySecret}`)
    .digest('hex')

  const url = new URL(WOMPI_CHECKOUT_BASE)
  url.searchParams.set('public-key', params.publicKey)
  url.searchParams.set('currency', currency)
  url.searchParams.set('amount-in-cents', String(params.amountInCents))
  url.searchParams.set('reference', params.reference)
  url.searchParams.set('redirect-url', params.redirectUrl)
  url.searchParams.set('signature:integrity', signature)

  if (params.customerData?.email) {
    url.searchParams.set('customer-data:email', params.customerData.email)
  }
  if (params.customerData?.fullName) {
    url.searchParams.set('customer-data:full-name', params.customerData.fullName)
  }
  if (params.customerData?.phoneNumber) {
    url.searchParams.set('customer-data:phone-number', params.customerData.phoneNumber)
  }
  if (params.customerData?.legalId) {
    url.searchParams.set('customer-data:legal-id', params.customerData.legalId)
  }
  if (params.customerData?.legalIdType) {
    url.searchParams.set('customer-data:legal-id-type', params.customerData.legalIdType)
  }

  return url.toString()
}

/**
 * Verifica la firma del webhook de Wompi.
 * Cabeceras: x-timestamp, x-checksum
 * Firma esperada: SHA256(`{payload}{timestamp}{eventsSecret}`)
 */
export function verifyWompiWebhook(
  payload: string,
  timestamp: string,
  checksum: string,
  eventsSecret: string,
): boolean {
  if (!eventsSecret) {
    console.warn('[wompi] eventsSecret vacío; omitiendo verificación de firma')
    return true
  }
  const expected = createHash('sha256')
    .update(`${payload}${timestamp}${eventsSecret}`)
    .digest('hex')
  return expected === checksum
}

/** Mapea el status de Wompi a nuestros valores internos */
export function mapWompiStatus(wompiStatus: string): 'approved' | 'rejected' | 'pending' {
  const map: Record<string, 'approved' | 'rejected' | 'pending'> = {
    APPROVED: 'approved',
    DECLINED: 'rejected',
    ERROR: 'rejected',
    VOIDED: 'rejected',
    PENDING: 'pending',
  }
  return map[wompiStatus] ?? 'pending'
}
