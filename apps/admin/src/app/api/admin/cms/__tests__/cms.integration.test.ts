/**
 * @jest-environment node
 *
 * Integration tests — /api/admin/cms/[resource]
 *
 * Cubre los 4 recursos del endpoint unificado:
 *   pages, sections, items, section-settings
 *
 * Cada recurso verifica: GET, POST, PATCH, DELETE
 * y los casos de error (auth, campos faltantes, recurso inválido).
 */

// ── Mocks ──────────────────────────────────────────────────────────────────────
// Factories explícitas para evitar que Jest evalúe los módulos reales
// (@stackframe/stack y jose son ESM-only e incompatibles con el runner de Jest)

jest.mock('@/lib/auth', () => ({
  getAdminUser: jest.fn(),
}))
jest.mock('@vps/database', () => ({
  createServerClient: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { GET, POST, PATCH, DELETE } from '../[resource]/route'
import { getAdminUser } from '@/lib/auth'
import { createServerClient } from '@vps/database'

const mockGetAdminUser = getAdminUser as jest.MockedFunction<typeof getAdminUser>
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// ── Helpers ────────────────────────────────────────────────────────────────────

type DbChain = Record<string, jest.Mock>

function buildSupabaseMock(returnData: unknown, returnError: unknown = null) {
  const result = { data: returnData, error: returnError }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: DbChain = {} as any
  const self = () => chain

  chain.select = jest.fn(self)
  chain.insert = jest.fn(self)
  chain.update = jest.fn(self)
  chain.delete = jest.fn(self)
  chain.eq     = jest.fn(self)
  chain.order  = jest.fn(self)
  chain.single = jest.fn(() => Promise.resolve(result))

  // Hace el chain "thenable": `await query` resuelve con {data, error}
  // sin romper el encadenamiento de .select().order().eq()...
  chain.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(result).then(resolve)

  return {
    from: jest.fn(() => chain),
    _chain: chain,
  }
}

function makeRequest(
  method: string,
  resource: string,
  body?: object,
  qs?: string,
): NextRequest {
  const url = `http://localhost/api/admin/cms/${resource}${qs ?? ''}`
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeParams(resource: string) {
  return { params: Promise.resolve({ resource }) }
}

// ── Setup ──────────────────────────────────────────────────────────────────────

const fakeUser = { id: 'u1', email: 'admin@test.com', role: 'super_admin' as const }

beforeEach(() => {
  jest.clearAllMocks()
  mockGetAdminUser.mockResolvedValue(fakeUser)
})

// ─────────────────────────────────────────────────────────────────────────────
// Auth guard
// ─────────────────────────────────────────────────────────────────────────────

describe('Auth guard', () => {
  it('GET devuelve 401 si no está autenticado', async () => {
    mockGetAdminUser.mockRejectedValue(new Error('No autorizado'))
    const res = await GET(makeRequest('GET', 'pages'), makeParams('pages'))
    expect(res.status).toBe(401)
  })

  it('POST devuelve 401 si no está autenticado', async () => {
    mockGetAdminUser.mockRejectedValue(new Error('No autorizado'))
    const res = await POST(makeRequest('POST', 'pages', { key: 'x', label: 'x', slug: 'x' }), makeParams('pages'))
    expect(res.status).toBe(401)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Recurso inválido
// ─────────────────────────────────────────────────────────────────────────────

describe('Recurso inválido', () => {
  it('GET devuelve 404 para recurso desconocido', async () => {
    const res = await GET(makeRequest('GET', 'inventado'), makeParams('inventado'))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toContain('inventado')
  })

  it('POST devuelve 404 para recurso desconocido', async () => {
    const res = await POST(makeRequest('POST', 'xyz', {}), makeParams('xyz'))
    expect(res.status).toBe(404)
  })

  it('PATCH devuelve 404 para recurso desconocido', async () => {
    const res = await PATCH(makeRequest('PATCH', 'xyz', { key: 'a' }), makeParams('xyz'))
    expect(res.status).toBe(404)
  })

  it('DELETE devuelve 404 para recurso desconocido', async () => {
    const res = await DELETE(makeRequest('DELETE', 'xyz', undefined, '?key=a'), makeParams('xyz'))
    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// pages
// ─────────────────────────────────────────────────────────────────────────────

describe('pages', () => {
  const fakePage = { key: 'nosotros', label: 'Nosotros', slug: 'nosotros', enabled: true }

  it('GET lista todas las páginas', async () => {
    const mock = buildSupabaseMock([fakePage])
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await GET(makeRequest('GET', 'pages'), makeParams('pages'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].key).toBe('nosotros')
  })

  it('POST crea una página con los campos requeridos', async () => {
    const mock = buildSupabaseMock(fakePage)
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await POST(
      makeRequest('POST', 'pages', { key: 'nosotros', label: 'Nosotros', slug: 'nosotros' }),
      makeParams('pages'),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.key).toBe('nosotros')
  })

  it('POST devuelve 400 si faltan campos requeridos', async () => {
    const res = await POST(
      makeRequest('POST', 'pages', { key: 'x' }), // falta label y slug
      makeParams('pages'),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('label')
    expect(body.error).toContain('slug')
  })

  it('PATCH actualiza una página por key', async () => {
    const updated = { ...fakePage, label: 'Quiénes Somos' }
    const mock = buildSupabaseMock(updated)
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await PATCH(
      makeRequest('PATCH', 'pages', { key: 'nosotros', label: 'Quiénes Somos' }),
      makeParams('pages'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.label).toBe('Quiénes Somos')
  })

  it('PATCH devuelve 400 si falta key', async () => {
    const res = await PATCH(
      makeRequest('PATCH', 'pages', { label: 'Sin key' }),
      makeParams('pages'),
    )
    expect(res.status).toBe(400)
  })

  it('PATCH devuelve 400 si no hay campos para actualizar', async () => {
    const res = await PATCH(
      makeRequest('PATCH', 'pages', { key: 'nosotros' }),
      makeParams('pages'),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Sin campos')
  })

  it('DELETE elimina una página por key', async () => {
    const mock = buildSupabaseMock(null)
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await DELETE(
      makeRequest('DELETE', 'pages', undefined, '?key=nosotros'),
      makeParams('pages'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('DELETE devuelve 400 si falta key', async () => {
    const res = await DELETE(
      makeRequest('DELETE', 'pages', undefined, ''),
      makeParams('pages'),
    )
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// sections (page_sections)
// ─────────────────────────────────────────────────────────────────────────────

describe('sections', () => {
  const fakeSection = { id: 10, page_key: 'nosotros', section_type: 'text', title: 'Historia' }

  it('GET lista secciones filtradas por page_key', async () => {
    const mock = buildSupabaseMock([fakeSection])
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await GET(
      makeRequest('GET', 'sections', undefined, '?page_key=nosotros'),
      makeParams('sections'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].page_key).toBe('nosotros')
  })

  it('POST crea una sección', async () => {
    const mock = buildSupabaseMock(fakeSection)
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await POST(
      makeRequest('POST', 'sections', { page_key: 'nosotros', section_type: 'text', title: 'Historia' }),
      makeParams('sections'),
    )
    expect(res.status).toBe(201)
  })

  it('POST devuelve 400 si faltan page_key o section_type', async () => {
    const res = await POST(
      makeRequest('POST', 'sections', { page_key: 'nosotros' }),
      makeParams('sections'),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('section_type')
  })

  it('PATCH actualiza una sección por id', async () => {
    const mock = buildSupabaseMock({ ...fakeSection, title: 'Actualizado' })
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await PATCH(
      makeRequest('PATCH', 'sections', { id: 10, title: 'Actualizado' }),
      makeParams('sections'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('Actualizado')
  })

  it('DELETE elimina una sección por id', async () => {
    const mock = buildSupabaseMock(null)
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await DELETE(
      makeRequest('DELETE', 'sections', undefined, '?id=10'),
      makeParams('sections'),
    )
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// items (section_items)
// ─────────────────────────────────────────────────────────────────────────────

describe('items', () => {
  const fakeItem = { id: 5, section_id: 10, title: 'Item 1', order_index: 1 }

  it('GET lista ítems filtrados por section_id', async () => {
    const mock = buildSupabaseMock([fakeItem])
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await GET(
      makeRequest('GET', 'items', undefined, '?section_id=10'),
      makeParams('items'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].section_id).toBe(10)
  })

  it('POST crea un ítem', async () => {
    const mock = buildSupabaseMock(fakeItem)
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await POST(
      makeRequest('POST', 'items', { section_id: 10, title: 'Item 1', order_index: 1 }),
      makeParams('items'),
    )
    expect(res.status).toBe(201)
  })

  it('POST devuelve 400 si falta section_id', async () => {
    const res = await POST(
      makeRequest('POST', 'items', { title: 'Sin sección' }),
      makeParams('items'),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('section_id')
  })

  it('PATCH actualiza un ítem por id', async () => {
    const mock = buildSupabaseMock({ ...fakeItem, title: 'Editado' })
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await PATCH(
      makeRequest('PATCH', 'items', { id: 5, title: 'Editado' }),
      makeParams('items'),
    )
    expect(res.status).toBe(200)
  })

  it('DELETE elimina un ítem por id', async () => {
    const mock = buildSupabaseMock(null)
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await DELETE(
      makeRequest('DELETE', 'items', undefined, '?id=5'),
      makeParams('items'),
    )
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// section-settings
// ─────────────────────────────────────────────────────────────────────────────

describe('section-settings', () => {
  const fakeSetting = { key: 'hero', page_key: 'home', enabled: true, order_index: 1, metadata: null }

  it('GET lista section_settings filtradas por page_key', async () => {
    const mock = buildSupabaseMock([fakeSetting])
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await GET(
      makeRequest('GET', 'section-settings', undefined, '?page_key=home'),
      makeParams('section-settings'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].key).toBe('hero')
  })

  it('PATCH actualiza enabled de una sección del home', async () => {
    const mock = buildSupabaseMock({ ...fakeSetting, enabled: false })
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await PATCH(
      makeRequest('PATCH', 'section-settings', { key: 'hero', enabled: false }),
      makeParams('section-settings'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.enabled).toBe(false)
  })

  it('PATCH actualiza metadata de una sección', async () => {
    const metadata = { title: 'Nuestra historia', subtitle: 'Desde 2020' }
    const mock = buildSupabaseMock({ ...fakeSetting, metadata })
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await PATCH(
      makeRequest('PATCH', 'section-settings', { key: 'historia', metadata }),
      makeParams('section-settings'),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.metadata).toEqual(metadata)
  })

  it('PATCH devuelve 400 si falta key', async () => {
    const res = await PATCH(
      makeRequest('PATCH', 'section-settings', { enabled: true }),
      makeParams('section-settings'),
    )
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Error de base de datos (propagación)
// ─────────────────────────────────────────────────────────────────────────────

describe('Errores de base de datos', () => {
  it('GET devuelve 500 si Supabase falla', async () => {
    const mock = buildSupabaseMock(null, { message: 'DB error' })
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await GET(makeRequest('GET', 'pages'), makeParams('pages'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('DB error')
  })

  it('POST devuelve 500 si Supabase falla', async () => {
    const mock = buildSupabaseMock(null, { message: 'Constraint violation' })
    mock._chain.single.mockResolvedValue({ data: null, error: { message: 'Constraint violation' } })
    mockCreateServerClient.mockReturnValue(mock as ReturnType<typeof createServerClient>)

    const res = await POST(
      makeRequest('POST', 'pages', { key: 'dup', label: 'Dup', slug: 'dup' }),
      makeParams('pages'),
    )
    expect(res.status).toBe(500)
  })
})
