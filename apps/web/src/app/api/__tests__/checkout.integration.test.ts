/**
 * Integration tests — POST /api/checkout
 *
 * Tests the full route handler in isolation:
 *   - Input validation (400 on missing fields)
 *   - Happy path: delegates to createOrder, returns order_number + order_id
 *   - DB failure: returns 500
 *
 * We mock @vps/database so no real Supabase connection is needed.
 */

import { NextRequest } from 'next/server'

// Mock DB layer
jest.mock('@vps/database', () => ({
  createOrder: jest.fn(),
}))

import { createOrder } from '@vps/database'
import { POST } from '../checkout/route'

const mockCreateOrder = createOrder as jest.MockedFunction<typeof createOrder>

// ─────────────────────────────────────────────
// Helpers
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

beforeEach(() => {
  jest.clearAllMocks()
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
// Happy path (200)
// ─────────────────────────────────────────────
describe('POST /api/checkout — happy path', () => {
  it('retorna order_number y order_id al crear la orden correctamente', async () => {
    mockCreateOrder.mockResolvedValueOnce({
      id: 42,
      order_number: 'VPS-0042',
      status: 'pending',
    } as never)

    const req = makeRequest(validBody)
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual({ order_number: 'VPS-0042', order_id: 42 })
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

  it('usa shipping_cost = 0 si no se proporciona', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 1, order_number: 'VPS-0001' } as never)

    const bodyWithoutShipping = { ...validBody, shipping_cost: undefined }
    const req = makeRequest(bodyWithoutShipping)
    await POST(req)

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ shipping_cost: 0 })
    )
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
