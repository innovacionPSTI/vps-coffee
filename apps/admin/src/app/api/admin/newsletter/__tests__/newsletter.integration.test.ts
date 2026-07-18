/**
 * Tests de integración — GET /api/admin/newsletter
 *                        POST /api/admin/newsletter/send
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetAdminUser = jest.fn()
jest.mock('@/lib/auth', () => ({ getAdminUser: () => mockGetAdminUser() }))

const mockSelect = jest.fn()
const mockFrom   = jest.fn(() => ({ select: mockSelect }))
jest.mock('@vps/database', () => ({
  createServerClient: () => ({ from: mockFrom }),
}))

// Supress fetch calls for Resend
global.fetch = jest.fn()

// ── Imports ───────────────────────────────────────────────────────────────────

import { GET }  from '../route'
import { POST } from '../send/route'
import { NextRequest } from 'next/server'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAdminUser(role = 'super_admin') {
  return { id: '1', role }
}

function buildRequest(body?: object): NextRequest {
  return new NextRequest('http://localhost/api/admin/newsletter/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ── GET /api/admin/newsletter ─────────────────────────────────────────────────

describe('GET /api/admin/newsletter', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetAdminUser.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 403 for unauthorized role', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('despachador'))
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns subscriber list on success', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('admin'))
    const subscribers = [
      { id: 1, email: 'a@test.com', active: true, subscribed_at: '2025-01-01' },
      { id: 2, email: 'b@test.com', active: false, subscribed_at: '2025-01-02' },
    ]
    mockSelect.mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: subscribers, error: null }),
    })

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.subscribers).toHaveLength(2)
    expect(json.subscribers[0].email).toBe('a@test.com')
  })

  it('returns 500 on DB error', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('admin'))
    mockSelect.mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: null, error: { message: 'db fail' } }),
    })

    const res = await GET()
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('db fail')
  })

  it('allows gestor_tienda role', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('gestor_tienda'))
    mockSelect.mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    })

    const res = await GET()
    expect(res.status).toBe(200)
  })
})

// ── POST /api/admin/newsletter/send ──────────────────────────────────────────

describe('POST /api/admin/newsletter/send', () => {
  const storeConfig = {
    resend_api_key:    're_test',
    resend_from_email: 'from@test.com',
    store_name:        'Test Store',
  }
  const activeSubscribers = [
    { email: 'a@test.com' },
    { email: 'b@test.com' },
  ]

  function mockDb(config = storeConfig, subscribers = activeSubscribers) {
    let call = 0
    mockFrom.mockImplementation(() => {
      call++
      if (call === 1) {
        // store_config query
        return {
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: config, error: null }),
          }),
        }
      }
      // newsletter_subscribers query
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: subscribers, error: null }),
        }),
      }
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true } as Response)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetAdminUser.mockResolvedValue(null)
    const res = await POST(buildRequest({ subject: 'Test', body: 'Hello' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for unauthorized role', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('despachador'))
    const res = await POST(buildRequest({ subject: 'Test', body: 'Hello' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 when subject is missing', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('admin'))
    const res = await POST(buildRequest({ body: 'Hello' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/asunto/i)
  })

  it('returns 400 when body is missing', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('admin'))
    const res = await POST(buildRequest({ subject: 'Test' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/cuerpo/i)
  })

  it('returns 422 when Resend is not configured', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('admin'))
    mockDb({ resend_api_key: null as unknown as string, resend_from_email: null as unknown as string, store_name: 'Test' })
    const res = await POST(buildRequest({ subject: 'Test', body: 'Hello' }))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toMatch(/resend/i)
  })

  it('returns 422 when there are no active subscribers', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('admin'))
    mockDb(storeConfig, [])
    const res = await POST(buildRequest({ subject: 'Test', body: 'Hello' }))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toMatch(/suscriptores/i)
  })

  it('sends broadcast and returns sent count', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('admin'))
    mockDb()
    const res = await POST(buildRequest({ subject: 'Test Subject', body: 'Hello world' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.total).toBe(2)
    expect(json.sent).toBe(2)
    expect(json.failed).toBe(0)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('counts failed when Resend returns error', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('admin'))
    mockDb()
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false } as Response)
    const res = await POST(buildRequest({ subject: 'Test', body: 'Hello' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.failed).toBe(2)
    expect(json.sent).toBe(0)
  })
})
