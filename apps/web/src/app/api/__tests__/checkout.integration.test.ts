/**
 * @jest-environment node
 */
/**
 * Integration tests — POST /api/checkout
 *
 * Tests the full route handler in isolation:
 *   - Input validation (400 on missing fields)
 *   - 503 when payment gateway not configured or inactive
 *   - Happy path: delegates to createOrder + buildWompiCheckoutUrl, returns payment_url
 *   - DB failure: returns 500
 *
 * We mock @vps/database, @/lib/wompi and @/lib/mercadopago so no real
 * Supabase or payment-gateway connection is needed.
 */

import { NextRequest } from 'next/server'

// Mock DB layer — must be before imports
jest.mock('@vps/database', () => ({
  createOrder: jest.fn(),
  getPaymentConfig: jest.fn(),
}))

jest.mock('@/lib/wompi', () => ({
  buildWompiCheckoutUrl: jest.fn(),
}))

jest.mock('@/lib/mercadopago', () => ({
  createMercadoPagoPreference: jest.fn(),
  isMercadoPagoSandbox: jest.fn(),
}))

import { createOrder, getPaymentConfig } from '@vps/database'
import { buildWompiCheckoutUrl } from '@/lib/wompi'
import { createMercadoPagoPreference, isMercadoPagoSandbox } from '@/lib/mercadopago'
import { POST } from '../checkout/route'

const mockCreateOrder = createOrder as jest.MockedFunction<typeof createOrder>
const mockGetPaymentConfig = getPaymentConfig as jest.MockedFunction<typeof getPaymentConfig>
const mockBuildWompiUrl = buildWompiCheckoutUrl as jest.MockedFunction<typeof buildWompiCheckoutUrl>
const mockCreateMPPreference = createMercadoPagoPreference as jest.MockedFunction<typeof createMercadoPagoPreference>
const mockIsSandbox = isMercadoPagoSandbox as jest.MockedFunction<typeof isMercadoPagoSandbox>

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  email: 'juan@example.com',
  name: 'Juan Pérez',
  phone: '3001234567',
  address: {
    street: 'Calle 93 #15-10',
    city: 'Bogotá',
    department: 'Cundinamarca',
    postal_code: '110221',
  },
  items: [
    { variantId: 10, productName: 'Café Huila', variantLabel: '500g · Claro', price: 45000, qty: 2, weight: '500g' },
  ],
  subtotal: 90000,
  shipping_cost: 8000,
  total: 98000,
  payment_method: 'wompi',
}

const mockActiveWompiConfig = {
  id: 1,
  wompi_public_key: 'pub_test_abc123',
  wompi_private_key: 'prv_test_abc123',
  wompi_integrity_secret: 'test_integrity_secret',
  wompi_events_secret: 'test_events_secret',
  wompi_active: true,
  mercadopago_access_token: 'TEST-mp-abc123',
  mercadopago_public_key: 'TEST-pub-abc123',
  mercadopago_active: false,
  updated_at: new Date().toISOString(),
}

const WOMPI_PAYMENT_URL = 'https://checkout.wompi.co/p/?public-key=pub_test_abc123&reference=VPS-0042'

beforeEach(() => {
  jest.clearAllMocks()
  // Default happy-path config
  mockGetPaymentConfig.mockResolvedValue(mockActiveWompiConfig as never)
  mockBuildWompiUrl.mockReturnValue(WOMPI_PAYMENT_URL)
})

