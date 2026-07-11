/**
 * Integration tests — PATCH /api/admin/orders/[id]/status
 *
 * Tests:
 *   - Happy path: actualiza status y updated_at
 *   - Retorna la orden actualizada
 *   - Body sin status → error interno
 *   - Supabase error → 500
 */

import { NextRequest } from 'next/server'

jest.mock('@vps/database', () => ({
  createServerClient: jest.fn(),
}))

import { createServerClient } from '@vps/database'
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

function buildSupabaseMock(resolvedValue: { data: unknown; error: unknown }) {
  const singleMock = jest.fn().mockResolvedValue(resolvedValue)
  const selectMock = jest.fn().mockReturnValue({ single: singleMock })
  const eqMock = jest.fn().mockReturnValue({ select: selectMock })
  const updateMock = jest.fn().mockReturnValue({ eq: eqMock })
  return {
    mockSupabase: { from: jest.fn().mockReturnValue({ update: updateMock }) },
    updateMock,
    eqMock,
  }
}

const mockUpdatedOrder = {
  id: 42,
  order_number: 'VPS-0042',
  status: 'shipped',
  updated_at: new Date().toISOString(),
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────
describe('PATCH /api/admin/orders/[id]/status — happy path', () => {
  it('retorna la orden actualizada con el nuevo status', async () => {
    const { mockSupabase } = buildSupabaseMock({ data: mockUpdatedOrder, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const req = makeRequest({ status: 'shipped' })
    const res = await PATCH(req, { params: { id: '42' } })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('shipped')
    expect(data.order_number).toBe('VPS-0042')
  })

  it('filtra la actualización por el id correcto', async () => {
    const { mockSupabase, eqMock } = buildSupabaseMock({ data: mockUpdatedOrder, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const req = makeRequest({ status: 'delivered' }, '99')
    await PATCH(req, { params: { id: '99' } })

    expect(eqMock).toHaveBeenCalledWith('id', '99')
  })

  it('incluye updated_at en la actualización', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock({ data: mockUpdatedOrder, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const req = makeRequest({ status: 'processing' })
    await PATCH(req, { params: { id: '42' } })

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'processing',
        updated_at: expect.any(String),
      })
    )
  })

  it('soporta todos los estados válidos del flujo de pedido', async () => {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

    for (const status of validStatuses) {
      const { mockSupabase } = buildSupabaseMock({ data: { ...mockUpdatedOrder, status }, error: null })
      mockCreateServerClient.mockReturnValue(mockSupabase as never)

      const req = makeRequest({ status })
      const res = await PATCH(req, { params: { id: '42' } })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe(status)
    }
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

    const req = makeRequest({ status: 'shipped' })
    const res = await PATCH(req, { params: { id: '42' } })

    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toMatch(/actualizando/i)
  })

  it('retorna 500 si el id no existe en la BD (PGRST116)', async () => {
    const { mockSupabase } = buildSupabaseMock({
      data: null,
      error: { code: 'PGRST116', message: 'Row not found' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const req = makeRequest({ status: 'delivered' }, '9999')
    const res = await PATCH(req, { params: { id: '9999' } })

    expect(res.status).toBe(500)
  })
})
