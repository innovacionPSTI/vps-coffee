/**
 * Unit tests — lib/wompi.ts
 *
 * Covers:
 *   buildWompiCheckoutUrl  — estructura de URL, firma SHA256
 *   verifyWompiWebhook     — firma válida, inválida, sin secret (bypass)
 *   mapWompiStatus         — todos los estados de Wompi
 */

import { createHash } from 'crypto'
import {
  buildWompiCheckoutUrl,
  verifyWompiWebhook,
  mapWompiStatus,
} from '../wompi'

// ─────────────────────────────────────────────
// buildWompiCheckoutUrl
// ─────────────────────────────────────────────
describe('buildWompiCheckoutUrl', () => {
  const baseParams = {
    publicKey: 'pub_test_abc123',
    integritySecret: 'test_int_secret',
    reference: 'VPS-0042',
    amountInCents: 9800000,
    redirectUrl: 'https://vpscoffee.com/checkout/confirmacion?order=VPS-0042',
  }

  it('genera una URL que empieza en el dominio de Wompi', () => {
    const url = buildWompiCheckoutUrl(baseParams)
    expect(url).toContain('checkout.wompi.co/p/')
  })

  it('incluye public-key, currency, amount-in-cents, reference y redirect-url', () => {
    const url = new URL(buildWompiCheckoutUrl(baseParams))
    expect(url.searchParams.get('public-key')).toBe('pub_test_abc123')
    expect(url.searchParams.get('currency')).toBe('COP')
    expect(url.searchParams.get('amount-in-cents')).toBe('9800000')
    expect(url.searchParams.get('reference')).toBe('VPS-0042')
    expect(url.searchParams.get('redirect-url')).toBe(baseParams.redirectUrl)
  })

  it('calcula correctamente la firma SHA256 de integridad', () => {
    const url = new URL(buildWompiCheckoutUrl(baseParams))
    const expected = createHash('sha256')
      .update(`VPS-00429800000COPtest_int_secret`)
      .digest('hex')
    expect(url.searchParams.get('signature:integrity')).toBe(expected)
  })

  it('usa COP por defecto si no se especifica currency', () => {
    const url = new URL(buildWompiCheckoutUrl(baseParams))
    expect(url.searchParams.get('currency')).toBe('COP')
  })

  it('respeta la currency personalizada y la incluye en la firma', () => {
    const url = new URL(buildWompiCheckoutUrl({ ...baseParams, currency: 'USD' }))
    expect(url.searchParams.get('currency')).toBe('USD')
    const expected = createHash('sha256')
      .update(`VPS-00429800000USDtest_int_secret`)
      .digest('hex')
    expect(url.searchParams.get('signature:integrity')).toBe(expected)
  })

  it('incluye customer-data:email si se proporciona', () => {
    const url = new URL(
      buildWompiCheckoutUrl({
        ...baseParams,
        customerData: { email: 'juan@example.com' },
      })
    )
    expect(url.searchParams.get('customer-data:email')).toBe('juan@example.com')
  })

  it('incluye customer-data:full-name si se proporciona', () => {
    const url = new URL(
      buildWompiCheckoutUrl({
        ...baseParams,
        customerData: { fullName: 'Juan Pérez' },
      })
    )
    expect(url.searchParams.get('customer-data:full-name')).toBe('Juan Pérez')
  })

  it('no incluye campos customer-data si no se pasan', () => {
    const url = new URL(buildWompiCheckoutUrl(baseParams))
    expect(url.searchParams.has('customer-data:email')).toBe(false)
    expect(url.searchParams.has('customer-data:full-name')).toBe(false)
  })
})

// ─────────────────────────────────────────────
// verifyWompiWebhook
// ─────────────────────────────────────────────
describe('verifyWompiWebhook', () => {
  const payload = '{"event":"transaction.updated","data":{"transaction":{"id":"txn-1"}}}'
  const timestamp = '1720000000000'
  const secret = 'test_events_secret'

  function computeChecksum(p: string, ts: string, s: string) {
    return createHash('sha256').update(`${p}${ts}${s}`).digest('hex')
  }

  it('retorna true con firma válida', () => {
    const checksum = computeChecksum(payload, timestamp, secret)
    expect(verifyWompiWebhook(payload, timestamp, checksum, secret)).toBe(true)
  })

  it('retorna false con firma incorrecta', () => {
    expect(verifyWompiWebhook(payload, timestamp, 'firma_incorrecta', secret)).toBe(false)
  })

  it('retorna false si el payload fue alterado', () => {
    const checksum = computeChecksum(payload, timestamp, secret)
    const alteredPayload = payload.replace('txn-1', 'txn-2')
    expect(verifyWompiWebhook(alteredPayload, timestamp, checksum, secret)).toBe(false)
  })

  it('retorna true (bypass) cuando eventsSecret está vacío', () => {
    // Sin secret configurado, se omite la verificación para no bloquear el webhook
    expect(verifyWompiWebhook(payload, timestamp, 'cualquier_cosa', '')).toBe(true)
  })
})

// ─────────────────────────────────────────────
// mapWompiStatus
// ─────────────────────────────────────────────
describe('mapWompiStatus', () => {
  it('mapea APPROVED → approved', () => {
    expect(mapWompiStatus('APPROVED')).toBe('approved')
  })

  it('mapea DECLINED → rejected', () => {
    expect(mapWompiStatus('DECLINED')).toBe('rejected')
  })

  it('mapea ERROR → rejected', () => {
    expect(mapWompiStatus('ERROR')).toBe('rejected')
  })

  it('mapea VOIDED → rejected', () => {
    expect(mapWompiStatus('VOIDED')).toBe('rejected')
  })

  it('mapea PENDING → pending', () => {
    expect(mapWompiStatus('PENDING')).toBe('pending')
  })

  it('usa pending como fallback para estados desconocidos', () => {
    expect(mapWompiStatus('UNKNOWN_STATUS')).toBe('pending')
    expect(mapWompiStatus('')).toBe('pending')
  })
})
