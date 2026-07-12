/**
 * @jest-environment node
 */
/**
 * Integration tests — POST /api/webhooks/skydropx
 *
 * Payload format (PRO API):
 *   { event, data: { attributes: { tracking_number, workflow_status, ... } } }
 *
 * EVENT_STATUS_MAP in the route:
 *   shipment.delivered, shipment.exception, package.in_transit, etc.
 * WORKFLOW_STATUS_MAP:
 *   in_transit, out_for_delivery, delivered, exception, etc.
 */

import { NextRequest } from 'next/server'

jest.mock('@vps/database', () => ({
  createServerClient: jest.fn(),
  getStoreConfig: jest.fn().mockResolvedValue(null), // no email config → skip email
}))

import { createServerClient } from '@vps/database'
import { POST } from '../webhooks/skydropx/route'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/skydropx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * The route chain: .from().update().eq().select().single()
 */
function buildSupabaseMock(rowData: object | null = null) {
  const singleMock = jest.fn().mockResolvedValue({ data: rowData, error: null })
  const selectMock = jest.fn().mockReturnValue({ single: singleMock })
  const eqMock     = jest.fn().mockReturnValue({ select: selectMock })
  const updateMock = jest.fn().mockReturnValue({ eq: eqMock })
  const mockSupabase = {
    from: jest.fn().mockReturnValue({ update: updateMock }),
  }
  return { mockSupabase, updateMock, eqMock, selectMock, singleMock }
}

/** Build a PRO API webhook payload using event name */
function eventPayload(event: string, tracking: string, workflowStatus?: string) {
  return {
    event,
    data: {
      attributes: {
        tracking_number: tracking,
        ...(workflowStatus ? { workflow_status: workflowStatus } : {}),
      },
    },
  }
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// Event mapping via EVENT_STATUS_MAP
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — event mapping', () => {
  const eventMappings = [
    { event: 'shipment.delivered',      expectedStatus: 'delivered' },
    { event: 'shipment.exception',      expectedStatus: 'exception' },
    { event: 'package.in_transit',      expectedStatus: 'shipped'   },
    { event: 'package.out_for_delivery',expectedStatus: 'shipped'   },
    { event: 'package.delivered',       expectedStatus: 'delivered' },
    { event: 'package.returned',        expectedStatus: 'exception' },
  ]

  eventMappings.forEach(({ event, expectedStatus }) => {
    it(`evento "${event}" → status "${expectedStatus}"`, async () => {
      const { mockSupabase, updateMock } = buildSupabaseMock()
      mockCreateServerClient.mockReturnValue(mockSupabase as never)

      const res = await POST(makeRequest(eventPayload(event, 'TRK-001-ABC')))
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: expectedStatus })
      )
    })
  })
})

// ─────────────────────────────────────────────
// Workflow status mapping (takes precedence)
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — workflow_status mapping', () => {
  const workflowMappings = [
    { workflow_status: 'in_transit',       expectedStatus: 'shipped'   },
    { workflow_status: 'out_for_delivery', expectedStatus: 'shipped'   },
    { workflow_status: 'delivered',        expectedStatus: 'delivered' },
    { workflow_status: 'exception',        expectedStatus: 'exception' },
  ]

  workflowMappings.forEach(({ workflow_status, expectedStatus }) => {
    it(`workflow_status "${workflow_status}" → "${expectedStatus}"`, async () => {
      const { mockSupabase, updateMock } = buildSupabaseMock()
      mockCreateServerClient.mockReturnValue(mockSupabase as never)

      const res = await POST(makeRequest(
        eventPayload('shipment.status.updated', 'TRK-WF-001', workflow_status)
      ))

      expect(res.status).toBe(200)
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: expectedStatus })
      )
    })
  })
})

// ─────────────────────────────────────────────
// Eventos desconocidos → ignorar
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — eventos ignorados', () => {
  it('evento desconocido → 200 sin actualizar la BD', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await POST(makeRequest(
      eventPayload('shipment.unknown_event', 'TRK-999')
    ))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('sin tracking_number → 200 sin actualizar la BD', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await POST(makeRequest({ event: 'shipment.delivered', data: { attributes: {} } }))
    expect(res.status).toBe(200)
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

    await POST(makeRequest(eventPayload('shipment.delivered', 'TRK-ABC-12345')))

    expect(eqMock).toHaveBeenCalledWith('tracking_number', 'TRK-ABC-12345')
  })

  it('incluye updated_at en la actualización', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await POST(makeRequest(eventPayload('shipment.delivered', 'TRK-XYZ')))

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) })
    )
  })
})

// ─────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — manejo de errores', () => {
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
