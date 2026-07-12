/**
 * Integration tests — /api/admin/testimonios
 *
 * Tests: GET, POST, PATCH, DELETE — autorización y lógica de datos.
 */

import { NextRequest } from 'next/server'
import { GET, POST, PATCH, DELETE } from '../route'

// ── Auth mock ──────────────────────────────────
const mockGetAdminUser = jest.fn()
jest.mock('@/lib/auth', () => ({
  getAdminUser: () => mockGetAdminUser(),
}))

// ── Database mock ──────────────────────────────
const mockGetTestimonials = jest.fn()
const mockCreateTestimonial = jest.fn()
const mockUpdateTestimonial = jest.fn()
const mockDeleteTestimonial = jest.fn()

jest.mock('@vps/database', () => ({
  getTestimonials: (...args: unknown[]) => mockGetTestimonials(...args),
  createTestimonial: (...args: unknown[]) => mockCreateTestimonial(...args),
  updateTestimonial: (...args: unknown[]) => mockUpdateTestimonial(...args),
  deleteTestimonial: (...args: unknown[]) => mockDeleteTestimonial(...args),
}))

const ADMIN_USER = { id: 'u1', role: 'admin' as const }
const BASE_URL = 'http://localhost/api/admin/testimonios'

function makeReq(method: string, body?: Record<string, unknown>) {
  return new NextRequest(BASE_URL, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  })
}

const SAMPLE = {
  id: 1, author_name: 'María García', author_role: 'Barista', content: 'Excelente café',
  avatar_url: null, rating: 5, active: true, order_index: 0, created_at: '2026-01-01T00:00:00Z',
}

beforeEach(() => jest.clearAllMocks())

// ── GET ────────────────────────────────────────
describe('GET /api/admin/testimonios', () => {
  it('retorna 401 si no hay usuario admin', async () => {
    mockGetAdminUser.mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retorna 401 si el usuario no es admin/super_admin', async () => {
    mockGetAdminUser.mockResolvedValueOnce({ id: 'u1', role: 'vendedor' })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retorna lista de testimonios (todos, incluyendo inactivos)', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    mockGetTestimonials.mockResolvedValueOnce([SAMPLE])

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.testimonials).toHaveLength(1)
    expect(mockGetTestimonials).toHaveBeenCalledWith(false) // incluir inactivos
  })
})

// ── POST ───────────────────────────────────────
describe('POST /api/admin/testimonios', () => {
  it('retorna 400 si falta author_name', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)

    const res = await POST(makeReq('POST', { content: 'Buen café', rating: 5 }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta content', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)

    const res = await POST(makeReq('POST', { author_name: 'María' }))
    expect(res.status).toBe(400)
  })

  it('crea un testimonio y retorna 201', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    mockCreateTestimonial.mockResolvedValueOnce(SAMPLE)

    const res = await POST(makeReq('POST', {
      author_name: 'María García',
      author_role: 'Barista',
      content: 'Excelente café',
      rating: 5,
    }))

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.testimonial.author_name).toBe('María García')
  })

  it('recorta espacios en author_name y content', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    mockCreateTestimonial.mockResolvedValueOnce(SAMPLE)

    await POST(makeReq('POST', { author_name: '  María  ', content: '  Buen café  ' }))

    expect(mockCreateTestimonial).toHaveBeenCalledWith(
      expect.objectContaining({ author_name: 'María', content: 'Buen café' })
    )
  })
})

// ── PATCH ──────────────────────────────────────
describe('PATCH /api/admin/testimonios', () => {
  it('retorna 400 si falta id', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)

    const res = await PATCH(makeReq('PATCH', { active: false }))
    expect(res.status).toBe(400)
  })

  it('actualiza el testimonio correctamente', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const updated = { ...SAMPLE, active: false }
    mockUpdateTestimonial.mockResolvedValueOnce(updated)

    const res = await PATCH(makeReq('PATCH', { id: 1, active: false }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.testimonial.active).toBe(false)
    expect(mockUpdateTestimonial).toHaveBeenCalledWith(1, expect.objectContaining({ active: false }))
  })
})

// ── DELETE ─────────────────────────────────────
describe('DELETE /api/admin/testimonios', () => {
  it('retorna 400 si falta id', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)

    const res = await DELETE(makeReq('DELETE', {}))
    expect(res.status).toBe(400)
  })

  it('elimina el testimonio y retorna ok', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    mockDeleteTestimonial.mockResolvedValueOnce(undefined)

    const res = await DELETE(makeReq('DELETE', { id: 1 }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(mockDeleteTestimonial).toHaveBeenCalledWith(1)
  })
})
