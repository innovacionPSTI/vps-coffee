/**
 * @jest-environment node
 */
/**
 * Integration tests — POST /api/webhooks/mercadopago
 *
 * Escenarios cubiertos:
 *   - Tipo de notificación != 'payment' → 200 ok sin tocar BD
 *   - Sin paymentId en data → 200 ok
 *   - Sin access_token en BD → 503
 *   - getMercadoPagoPayment falla → 500
 *   - Pago aprobado → actualiza orden + envía email
 *   - Pago rechazado → actualiza orden, no envía email
 *   - Pago sin external_reference → 200 ok sin tocar BD
 *   - Error de BD al actualizar → 200 ok con warning
 *
 * Mocks: @vps/database, @/lib/mercadopago, @/lib/email
 */

import { NextRequest } from 'next/server'

// ── Mock helpers ──────────────────────────────
const mockSingle = jest.fn()
const mockSelect = jest.fn(() => ({ single: mockSingle }))
const mockEq = jest.fn(() => ({ select: mockSelect }))
const mockUpdate = jest.fn(() => ({ eq: mockEq }))
const mockFrom = jest.fn(() => ({ update: mockUpdate }))

jest.mock('@vps/database', () => ({
  createServerClient: jest.fn(() => ({ from: mockFrom })),
  getPaymentConfig: jest.fn(),
  getStoreConfig: jest.fn(),
}))

jest.mock('@/lib/mercadopago', () => ({
  getMercadoPagoPayment: jest.fn(),
  mapMercadoPagoStatus: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
  sendOrderConfirmation: jest.fn(),
}))

import { getPaymentConfig, getStoreConfig } from '@vps/database'
import { getMercadoPagoPayment, mapMercadoPagoStatus } from '@/lib/mercadopago'
import { sendOrderConfirmation } from '@/lib/email'
import { POST } from '../webhooks/mercadopago/route'

const mockGetPaymentConfig = getPaymentConfig as jest.MockedFunction<typeof getPaymentConfig>
const mockGetStoreConfig = getStoreConfig as jest.MockedFunction<typeof getStoreConfig>
const mockGetMPPayment = getMercadoPagoPayment as jest.MockedFunction<typeof getMercadoPagoPayment>
const mockMapMPStatus = mapMercadoPagoStatus as jest.MockedFunction<typeof mapMercadoPagoStatus>
const mockSendEmail = sendOrderConfirmation as jest.MockedFunction<typeof sendOrderConfirmation>

// ── Fixtures ──────────────────────────────────
const paymentConfig = {
  id: 1,
  mercadopago_access_token: 'TEST-mp-token-abc123',
  mercadopago_active: true,
  mercadopago_public_key: 'TEST-pub-key',
  wompi_public_key: null,
  wompi_private_key: null,
  wompi_integrity_secret: null,
  wompi_events_secret: null,
  wompi_active: false,
  updated_at: new Date().toISOString(),
}

const storeConfig = {
  id: 1,
  resend_api_key: 're_test_key',
  resend_from_email: 'pedidos@vpscoffee.com',
  whatsapp_number: null,
  store_name: 'VPS Coffee',
  store_email: null,
  logo_url: null,
  updated_at: new Date().toISOString(),
}

const mockMPPayment = {
  id: 12345678,
  status: 'approved',
  external_reference: 'VPS-0042',
  transaction_amount: 98000,
}

const mockOrder = {
  id: 42,
  order_number: 'VPS-0042',
  status: 'processing',
  customer_name: 'Juan Pérez',
  customer_email: 'juan@example.com',
}

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/mercadopago', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetPaymentConfig.mockResolvedValue(paymentConfig as never)
  mockGetStoreConfig.mockResolvedValue(storeConfig as never)
  mockGetMPPayment.mockResolvedValue(mockMPPayment)
  mockMapMPStatus.mockReturnValue('approved')
  mockSingle.mockResolvedValue({ data: mockOrder, error: null })
  mockSendEmail.mockResolvedValue(undefined)
})

// ─────────────────────────────────────────────
// Tipos de notificación
// ─────────────────────────────────────────────
describe('POST /api/webhooks/mercadopago — tipos de notificación', () => {
  it('retorna 200 y no toca la BD para notificaciones que no son de tipo payment', async () => {
    const req = makeRequest({ type: 'merchant_order', data: { id: '123' } })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(mockGetMPPayment).not.toHaveBeenCalled()
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('retorna 200 si no hay paymentId en data', async () => {
    const req = makeRequest({ type: 'payment', data: {} })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockGetMPPayment).not.toHaveBeenCalled()
  })

  it('retorna 400 si el body no es JSON válido', async () => {
    const badReq = new NextRequest('http://localhost/api/webhooks/mercadopago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{',
    })
    const res = await POST(badReq)
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────
// Configuración de pasarela
// ─────────────────────────────────────────────
describe('POST /api/webhooks/mercadopago — configuración', () => {
  it('retorna 503 si mercadopago_access_token no está configurado en BD', async () => {
    mockGetPaymentConfig.mockResolvedValueOnce({
      ...paymentConfig,
      mercadopago_access_token: null,
    } as never)

    const req = makeRequest({ type: 'payment', data: { id: '12345' } })
    const res = await POST(req)
    expect(res.status).toBe(503)
  })

  it('retorna 500 si getMercadoPagoPayment falla', async () => {
    mockGetMPPayment.mockRejectedValueOnce(new Error('MP API 503'))

    const req = makeRequest({ type: 'payment', data: { id: '12345' } })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})

// ─────────────────────────────────────────────
// Procesamiento de pagos
// ─────────────────────────────────────────────
describe('POST /api/webhooks/mercadopago — procesamiento', () => {
  it('actualiza la orden y envía email cuando el pago es approved', async () => {
    mockMapMPStatus.mockReturnValueOnce('approved')

    const req = makeRequest({ type: 'payment', data: { id: '12345678' } })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockGetMPPayment).toHaveBeenCalledWith('TEST-mp-token-abc123', '12345678')
    expect(mockFrom).toHaveBeenCalledWith('orders')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: 'approved', status: 'processing' })
    )
    expect(mockSendEmail).toHaveBeenCalled()
  })

  it('actualiza la orden pero NO envía email cuando el pago es rejected', async () => {
    mockMapMPStatus.mockReturnValueOnce('rejected')
    mockSingle.mockResolvedValueOnce({ data: { ...mockOrder, status: 'pending' }, error: null })

    const req = makeRequest({ type: 'payment', data: { id: '12345678' } })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('ignora pagos sin external_reference', async () => {
    mockGetMPPayment.mockResolvedValueOnce({
      ...mockMPPayment,
      external_reference: '',
    })

    const req = makeRequest({ type: 'payment', data: { id: '12345678' } })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('retorna 200 con warning si la actualización de BD falla', async () => {
    mockMapMPStatus.mockReturnValueOnce('approved')
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Row not found' } })

    const req = makeRequest({ type: 'payment', data: { id: '12345678' } })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.warning).toBe('order_not_updated')
  })

  it('no falla si el email no se puede enviar (error silencioso)', async () => {
    mockMapMPStatus.mockReturnValueOnce('approved')
    mockSendEmail.mockRejectedValueOnce(new Error('Resend down'))

    const req = makeRequest({ type: 'payment', data: { id: '12345678' } })
    const res = await POST(req)

    expect(res.status).toBe(200)
  })
})
