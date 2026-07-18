/**
 * Payment Gateway Factory
 *
 * ┌───────────────────────────────────────────────────────────────────┐
 * │  method        │  Gateway               │  Active field           │
 * ├───────────────────────────────────────────────────────────────────┤
 * │  'wompi'       │  WompiGateway          │  wompi_active           │
 * │  'mercadopago' │  MercadoPagoGateway    │  mercadopago_active     │
 * │  'tucompra'    │  TuCompraGateway       │  tucompra_active        │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * Adding a new gateway:
 *   1. Create src/providers/payment/<Name>Gateway.ts implementing PaymentGateway.
 *   2. Add credentials to payment_config (migration + types.ts).
 *   3. Add a case below.
 *   4. Add toggle + form in admin PaymentConfigForm.
 */

import type { PaymentConfig } from '../../types'
import { WompiGateway } from './WompiGateway'
import { MercadoPagoGateway } from './MercadoPagoGateway'
import { TuCompraGateway } from './TuCompraGateway'
import type { PaymentGateway } from './types'

export type { PaymentGateway, CreatePaymentParams, PaymentStatus, WebhookPaymentData } from './types'
export { WompiGateway } from './WompiGateway'
export type { WompiConfig } from './WompiGateway'
export { MercadoPagoGateway } from './MercadoPagoGateway'
export type { MercadoPagoConfig } from './MercadoPagoGateway'
export { TuCompraGateway } from './TuCompraGateway'
export type { TuCompraConfig } from './TuCompraGateway'

/**
 * Returns the PaymentGateway implementation for the given method.
 * Validates that the gateway is active and credentials are present.
 * Throws with a user-friendly error message on failure.
 */
export function getPaymentGateway(
  method: string,
  config: PaymentConfig,
): PaymentGateway {
  switch (method) {
    case 'wompi': {
      if (!config.wompi_active) {
        throw new Error('Wompi no está activo. Actívalo en Configuración → Pagos.')
      }
      if (!config.wompi_public_key || !config.wompi_integrity_secret) {
        throw new Error('Wompi: faltan credenciales (public_key o integrity_secret).')
      }
      return new WompiGateway({
        publicKey: config.wompi_public_key,
        integritySecret: config.wompi_integrity_secret,
        eventsSecret: config.wompi_events_secret ?? undefined,
      })
    }

    case 'mercadopago': {
      if (!config.mercadopago_active) {
        throw new Error('MercadoPago no está activo. Actívalo en Configuración → Pagos.')
      }
      if (!config.mercadopago_access_token) {
        throw new Error('MercadoPago: falta el access token.')
      }
      return new MercadoPagoGateway({
        accessToken: config.mercadopago_access_token,
        publicKey: config.mercadopago_public_key ?? undefined,
      })
    }

    case 'tucompra': {
      if (!config.tucompra_active) {
        throw new Error('Tu Compra no está activo. Actívalo en Configuración → Pagos.')
      }
      if (!config.tucompra_merchant_id || !config.tucompra_secret_key) {
        throw new Error('Tu Compra: faltan credenciales (merchant_id o secret_key).')
      }
      return new TuCompraGateway({
        merchantId: config.tucompra_merchant_id,
        secretKey:  config.tucompra_secret_key,
        sandbox:    config.tucompra_sandbox ?? true,
      })
    }

    default:
      throw new Error(`Pasarela de pago desconocida: "${method}"`)
  }
}

/**
 * Returns the list of gateway names that are currently active and configured.
 * Used by the checkout UI to show only available payment options.
 */
export function getActiveGateways(config: PaymentConfig): string[] {
  const active: string[] = []
  if (config.wompi_active && config.wompi_public_key && config.wompi_integrity_secret) {
    active.push('wompi')
  }
  if (config.mercadopago_active && config.mercadopago_access_token) {
    active.push('mercadopago')
  }
  if (config.tucompra_active && config.tucompra_merchant_id && config.tucompra_secret_key) {
    active.push('tucompra')
  }
  return active
}
