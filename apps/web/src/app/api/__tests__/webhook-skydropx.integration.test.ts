/**
 * Integration tests — POST /api/webhooks/skydropx
 *
 * Tests:
 *   - EVENT → STATUS mapping (todos los eventos soportados)
 *   - Eventos desconocidos → responde OK sin actualizar la DB
 *   - Actualiza la orden por tracking_number
 *   - Payload malformado → 500
 */

import { NextRequest } from 'next/server'

jest.mock('@vps/database', () => ({
  createServerClient: jest.fn(),
}))

import { createServerClient } from '@vps/database'
import { POST } from '../webhooks/skydropx/route'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/skydropx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function buildSupabaseMock(updateResult = { error: null }) {
  const eqMock = jest.fn().mockResolvedValue(updateResult)
  const updateMock = jest.fn().mockReturnValue({ eq: eqMock })
  const mockSupabase = {
    from: jest.fn().mockReturnValue({ update: updateMock }),
  }
  return { mockSupabase, updateMock, eqMock }
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// Mapping de eventos
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — event mapping', () => {
  const eventMappings = [
    { event: 'shipment.in_transit',       expectedStatus: 'shipped' },
    { event: 'shipment.out_for_delivery', expectedStatus: 'shipped' },
    { event: 'shipment.delivered',        expectedStatus: 'delivered' },
    { event: 'shipment.exception',        expectedStatus: 'exception' },
  ]

  eventMappings.forEach(({ event, expectedStatus }) => {
    it(`evento "${event}" → status "${expectedStatus}"`, async () => {
      const { mockSupabase, updateMock } = buildSupabaseMock()
      mockCreateServerClient.mockReturnValue(mockSupabase as never)

      const req = makeRequest({
        event,
        data: { tracking_number: 'TRK-001-ABC' },
      })
      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: expectedStatus })
      )
    })
  })

  it('evento desconocido → responde OK sin actualizar la BD', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const req = makeRequest({ event: 'shipment.unknown_event', data: { tracking_number: 'TRK-999' } })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(updateMock).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Actualización por tracking_number
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — actualización de orden', () => {
  it('filtra por el tracking_number correcto del payload', async () => {
    const { mockSupabase, eqMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const req = makeRequest({
      event: 'shipment.delivered',
      data: { tracking_number: 'TRK-ABC-12345' },
    })
    await POST(req)

    expect(eqMock).toHaveBeenCalledWith('tracking_number', 'TRK-ABC-12345')
  })

  it('incluye updated_at en la actualización', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const req = makeRequest({
      event: 'shipment.delivered',
      data: { tracking_number: 'TRK-XYZ' },
    })
    await POST(req)

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) })
    )
  })
})

// ─────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — manejo de errores', () => {
  it('retorna 500 si Supabase lanza un error', async () => {
    mockCreateServerClient.mockReturnValue({
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Supabase down')),
        }),
      }),
    } as never)

    const req = makeRequest({ event: 'shipment.delivered', data: { tracking_number: 'TRK-001' } })
    const res = await POST(req)

    expect(res.status).toBe(500)
  })

  it('retorna 500 si el body no es JSON válido', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/skydropx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json {{{',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
