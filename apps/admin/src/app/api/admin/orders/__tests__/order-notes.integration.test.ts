/**
 * Integration tests — PATCH /api/admin/orders/[id]/notes
 *
 * Tests:
 *   - Guarda notas internas (texto)
 *   - Borra notas al enviar string vacío
 *   - Auth: 401 sin sesión, 403 si rol no tiene permiso
 *   - ID inválido → 400
 *   - Supabase error → 400
 */

import { NextRequest } from 'next/server'

jest.mock('@vps/database', () => ({
  createServerClient: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  getAdminUser: jest.fn(),
}))

import { createServerClient } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import { PATCH } from '../[id]/notes/route'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockGetAdminUser       = getAdminUser       as jest.MockedFunction<typeof getAdminUser>

function makeRequest(body: object, id = '42'): NextRequest {
  return new NextRequest(`http://localhost/api/admin/orders/${id}/notes`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function buildSupabaseMock(result: { data: unknown; error: unknown }) {
  const singleMock = jest.fn().mockResolvedValue(result)
  const selectMock = jest.fn().mockReturnValue({ single: singleMock })
  const eqMock     = jest.fn().mockReturnValue({ select: selectMock })
  const updateMock = jest.fn().mockReturnValue({ eq: eqMock })
  return {
    mockSupabase: { from: jest.fn().mockReturnValue({ update: updateMock }) },
    updateMock,
  }
}

const vendedorUser = { id: 'u1', role: 'vendedor', email: 'v@test.com' }
const gestorUser   = { id: 'u2', role: 'gestor_tienda', email: 'g@test.com' }

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// Auth guards
// ─────────────────────────────────────────────
describe('PATCH /api/admin/orders/[id]/notes — auth', () => {
  it('retorna 401 si no hay sesión', async () => {
    mockGetAdminUser.mockResolvedValue(null)

    const res = await PATCH(makeRequest({ internal_notes: 'nota' }), { params: Promise.resolve({ id: '42' }) })
    expect(res.status).toBe(401)
  })

  it('retorna 403 si el rol es gestor_tienda (sin permiso)', async () => {
    mockGetAdminUser.mockResolvedValue(gestorUser as never)

    const res = await PATCH(makeRequest({ internal_notes: 'nota' }), { params: Promise.resolve({ id: '42' }) })
    expect(res.status).toBe(403)
  })

  it('permite acceso a vendedor', async () => {
    mockGetAdminUser.mockResolvedValue(vendedorUser as never)
    const { mockSupabase } = buildSupabaseMock({ data: { id: 42, internal_notes: 'nota' }, error: null })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await PATCH(makeRequest({ internal_notes: 'nota' }), { params: Promise.resolve({ id: '42' }) })
    expect(res.status).toBe(200)
  })
})

// ─────────────────────────────────────────────
// Happy path
// ─────────────────────────────────────────────
describe('PATCH /api/admin/orders/[id]/notes — happy path', () => {
  beforeEach(() => mockGetAdminUser.mockResolvedValue(vendedorUser as never))

  it('guarda nota y retorna id + internal_notes', async () => {
    const { mockSupabase } = buildSupabaseMock({
      data: { id: 42, internal_notes: 'Preparar con bolsa especial' },
      error: null,
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res  = await PATCH(makeRequest({ internal_notes: 'Preparar con bolsa especial' }), { params: Promise.resolve({ id: '42' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.internal_notes).toBe('Preparar con bolsa especial')
  })

  it('borra la nota al enviar string vacío (guarda null)', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock({
      data: { id: 42, internal_notes: null },
      error: null,
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await PATCH(makeRequest({ internal_notes: '' }), { params: Promise.resolve({ id: '42' }) })

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ internal_notes: null }))
  })

  it('borra la nota al enviar null explícito', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock({
      data: { id: 42, internal_notes: null },
      error: null,
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await PATCH(makeRequest({ internal_notes: null }), { params: Promise.resolve({ id: '42' }) })

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ internal_notes: null }))
  })
})

// ─────────────────────────────────────────────
// Validación
// ─────────────────────────────────────────────
describe('PATCH /api/admin/orders/[id]/notes — validación', () => {
  beforeEach(() => mockGetAdminUser.mockResolvedValue(vendedorUser as never))

  it('retorna 400 si el id no es numérico', async () => {
    const res = await PATCH(makeRequest({ internal_notes: 'nota' }, 'abc'), { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(400)
  })

  it('retorna 400 si Supabase falla', async () => {
    const { mockSupabase } = buildSupabaseMock({
      data: null,
      error: { message: 'column not found' },
    })
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await PATCH(makeRequest({ internal_notes: 'nota' }), { params: Promise.resolve({ id: '42' }) })
    expect(res.status).toBe(400)
  })
})
