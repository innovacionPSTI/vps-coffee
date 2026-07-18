import { createHash } from 'crypto'
import type {
  CreatePaymentParams,
  PaymentGateway,
  PaymentStatus,
  WebhookPaymentData,
} from './types'

const WOMPI_CHECKOUT_BASE = 'https://checkout.wompi.co/p/'

export interface WompiConfig {
  publicKey: string
  integritySecret: string
  /** Required to verify webhook signatures. Leave empty to skip verification (dev only). */
  eventsSecret?: string
}

export class WompiGateway implements PaymentGateway {
  readonly name = 'wompi'

  constructor(private readonly config: WompiConfig) {}

  async createPaymentUrl(params: CreatePaymentParams): Promise<string> {
    const currency = params.currency ?? 'COP'

    const signature = createHash('sha256')
      .update(
        `${params.orderNumber}${params.amountInCents}${currency}${this.config.integritySecret}`,
      )
      .digest('hex')

    const url = new URL(WOMPI_CHECKOUT_BASE)
    url.searchParams.set('public-key', this.config.publicKey)
    url.searchParams.set('currency', currency)
    url.searchParams.set('amount-in-cents', String(params.amountInCents))
    url.searchParams.set('reference', params.orderNumber)
    url.searchParams.set('redirect-url', params.redirectUrl)
    url.searchParams.set('signature:integrity', signature)

    if (params.customerEmail) {
      url.searchParams.set('customer-data:email', params.customerEmail)
    }
    if (params.customerName) {
      url.searchParams.set('customer-data:full-name', params.customerName)
    }
    if (params.customerPhone) {
      url.searchParams.set('customer-data:phone-number', params.customerPhone)
    }

    return url.toString()
  }

  verifyWebhook(rawBody: string, headers: Record<string, string | null>): boolean {
    const eventsSecret = this.config.eventsSecret ?? ''
    if (!eventsSecret) {
      console.warn('[WompiGateway] eventsSecret vacío — omitiendo verificación de firma')
      return true
    }
    const timestamp = headers['x-timestamp'] ?? ''
    const checksum = headers['x-checksum'] ?? ''
    const expected = createHash('sha256')
      .update(`${rawBody}${timestamp}${eventsSecret}`)
      .digest('hex')
    return expected === checksum
  }

  mapStatus(rawStatus: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      APPROVED: 'approved',
      DECLINED: 'rejected',
      ERROR: 'rejected',
      VOIDED: 'rejected',
      PENDING: 'pending',
    }
    return map[rawStatus] ?? 'pending'
  }

  extractWebhookData(body: unknown): WebhookPaymentData | null {
    const event = body as Record<string, unknown>
    if (event.event !== 'transaction.updated') return null
    const data = event.data as Record<string, unknown> | undefined
    const transaction = data?.transaction as Record<string, unknown> | undefined
    if (!transaction) return null
    const orderReference = transaction.reference as string | undefined
    const rawStatus = transaction.status as string | undefined
    const paymentId = transaction.id as string | undefined
    if (!orderReference || !rawStatus) return null
    return { orderReference, rawStatus, paymentId }
  }
}
