/**
 * PaymentGateway abstraction.
 *
 * Any payment gateway (Wompi, MercadoPago, TuCompra, …) must implement this
 * interface. The checkout route and admin panel only depend on these types,
 * never on a specific gateway implementation.
 *
 * Adding a new gateway:
 *   1. Create src/providers/payment/<Name>Gateway.ts implementing PaymentGateway.
 *   2. Add a case to getPaymentGateway() in index.ts.
 *   3. Add the gateway's credentials to payment_config (migration + types.ts).
 *   4. Add a toggle + form section in the admin PaymentConfigForm.
 */

// ─── Input / Output types ─────────────────────────────────────────────────────

export interface CreatePaymentParams {
  orderNumber: string
  /** Total amount already in the currency's base unit (e.g. COP — no cents) */
  amountInCents: number
  currency: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  items: Array<{
    id: string
    title: string
    quantity: number
    /** Unit price in the same unit as amountInCents */
    unit_price: number
  }>
  /** URL to redirect after payment completes */
  redirectUrl: string
  /** URL where the gateway sends webhook notifications */
  webhookUrl: string
}

export type PaymentStatus = 'approved' | 'rejected' | 'pending'

export interface WebhookPaymentData {
  /** Our internal order reference (order_number) */
  orderReference: string
  /** Raw status string from the gateway */
  rawStatus: string
  /** Gateway-specific payment ID */
  paymentId?: string
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface PaymentGateway {
  /** Slug used for logging / analytics (e.g. 'wompi', 'mercadopago') */
  readonly name: string

  /**
   * Creates a payment session and returns the URL the customer should be
   * redirected to in order to complete the payment.
   */
  createPaymentUrl(params: CreatePaymentParams): Promise<string>

  /**
   * Verifies a webhook request came from the gateway.
   * Returns true if valid; false if the signature is wrong.
   * Some gateways don't support signature verification — return true in that case.
   */
  verifyWebhook(rawBody: string, headers: Record<string, string | null>): boolean

  /** Maps the gateway-specific status string to our internal enum */
  mapStatus(rawStatus: string): PaymentStatus

  /**
   * Extracts the minimal data needed to update an order from a raw webhook body.
   * Returns null if the event should be ignored.
   */
  extractWebhookData(body: unknown): WebhookPaymentData | null
}
