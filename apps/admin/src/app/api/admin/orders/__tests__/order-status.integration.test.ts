/**
 * Integration tests — PATCH /api/admin/orders/[id]/status
 *
 * Tests:
 *   - Happy path: actualiza status y updated_at
 *   - Retorna la orden actualizada
 *   - Supabase error → 500
 *   - Email fire-and-forget: no bloquea la respuesta si Resend falla
 */

import { NextRequest } from 'next/server'

jest.mock('@vps/database', () => ({
  createServerClient: jest.fn(),
}))

// Mock del módulo de email — evita llamadas reales a Resend
jest.mock('@/lib/email', () => ({
  sendShippingNotification: jest.fn().mockResolvedValue(undefined),
  sendStatusNotification:   jest.fn().mockResolvedValue(undefined),
}))

import { createServerClient } from '@vps/database'
import { sendShippingNotification, sendStatusNotification } from '@/lib/email'
import { PATCH } from '../[id]/status/route'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function makeRequest(body: object, id = '42'): NextRequest {
  return new NextRequest(`http://localhost/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const mockOrder = {
  id: 42,
  order_number:   'VPS-0042',
  customer_name:  'Ana García',
  customer_email: 'ana@example.com',
  status:         'shipped',
  tracking_number: 'TRK123',
  carrier_name:    'Servientrega',
  label_url:       null,
  updated_at:     new Date().toISOString(),
}

const mockStoreConfig = {
  resend_api_key:    're_test_key',
  resend_from_email: 'noreply@vpscoffee.com',
  store_name:        'VPS Coffee',
}

/**
 * Construye un mock de Supabase que responde diferente según la tabla:
 * - 'orders' → devuelve orderData
 * - 'store_config' → devuelve configData
 */
function buildSupabaseMock(
  orderResult: { data: unknown; error: unknown },
  configResult: { data: unknown; error: unknown } = { data: mockStoreConfig, error: null },
) {
  const singleOrderMock  = jest.fn().mockResolvedValue(orderResult)
  const selectOrderMock  = jest.fn().mockReturnValue({ single: singleOrderMock })
  const eqOrderMock      = jest.fn().mockReturnValue({ select: selectOrderMock })
  const updateMock       = jest.fn().mockReturnValue({ eq: eqOrderMock })

  const singleConfigMock = jest.fn().mockResolvedValue(configResult)
  const selectConfigMock = jest.fn().mockReturnValue({ single: singleConfigMock })

  return {
    mockSupabase: {
      from: jest.fn((table: string) => {
        if (table === 'orders')       return { update: updateMock }
        if (table === 'store_config') return { select: selectConfigMock }
        return {}
      }),
    },
    updateMock,
    eqOrderMock,
  }
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────
describe('PATCH /api/admin/orders/[id]/status — happy path', () => {
  it('retorna la orden actualizada con el nuevo status', async () => {
    const { mockSupabase } = buildSupabaseMock({ data: mockOrder, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res  = await PATCH(makeRequest({ status: 'shipped' }), { params: Promise.resolve({ id: '42' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('shipped')
    expect(data.order_number).toBe('VPS-0042')
  })

  it('filtra la actualización por el id correcto', async () => {
    const { mockSupabase, eqOrderMock } = buildSupabaseMock({ data: { ...mockOrder, id: 99 }, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await PATCH(makeRequest({ status: 'delivered' }, '99'), { params: Promise.resolve({ id: '99' }) })

    expect(eqOrderMock).toHaveBeenCalledWith('id', 99)
  })

  it('incluye updated_at en la actualización', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock({ data: mockOrder, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await PATCH(makeRequest({ status: 'processing' }), { params: Promise.resolve({ id: '42' }) })

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'processing', updated_at: expect.any(String) }),
    )
  })

  it('responde inmediatamente sin esperar al email (fire-and-forget)', async () => {
    // El email tarda en resolverse pero la respuesta HTTP debe llegar antes
    ;(sendShippingNotification as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500)),
    )
    const { mockSupabase } = buildSupabaseMock({ data: mockOrder, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const start = Date.now()
    const res   = await PATCH(makeRequest({ status: 'shipped' }), { params: Promise.resolve({ id: '42' }) })
    const elapsed = Date.now() - start

    expect(res.status).toBe(200)
    // La respuesta no debe haber esperado los 500ms del email
    expect(elapsed).toBeLessThan(400)
  })
})

// ─────────────────────────────────────────────
// Email triggers
// ─────────────────────────────────────────────
describe('PATCH /api/admin/orders/[id]/status — email triggers', () => {
  it('no dispara email para status "processing"', async () => {
    const { mockSupabase } = buildSupabaseMock({ data: { ...mockOrder, status: 'processing' }, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await PATCH(makeRequest({ status: 'processing' }), { params: Promise.resolve({ id: '42' }) })
    // Dar tiempo al fire-and-forget
    await new Promise((r) => setTimeout(r, 20))

    expect(sendShippingNotification).not.toHaveBeenCalled()
    expect(sendStatusNotification).not.toHaveBeenCalled()
  })

  it('dispara sendShippingNotification para status "shipped"', async () => {
    const { mockSupabase } = buildSupabaseMock({ data: mockOrder, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await PATCH(makeRequest({ status: 'shipped' }), { params: Promise.resolve({ id: '42' }) })
    await new Promise((r) => setTimeout(r, 20))

    expect(sendShippingNotification).toHaveBeenCalledWith(
      expect.objectContaining({ order_number: 'VPS-0042', tracking_number: 'TRK123' }),
      expect.objectContaining({ apiKey: 're_test_key' }),
    )
  })

  it('dispara sendStatusNotification para status "cancelled"', async () => {
    const { mockSupabase } = buildSupabaseMock({ data: { ...mockOrder, status: 'cancelled' }, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await PATCH(makeRequest({ status: 'cancelled' }), { params: Promise.resolve({ id: '42' }) })
    await new Promise((r) => setTimeout(r, 20))

    expect(sendStatusNotification).toHaveBeenCalledWith(
      expect.objectContaining({ order_number: 'VPS-0042' }),
      'cancelled',
      expect.objectContaining({ apiKey: 're_test_key' }),
    )
  })

  it('no envía email si store_config no tiene resend_api_key', async () => {
    const { mockSupabase } = buildSupabaseMock(
      { data: mockOrder, error: null },
      { data: { resend_api_key: null, resend_from_email: null, store_name: null }, error: null },
    )
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await PATCH(makeRequest({ status: 'shipped' }), { params: Promise.resolve({ id: '42' }) })
    await new Promise((r) => setTimeout(r, 20))

    expect(sendShippingNotification).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────
describe('PATCH /api/admin/orders/[id]/status — errores', () => {
  it('retorna 500 si Supabase falla al actualizar', async () => {
    const { mockSupabase } = buildSupabaseMock({
      data: null,
      error: { code: 'PGRST205', message: 'Update failed' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await PATCH(makeRequest({ status: 'shipped' }), { params: Promise.resolve({ id: '42' }) })

    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toMatch(/actualizando/i)
  })

  it('retorna 200 aunque el email falle (fire-and-forget silencioso)', async () => {
    ;(sendShippingNotification as jest.Mock).mockRejectedValue(new Error('Resend down'))
    const { mockSupabase } = buildSupabaseMock({ data: mockOrder, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await PATCH(makeRequest({ status: 'shipped' }), { params: Promise.resolve({ id: '42' }) })

    expect(res.status).toBe(200)
  })
})
