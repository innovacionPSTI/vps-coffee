/**
 * TuCompraGateway — integración con Tu Compra (pasarela colombiana)
 * Documentación: https://docs.tucompra.com.co/
 *
 * Flujo:
 *   1. POST a la URL del botón de pago con firma MD5
 *   2. Tu Compra redirige al cliente al formulario de pago
 *   3. Tu Compra llama al webhook con el resultado
 */

import { createHash } from 'crypto'
import type { PaymentGateway, CreatePaymentParams, PaymentStatus, WebhookPaymentData } from './types'

export interface TuCompraConfig {
  merchantId: string
  secretKey: string
  sandbox?: boolean
}

const PROD_URL    = 'https://checkout.tucompra.com.co/tc/app/inputs/factura.php'
const SANDBOX_URL = 'https://dev.tucompra.com.co/tc/app/inputs/factura.php'

export class TuCompraGateway implements PaymentGateway {
  readonly name = 'tucompra'

  constructor(private readonly cfg: TuCompraConfig) {}

  /**
   * Builds the Tu Compra hosted checkout URL.
   * Tu Compra accepts a POST form but also supports GET with params.
   * We return a URL the client can redirect to.
   */
  async createPaymentUrl(params: CreatePaymentParams): Promise<string> {
    const baseUrl = this.cfg.sandbox ? SANDBOX_URL : PROD_URL

    const amount  = (params.amountInCents / 100).toFixed(2)
    const orderId = params.orderNumber

    // Signature: MD5(merchantId + orderId + amount + currency + secretKey)
    const rawSig = `${this.cfg.merchantId}${orderId}${amount}${params.currency}${this.cfg.secretKey}`
    const firma  = createHash('md5').update(rawSig).digest('hex')

    const query = new URLSearchParams({
      empresa:        this.cfg.merchantId,
      factura:        orderId,
      monto:          amount,
      moneda:         params.currency,
      descripcion:    `Pedido ${orderId}`,
      nombre_cliente: params.customerName,
      correo_cliente: params.customerEmail,
      celular:        params.customerPhone ?? '',
      url_respuesta:  params.redirectUrl,
      url_confirmacion: params.webhookUrl,
      firma,
    })

    return `${baseUrl}?${query.toString()}`
  }

  /**
   * Tu Compra sends webhooks via POST form.
   * Basic verification using MD5 signature in the payload.
   */
  verifyWebhook(rawBody: string, _headers: Record<string, string | null>): boolean {
    try {
      const params = new URLSearchParams(rawBody)
      const firma     = params.get('firma') ?? ''
      const factura   = params.get('factura') ?? ''
      const monto     = params.get('monto') ?? ''
      const moneda    = params.get('moneda') ?? 'COP'
      const resultado = params.get('resultado') ?? ''

      const expected = createHash('md5')
        .update(`${this.cfg.merchantId}${factura}${monto}${moneda}${resultado}${this.cfg.secretKey}`)
        .digest('hex')

      return expected === firma
    } catch {
      return false
    }
  }

  mapStatus(rawStatus: string): PaymentStatus {
    // Tu Compra: 1=approved, 2=rejected, 3=pending, 4=cancelled
    switch (rawStatus) {
      case '1': return 'approved'
      case '3': return 'pending'
      default:  return 'rejected'
    }
  }

  extractWebhookData(body: unknown): WebhookPaymentData | null {
    try {
      const params = body instanceof URLSearchParams
        ? body
        : new URLSearchParams(String(body))

      const orderReference = params.get('factura')
      const rawStatus      = params.get('resultado')
      const paymentId      = params.get('ref_payco') ?? params.get('transaccion') ?? undefined

      if (!orderReference || rawStatus === null) return null
      return { orderReference, rawStatus, paymentId: paymentId ?? undefined }
    } catch {
      return null
    }
  }
}
