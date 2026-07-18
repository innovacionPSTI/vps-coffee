import type {
  CreatePaymentParams,
  PaymentGateway,
  PaymentStatus,
  WebhookPaymentData,
} from './types'

const MP_API_BASE = 'https://api.mercadopago.com'

export interface MercadoPagoConfig {
  accessToken: string
  publicKey?: string
}

export class MercadoPagoGateway implements PaymentGateway {
  readonly name = 'mercadopago'

  constructor(private readonly config: MercadoPagoConfig) {}

  async createPaymentUrl(params: CreatePaymentParams): Promise<string> {
    // Derive origin URL for back_urls failure redirect
    let failureUrl = `${params.redirectUrl.split('/checkout')[0]}/checkout?error=pago_rechazado`
    try {
      const origin = new URL(params.redirectUrl).origin
      failureUrl = `${origin}/checkout?error=pago_rechazado`
    } catch { /* fallback already set */ }

    const body = {
      external_reference: params.orderNumber,
      items: params.items.map((item) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: params.currency ?? 'COP',
      })),
      payer: { email: params.customerEmail },
      back_urls: {
        success: params.redirectUrl,
        failure: failureUrl,
        pending: `${params.redirectUrl}&status=pending`,
      },
      auto_return: 'approved',
      notification_url: params.webhookUrl,
    }

    const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`MercadoPago API error ${res.status}: ${err}`)
    }

    const preference = (await res.json()) as {
      id: string
      init_point: string
      sandbox_init_point: string
    }

    const isSandbox = this.config.accessToken.startsWith('TEST-')
    return isSandbox ? preference.sandbox_init_point : preference.init_point
  }

  /**
   * MercadoPago does not use a webhook signature in the same way as Wompi.
   * Verification is done by fetching the payment from the API and comparing
   * the external_reference — handled in extractWebhookData + getPayment.
   */
  verifyWebhook(_rawBody: string, _headers: Record<string, string | null>): boolean {
    return true
  }

  mapStatus(rawStatus: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
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
    return map[rawStatus] ?? 'pending'
  }

  extractWebhookData(body: unknown): WebhookPaymentData | null {
    const event = body as Record<string, unknown>
    if (event.type !== 'payment') return null
    const data = event.data as Record<string, unknown> | undefined
    const paymentId = data?.id
    if (!paymentId) return null
    // Full details (orderReference + rawStatus) fetched via getPayment()
    return { orderReference: '', rawStatus: '', paymentId: String(paymentId) }
  }

  /**
   * Fetches full payment details from MercadoPago API.
   * Used by the webhook handler to get orderReference and rawStatus.
   */
  async getPayment(
    paymentId: string,
  ): Promise<{ orderReference: string; rawStatus: string; amount: number }> {
    const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${this.config.accessToken}` },
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`MercadoPago payment fetch error ${res.status}: ${err}`)
    }

    const data = (await res.json()) as {
      status: string
      external_reference: string
      transaction_amount: number
    }

    return {
      orderReference: data.external_reference,
      rawStatus: data.status,
      amount: data.transaction_amount,
    }
  }
}
