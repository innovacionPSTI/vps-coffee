/**
 * Integration tests — PATCH /api/admin/sections/[key]
 *
 * Tests: autorización, validación y actualización de estado de sección.
 */

import { NextRequest } from 'next/server'
import { PATCH } from '../[key]/route'

// ── Auth mock ──────────────────────────────────────────────────────────────────
const mockGetAdminUser = jest.fn()
jest.mock('@/lib/auth', () => ({
  getAdminUser: () => mockGetAdminUser(),
}))

// ── Database mock ──────────────────────────────────────────────────────────────
const mockFrom = jest.fn()
jest.mock('@vps/database', () => ({
  createServerClient: () => ({ from: mockFrom }),
}))

// ── Helpers ────────────────────────────────────────────────────────────────────
const ADMIN_USER = { id: 'u1', role: 'admin' as const }
const SUPER_USER = { id: 'u2', role: 'super_admin' as const }
const GESTOR_USER = { id: 'u3', role: 'gestor_tienda' as const }
const VENDEDOR_USER = { id: 'u4', role: 'vendedor' as const }

function makeReq(method: string, body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/sections/hero', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  })
}

function makeParams(key: string) {
  return { params: Promise.resolve({ key }) }
}

const SAMPLE_SECTION = {
  key: 'hero',
  label: 'Hero / Carrusel',
  description: 'Slider de banners en el inicio',
  enabled: true,
  order_index: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-07-12T00:00:00Z',
}

function setupChain(result: unknown) {
  const c: Record<string, jest.Mock> = {}
  c.update = jest.fn().mockReturnValue(c)
  c.eq = jest.fn().mockReturnValue(c)
  c.select = jest.fn().mockReturnValue(c)
  c.single = jest.fn().mockResolvedValue(result)
  mockFrom.mockReturnValue(c)
  return c
}

beforeEach(() => jest.clearAllMocks())

// ── Autorización ──────────────────────────────────────────────────────────────

describe('PATCH /api/admin/sections/[key] — autorización', () => {
  it('retorna 401 si no hay sesión', async () => {
    mockGetAdminUser.mockResolvedValueOnce(null)
    const res = await PATCH(makeReq('PATCH', { enabled: false }), makeParams('hero'))
    expect(res.status).toBe(401)
  })

  it('retorna 403 si el rol es vendedor', async () => {
    mockGetAdminUser.mockResolvedValueOnce(VENDEDOR_USER)
    const res = await PATCH(makeReq('PATCH', { enabled: false }), makeParams('hero'))
    expect(res.status).toBe(403)
  })

  it('retorna 403 si el rol es gestor_tienda (solo admin/super_admin)', async () => {
    mockGetAdminUser.mockResolvedValueOnce(GESTOR_USER)
    const res = await PATCH(makeReq('PATCH', { enabled: false }), makeParams('hero'))
    expect(res.status).toBe(403)
  })

  it('admin puede actualizar una sección', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    setupChain({ data: { ...SAMPLE_SECTION, enabled: false }, error: null })
    const res = await PATCH(makeReq('PATCH', { enabled: false }), makeParams('hero'))
    expect(res.status).toBe(200)
  })

  it('super_admin puede actualizar una sección', async () => {
    mockGetAdminUser.mockResolvedValueOnce(SUPER_USER)
    setupChain({ data: SAMPLE_SECTION, error: null })
    const res = await PATCH(makeReq('PATCH', { enabled: true }), makeParams('hero'))
    expect(res.status).toBe(200)
  })
})

// ── Validación ────────────────────────────────────────────────────────────────

describe('PATCH /api/admin/sections/[key] — validación', () => {
  it('retorna 400 si falta el campo enabled', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const res = await PATCH(makeReq('PATCH', {}), makeParams('hero'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/enabled/)
  })

  it('retorna 400 si enabled no es boolean (string)', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const res = await PATCH(makeReq('PATCH', { enabled: 'true' }), makeParams('hero'))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si enabled no es boolean (número)', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const res = await PATCH(makeReq('PATCH', { enabled: 1 }), makeParams('hero'))
    expect(res.status).toBe(400)
  })
})

// ── Lógica de negocio ─────────────────────────────────────────────────────────

describe('PATCH /api/admin/sections/[key] — lógica', () => {
  it('deshabilita la sección y retorna el objeto actualizado', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const updated = { ...SAMPLE_SECTION, enabled: false }
    const c = setupChain({ data: updated, error: null })

    const res = await PATCH(makeReq('PATCH', { enabled: false }), makeParams('hero'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.section.enabled).toBe(false)
    expect(c.update).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    )
    expect(c.eq).toHaveBeenCalledWith('key', 'hero')
  })

  it('habilita la sección y retorna el objeto actualizado', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    setupChain({ data: SAMPLE_SECTION, error: null })

    const res = await PATCH(makeReq('PATCH', { enabled: true }), makeParams('hero'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.section.enabled).toBe(true)
  })

  it('incluye updated_at en la actualización', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const c = setupChain({ data: SAMPLE_SECTION, error: null })

    await PATCH(makeReq('PATCH', { enabled: true }), makeParams('blog'))

    expect(c.update).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) })
    )
  })

  it('retorna 500 si Supabase devuelve error', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    setupChain({ data: null, error: { message: 'Row not found' } })

    const res = await PATCH(makeReq('PATCH', { enabled: false }), makeParams('newsletter'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Row not found')
  })

  it('funciona con distintas keys (newsletter, blog, etc.)', async () => {
    for (const key of ['newsletter', 'blog', 'featured_products', 'services']) {
      mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
      const c = setupChain({ data: { ...SAMPLE_SECTION, key, enabled: false }, error: null })

      const res = await PATCH(
        new NextRequest(`http://localhost/api/admin/sections/${key}`, {
          method: 'PATCH',
          body: JSON.stringify({ enabled: false }),
          headers: { 'Content-Type': 'application/json' },
        }),
        makeParams(key)
      )

      expect(res.status).toBe(200)
      expect(c.eq).toHaveBeenCalledWith('key', key)
    }
  })
})
