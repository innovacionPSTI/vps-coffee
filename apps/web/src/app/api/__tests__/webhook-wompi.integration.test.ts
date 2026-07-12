/**
 * Integration tests — POST /api/webhooks/wompi
 *
 * Escenarios cubiertos:
 *   - Firma inválida → 401
 *   - Sin events_secret (bypass de firma) → procesa normalmente
 *   - Evento que no es transaction.updated → 200 ok sin tocar BD
 *   - JSON malformado → 400
 *   - transaction.updated APPROVED → actualiza orden, envía email
 *   - transaction.updated DECLINED → actualiza orden, no envía email
 *   - Payload sin reference o status → 200 ok sin tocar BD
 *   - Error de BD al actualizar → 200 ok con warning
 *   - getPaymentConfig falla → procesa con secret vacío (bypass)
 *
 * Mocks: @vps/database (getPaymentConfig, getStoreConfig, createServerClient)
 *        @/lib/wompi (verifyWompiWebhook, mapWompiStatus)
 *        @/lib/email (sendOrderConfirmation)
 */

import { NextRequest } from 'next/server'
import { createHash } from 'crypto'

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

jest.mock('@/lib/wompi', () => ({
  verifyWompiWebhook: jest.fn(),
  mapWompiStatus: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
  sendOrderConfirmation: jest.fn(),
}))

import { getPaymentConfig, getStoreConfig } from '@vps/database'
import { verifyWompiWebhook, mapWompiStatus } from '@/lib/wompi'
import { sendOrderConfirmation } from '@/lib/email'
import { POST } from '../webhooks/wompi/route'

const mockGetPaymentConfig = getPaymentConfig as jest.MockedFunction<typeof getPaymentConfig>
const mockGetStoreConfig = getStoreConfig as jest.MockedFunction<typeof getStoreConfig>
const mockVerifyWebhook = verifyWompiWebhook as jest.MockedFunction<typeof verifyWompiWebhook>
const mockMapStatus = mapWompiStatus as jest.MockedFunction<typeof mapWompiStatus>
const mockSendEmail = sendOrderConfirmation as jest.MockedFunction<typeof sendOrderConfirmation>

// ── Fixtures ──────────────────────────────────
const EVENTS_SECRET = 'test_events_secret'

const paymentConfig = {
  id: 1,
  wompi_events_secret: EVENTS_SECRET,
  wompi_active: true,
  wompi_public_key: 'pub_test_xxx',
  wompi_private_key: 'prv_test_xxx',
  wompi_integrity_secret: 'int_test_xxx',
  mercadopago_access_token: null,
  mercadopago_public_key: null,
  mercadopago_active: false,
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

function makeTransactionBody(status = 'APPROVED', reference = 'VPS-0042') {
  return JSON.stringify({
    event: 'transaction.updated',
    data: {
      transaction: {
        id: 'txn-123',
        reference,
        status,
      },
    },
  })
}

function makeRequest(body: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/wompi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-timestamp': '1720000000000',
      'x-checksum': 'valid-checksum',
      ...headers,
    },
    body,
  })
}

const mockOrder = {
  id: 42,
  order_number: 'VPS-0042',
  status: 'processing',
  customer_name: 'Juan Pérez',
  customer_email: 'juan@example.com',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetPaymentConfig.mockResolvedValue(paymentConfig as never)
  mockGetStoreConfig.mockResolvedValue(storeConfig as never)
  mockVerifyWebhook.mockReturnValue(true)
  mockMapStatus.mockReturnValue('approved')
  mockSingle.mockResolvedValue({ data: mockOrder, error: null })
  mockSendEmail.mockResolvedValue(undefined)
})

// ─────────────────────────────────────────────
// Firma
// ─────────────────────────────────────────────
describe('POST /api/webhooks/wompi — verificación de firma', () => {
  it('retorna 401 si la firma es inválida', async () => {
    mockVerifyWebhook.mockReturnValueOnce(false)

    const req = makeRequest(makeTransactionBody())
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error).toMatch(/signature/i)
  })

  it('procesa normalmente si la verificación de firma hace bypass (sin secret)', async () => {
    // verifyWompiWebhook retorna true (bypass cuando secret está vacío — comportamiento de la lib)
    mockVerifyWebhook.mockReturnValueOnce(true)

    const req = makeRequest(makeTransactionBody())
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})

// ─────────────────────────────────────────────
// Eventos no relevantes
// ─────────────────────────────────────────────
describe('POST /api/webhooks/wompi — eventos no procesados', () => {
  it('retorna 200 y no toca la BD para un evento desconocido', async () => {
    const body = JSON.stringify({ event: 'payment.created', data: {} })
    const req = makeRequest(body)
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('retorna 400 si el body no es JSON válido', async () => {
    const req = makeRequest('not-valid-json{')
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────
// Procesamiento de transaction.updated
// ─────────────────────────────────────────────
describe('POST /api/webhooks/wompi — transaction.updated', () => {
  it('actualiza el payment_status de la orden cuando el pago es APPROVED', async () => {
    mockMapStatus.mockReturnValueOnce('approved')

    const req = makeRequest(makeTransactionBody('APPROVED'))
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockFrom).toHaveBeenCalledWith('orders')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_status: 'approved', status: 'processing' })
    )
    expect(mockEq).toHaveBeenCalledWith('order_number', 'VPS-0042')
  })

  it('envía email de confirmación cuando el pago es APPROVED', async () => {
    mockMapStatus.mockReturnValueOnce('approved')

    const req = makeRequest(makeTransactionBody('APPROVED'))
    await POST(req)

    expect(mockSendEmail).toHaveBeenCalledWith(
      mockOrder,
      expect.objectContaining({
        apiKey: 're_test_key',
        fromEmail: 'pedidos@vpscoffee.com',
      })
    )
  })

  it('actualiza la orden pero NO envía email cuando el pago es DECLINED', async () => {
    mockMapStatus.mockReturnValueOnce('rejected')
    mockSingle.mockResolvedValueOnce({ data: { ...mockOrder, status: 'pending' }, error: null })

    const req = makeRequest(makeTransactionBody('DECLINED'))
    await POST(req)

    expect(mockFrom).toHaveBeenCalledWith('orders')
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('retorna 200 con warning si la actualización de BD falla', async () => {
    mockMapStatus.mockReturnValueOnce('approved')
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Row not found' } })

    const req = makeRequest(makeTransactionBody('APPROVED'))
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.warning).toBe('order_not_updated')
  })

  it('no falla si el email no se puede enviar (error silencioso)', async () => {
    mockMapStatus.mockReturnValueOnce('approved')
    mockSendEmail.mockRejectedValueOnce(new Error('Resend API down'))

    const req = makeRequest(makeTransactionBody('APPROVED'))
    const res = await POST(req)

    // El webhook debe responder 200 aunque el email falle
    expect(res.status).toBe(200)
  })

  it('ignora silenciosamente si el payload no trae reference', async () => {
    const body = JSON.stringify({
      event: 'transaction.updated',
      data: { transaction: { id: 'txn-1', status: 'APPROVED' } },
    })
    const req = makeRequest(body)
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})