// ─────────────────────────────────────────────
// Validación de entrada (400)
// ─────────────────────────────────────────────
describe('POST /api/checkout — validación', () => {
  it('retorna 400 si falta email', async () => {
    const req = makeRequest({ ...validBody, email: undefined })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/incompleto/i)
  })

  it('retorna 400 si falta name', async () => {
    const req = makeRequest({ ...validBody, name: undefined })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta address', async () => {
    const req = makeRequest({ ...validBody, address: undefined })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si items es un arreglo vacío', async () => {
    const req = makeRequest({ ...validBody, items: [] })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si items está ausente', async () => {
    const req = makeRequest({ ...validBody, items: undefined })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────
// Pasarela no configurada (503)
// ─────────────────────────────────────────────
describe('POST /api/checkout — pasarela no configurada', () => {
  it('retorna 503 si wompi_active = false', async () => {
    mockGetPaymentConfig.mockResolvedValueOnce({
      ...mockActiveWompiConfig,
      wompi_active: false,
    } as never)

    const req = makeRequest(validBody)
    const res = await POST(req)
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.error).toMatch(/wompi/i)
  })

  it('retorna 503 si wompi_public_key está vacío', async () => {
    mockGetPaymentConfig.mockResolvedValueOnce({
      ...mockActiveWompiConfig,
      wompi_public_key: null,
    } as never)

    const req = makeRequest(validBody)
    const res = await POST(req)
    expect(res.status).toBe(503)
  })

  it('retorna 503 si mercadopago_active = false', async () => {
    mockGetPaymentConfig.mockResolvedValueOnce({
      ...mockActiveWompiConfig,
      mercadopago_active: false,
    } as never)

    const req = makeRequest({ ...validBody, payment_method: 'mercadopago' })
    const res = await POST(req)
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.error).toMatch(/mercadopago/i)
  })

  it('retorna 503 si mercadopago_access_token está vacío', async () => {
    mockGetPaymentConfig.mockResolvedValueOnce({
      ...mockActiveWompiConfig,
      mercadopago_active: true,
      mercadopago_access_token: null,
    } as never)

    const req = makeRequest({ ...validBody, payment_method: 'mercadopago' })
    const res = await POST(req)
    expect(res.status).toBe(503)
  })
})

// ─────────────────────────────────────────────
// Happy path (200)
// ─────────────────────────────────────────────
describe('POST /api/checkout — happy path', () => {
  it('retorna order_number, order_id y payment_url al crear la orden con Wompi', async () => {
    mockCreateOrder.mockResolvedValueOnce({
      id: 42,
      order_number: 'VPS-0042',
      status: 'pending',
    } as never)

    const req = makeRequest(validBody)
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.order_number).toBe('VPS-0042')
    expect(data.order_id).toBe(42)
    expect(data.payment_url).toBe(WOMPI_PAYMENT_URL)
  })

  it('llama a createOrder con los datos correctos del cliente', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 1, order_number: 'VPS-0001' } as never)

    const req = makeRequest(validBody)
    await POST(req)

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_name: 'Juan Pérez',
        customer_email: 'juan@example.com',
        customer_phone: '3001234567',
        payment_method: 'wompi',
      })
    )
  })

  it('llama a buildWompiCheckoutUrl con publicKey e integritySecret correctos', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 1, order_number: 'VPS-0001' } as never)

    const req = makeRequest(validBody)
    await POST(req)

    expect(mockBuildWompiUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        publicKey: 'pub_test_abc123',
        integritySecret: 'test_integrity_secret',
        reference: 'VPS-0001',
      })
    )
  })

  it('usa shipping_cost = 0 si no se proporciona', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 1, order_number: 'VPS-0001' } as never)

    const bodyWithoutShipping = { ...validBody, shipping_cost: undefined }
    const req = makeRequest(bodyWithoutShipping)
    await POST(req)

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ shipping_cost: 0 })
    )
  })

  it('devuelve sandbox_init_point para MercadoPago en modo sandbox', async () => {
    mockGetPaymentConfig.mockResolvedValueOnce({
      ...mockActiveWompiConfig,
      mercadopago_active: true,
    } as never)
    mockCreateOrder.mockResolvedValueOnce({ id: 5, order_number: 'VPS-0005' } as never)
    mockIsSandbox.mockReturnValueOnce(true)
    mockCreateMPPreference.mockResolvedValueOnce({
      id: 'pref-123',
      init_point: 'https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=pref-123',
      sandbox_init_point: 'https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=pref-123',
    })

    const req = makeRequest({ ...validBody, payment_method: 'mercadopago' })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.payment_url).toContain('sandbox.mercadopago')
  })
})

// ─────────────────────────────────────────────
// Error de base de datos (500)
// ─────────────────────────────────────────────
describe('POST /api/checkout — errores internos', () => {
  it('retorna 500 si createOrder lanza un error de DB', async () => {
    mockCreateOrder.mockRejectedValueOnce(new Error('Database connection failed'))

    const req = makeRequest(validBody)
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toMatch(/interno/i)
  })

  it('no expone detalles del error de DB al cliente', async () => {
    mockCreateOrder.mockRejectedValueOnce(new Error('Sensitive internal error with DB credentials'))

    const req = makeRequest(validBody)
    const res = await POST(req)
    const data = await res.json()

    expect(data.error).not.toContain('credentials')
  })
})
