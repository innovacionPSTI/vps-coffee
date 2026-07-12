/**
 * @jest-environment node
 */
/**
 * Unit tests for GET /api/draft/enable and DELETE /api/draft/enable
 *
 * Verifies secret validation, cookie setting, redirect behavior, and
 * cookie deletion.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockCookieSet    = jest.fn()
const mockCookieDelete = jest.fn()

jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      set:    mockCookieSet,
      delete: mockCookieDelete,
    })
  ),
}))

import { NextRequest } from 'next/server'
import { GET, DELETE } from '../draft/enable/route'

const VALID_SECRET = 'vps-draft-preview' // matches DRAFT_SECRET env default

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/draft/enable')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/draft/enable — validación', () => {
  it('retorna 401 si el secret es incorrecto', async () => {
    const res = await GET(makeRequest({ secret: 'wrong', slug: 'mi-articulo' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/secret/i)
  })

  it('retorna 400 si falta el slug', async () => {
    const res = await GET(makeRequest({ secret: VALID_SECRET }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/slug/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/draft/enable — cookie y redirección', () => {
  it('setea la cookie __vps_draft=1 con httpOnly y maxAge=3600', async () => {
    await GET(makeRequest({ secret: VALID_SECRET, slug: 'mi-articulo' }))
    expect(mockCookieSet).toHaveBeenCalledWith('__vps_draft', '1', expect.objectContaining({
      httpOnly: true,
      maxAge:   3600,
    }))
  })

  it('redirige a /blog/<slug>?draft=1', async () => {
    const res = await GET(makeRequest({ secret: VALID_SECRET, slug: 'mi-articulo' }))
    expect(res.status).toBe(307)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('/blog/mi-articulo')
    expect(location).toContain('draft=1')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/draft/enable — limpiar cookie', () => {
  it('elimina la cookie __vps_draft y retorna ok', async () => {
    const res = await DELETE()
    expect(mockCookieDelete).toHaveBeenCalledWith('__vps_draft')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
