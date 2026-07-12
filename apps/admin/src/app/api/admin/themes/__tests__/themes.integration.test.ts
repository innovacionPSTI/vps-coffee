/**
 * Integration tests — /api/admin/themes & /api/admin/themes/[id]
 *
 * Tests: GET, POST, PATCH (editar + setActive), DELETE — autorización y lógica.
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { PATCH, DELETE } from '../[id]/route'

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
const GESTOR_USER = { id: 'u2', role: 'gestor_tienda' as const }
const VENDEDOR_USER = { id: 'u3', role: 'vendedor' as const }

const SAMPLE_THEME = {
  id: 1,
  name: 'VPS Coffee',
  is_active: true,
  is_default: true,
  color_primary: '#614A2A',
  color_dark: '#604B30',
  color_cream: '#FFF0D1',
  color_cream_warm: '#FFF1D3',
  color_yellow: '#FFF6B8',
  color_yellow_pale: '#FDF8B9',
  color_text: '#2D1A0A',
  font_display: 'cormorant',
  font_body: 'dm-sans',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function makeReq(method: string, url: string, body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  })
}

function makeIdParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function setupChain(
  operations: Array<{ method: string; result: unknown }>
) {
  let callIndex = 0
  mockFrom.mockImplementation(() => {
    const op = operations[callIndex++] ?? { result: { data: null, error: null } }
    const chainObj: Record<string, jest.Mock> = {}
    const terminal = jest.fn().mockResolvedValue(op.result)
    chainObj.select = jest.fn().mockReturnValue(chainObj)
    chainObj.insert = jest.fn().mockReturnValue(chainObj)
    chainObj.update = jest.fn().mockReturnValue(chainObj)
    chainObj.delete = jest.fn().mockReturnValue(chainObj)
    chainObj.eq = jest.fn().mockReturnValue(chainObj)
    chainObj.order = jest.fn().mockResolvedValue(op.result)
    chainObj.single = terminal
    chainObj.maybeSingle = terminal
    return chainObj
  })
}

beforeEach(() => jest.clearAllMocks())

// ── GET /api/admin/themes ─────────────────────────────────────────────────────

describe('GET /api/admin/themes', () => {
  it('retorna 401 si no hay sesión', async () => {
    mockGetAdminUser.mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retorna 403 si el rol es vendedor', async () => {
    mockGetAdminUser.mockResolvedValueOnce(VENDEDOR_USER)
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('gestor_tienda puede listar temas', async () => {
    mockGetAdminUser.mockResolvedValueOnce(GESTOR_USER)
    setupChain([{ method: 'order', result: { data: [SAMPLE_THEME], error: null } }])

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.themes).toHaveLength(1)
    expect(body.themes[0].name).toBe('VPS Coffee')
  })

  it('devuelve array vacío si no hay temas', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    setupChain([{ method: 'order', result: { data: null, error: null } }])

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.themes).toEqual([])
  })
})

// ── POST /api/admin/themes ────────────────────────────────────────────────────

describe('POST /api/admin/themes', () => {
  it('retorna 401 sin sesión', async () => {
    mockGetAdminUser.mockResolvedValueOnce(null)
    const res = await POST(makeReq('POST', 'http://localhost/api/admin/themes', { name: 'Nuevo' }))
    expect(res.status).toBe(401)
  })

  it('retorna 400 si falta el nombre', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const res = await POST(makeReq('POST', 'http://localhost/api/admin/themes', {}))
    expect(res.status).toBe(400)
  })

  it('crea tema con defaults de colores y retorna 201', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const newTheme = { ...SAMPLE_THEME, id: 2, name: 'Otoño', is_active: false, is_default: false }
    setupChain([{ method: 'single', result: { data: newTheme, error: null } }])

    const res = await POST(makeReq('POST', 'http://localhost/api/admin/themes', { name: 'Otoño' }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.theme.name).toBe('Otoño')
    expect(body.theme.is_active).toBe(false)
  })

  it('crea tema con colores personalizados', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const newTheme = { ...SAMPLE_THEME, id: 3, name: 'Oscuro', color_primary: '#000000', is_active: false }
    setupChain([{ method: 'single', result: { data: newTheme, error: null } }])

    const res = await POST(makeReq('POST', 'http://localhost/api/admin/themes', {
      name: 'Oscuro',
      color_primary: '#000000',
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.theme.color_primary).toBe('#000000')
  })
})

// ── PATCH /api/admin/themes/[id] ──────────────────────────────────────────────

describe('PATCH /api/admin/themes/[id]', () => {
  it('retorna 401 sin sesión', async () => {
    mockGetAdminUser.mockResolvedValueOnce(null)
    const res = await PATCH(
      makeReq('PATCH', 'http://localhost/api/admin/themes/1', { name: 'Nuevo nombre' }),
      makeIdParams('1')
    )
    expect(res.status).toBe(401)
  })

  it('retorna 400 con ID no numérico', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const res = await PATCH(
      makeReq('PATCH', 'http://localhost/api/admin/themes/abc', { name: 'X' }),
      makeIdParams('abc')
    )
    expect(res.status).toBe(400)
  })

  it('retorna 400 si body no tiene campos válidos', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const res = await PATCH(
      makeReq('PATCH', 'http://localhost/api/admin/themes/1', { foo: 'bar' }),
      makeIdParams('1')
    )
    expect(res.status).toBe(400)
  })

  it('actualiza el nombre correctamente', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const updated = { ...SAMPLE_THEME, name: 'Renombrado' }
    setupChain([{ method: 'single', result: { data: updated, error: null } }])

    const res = await PATCH(
      makeReq('PATCH', 'http://localhost/api/admin/themes/1', { name: 'Renombrado' }),
      makeIdParams('1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.theme.name).toBe('Renombrado')
  })

  it('activa un tema con { setActive: true } (dos operaciones a BD)', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)

    // Primera llamada: desactivar activos (UPDATE is_active=false)
    const deactivateChain: Record<string, jest.Mock> = {}
    deactivateChain.update = jest.fn().mockReturnValue(deactivateChain)
    deactivateChain.eq = jest.fn().mockResolvedValue({ error: null })

    // Segunda llamada: activar el tema elegido
    const activateChain: Record<string, jest.Mock> = {}
    activateChain.update = jest.fn().mockReturnValue(activateChain)
    activateChain.eq = jest.fn().mockResolvedValue({ error: null })

    mockFrom
      .mockReturnValueOnce(deactivateChain)
      .mockReturnValueOnce(activateChain)

    const res = await PATCH(
      makeReq('PATCH', 'http://localhost/api/admin/themes/2', { setActive: true }),
      makeIdParams('2')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(mockFrom).toHaveBeenCalledTimes(2)
  })
})

// ── DELETE /api/admin/themes/[id] ─────────────────────────────────────────────

describe('DELETE /api/admin/themes/[id]', () => {
  it('retorna 401 sin sesión', async () => {
    mockGetAdminUser.mockResolvedValueOnce(null)
    const res = await DELETE(
      makeReq('DELETE', 'http://localhost/api/admin/themes/1'),
      makeIdParams('1')
    )
    expect(res.status).toBe(401)
  })

  it('retorna 400 con ID no numérico', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    const res = await DELETE(
      makeReq('DELETE', 'http://localhost/api/admin/themes/x'),
      makeIdParams('x')
    )
    expect(res.status).toBe(400)
  })

  it('retorna 404 si el tema no existe', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    setupChain([{ method: 'maybeSingle', result: { data: null } }])

    const res = await DELETE(
      makeReq('DELETE', 'http://localhost/api/admin/themes/999'),
      makeIdParams('999')
    )
    expect(res.status).toBe(404)
  })

  it('retorna 400 si el tema está activo', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    setupChain([{ method: 'maybeSingle', result: { data: { is_active: true, is_default: false } } }])

    const res = await DELETE(
      makeReq('DELETE', 'http://localhost/api/admin/themes/1'),
      makeIdParams('1')
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('activo')
  })

  it('retorna 400 si el tema es el predeterminado', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)
    setupChain([{ method: 'maybeSingle', result: { data: { is_active: false, is_default: true } } }])

    const res = await DELETE(
      makeReq('DELETE', 'http://localhost/api/admin/themes/1'),
      makeIdParams('1')
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('defecto')
  })

  it('elimina un tema que no es activo ni predeterminado', async () => {
    mockGetAdminUser.mockResolvedValueOnce(ADMIN_USER)

    const selectChain: Record<string, jest.Mock> = {}
    selectChain.select = jest.fn().mockReturnValue(selectChain)
    selectChain.eq = jest.fn().mockReturnValue(selectChain)
    selectChain.maybeSingle = jest.fn().mockResolvedValue({
      data: { is_active: false, is_default: false },
    })

    const deleteChain: Record<string, jest.Mock> = {}
    deleteChain.delete = jest.fn().mockReturnValue(deleteChain)
    deleteChain.eq = jest.fn().mockResolvedValue({ error: null })

    mockFrom
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(deleteChain)

    const res = await DELETE(
      makeReq('DELETE', 'http://localhost/api/admin/themes/2'),
      makeIdParams('2')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
  })
})
