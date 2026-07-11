/**
 * Integration tests — POST /api/admin/products
 *
 * Prueba crítica: verifica que las imágenes del body se persisten en la BD
 * (bug anterior: el handler hardcodeaba `images: []` ignorando el payload).
 *
 * Tests:
 *   POST → crea producto con imágenes
 *   POST → crea variantes correctamente
 *   POST → validación: nombre y slug requeridos
 *   POST → validación: al menos una variante
 *   POST → manejo de error de BD (slug duplicado)
 *   POST → no falla si images está ausente (default [])
 */

import { NextRequest } from 'next/server'

// ─────────────────────────────────────────────
// Mock del cliente Supabase
// ─────────────────────────────────────────────
const mockProductSingle = jest.fn()
const mockProductSelect = jest.fn(() => ({ single: mockProductSingle }))
const mockProductInsert = jest.fn(() => ({ select: mockProductSelect }))

const mockVariantInsert = jest.fn(() => Promise.resolve({ error: null }))

const mockFrom = jest.fn((table: string) => {
  if (table === 'products') {
    return { insert: mockProductInsert }
  }
  if (table === 'product_variants') {
    return { insert: mockVariantInsert }
  }
  return {}
})

jest.mock('@vps/database', () => ({
  createServerClient: jest.fn(() => ({ from: mockFrom })),
}))

import { POST } from '../route'

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
const createdProduct = {
  id: 42,
  name: 'Geisha Natural Huila',
  slug: 'geisha-natural-huila',
  description: 'Café de especialidad origen único',
  category_id: 1,
  featured: false,
  active: true,
  seo_title: null,
  seo_desc: null,
  images: [{ url: 'https://example.com/img.jpg' }],
  created_at: '2026-07-09T00:00:00.000Z',
}

const baseVariant = {
  roast: 'medium',
  weight: '500g',
  grind: null,
  brew_method: null,
  price: 45000,
  stock: 10,
  sku: null,
  active: true,
}

function makePostRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────
describe('POST /api/admin/products — imágenes', () => {
  it('incluye las imágenes del body en el insert (bug fix crítico)', async () => {
    mockProductSingle.mockResolvedValueOnce({ data: createdProduct, error: null })
    mockVariantInsert.mockResolvedValueOnce({ error: null })

    const imageUrl = 'https://example.com/img.jpg'
    const req = makePostRequest({
      name: 'Geisha Natural Huila',
      slug: 'geisha-natural-huila',
      images: [{ url: imageUrl }],
      variants: [baseVariant],
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    // Verifica que el insert recibió las imágenes — NO `images: []`
    const insertArg = mockProductInsert.mock.calls[0][0]
    expect(insertArg.images).toEqual([{ url: imageUrl }])
    expect(insertArg.images.length).toBeGreaterThan(0)
  })

  it('usa [] si el body no trae campo images', async () => {
    mockProductSingle.mockResolvedValueOnce({ data: { ...createdProduct, images: [] }, error: null })
    mockVariantInsert.mockResolvedValueOnce({ error: null })

    const req = makePostRequest({
      name: 'Geisha Natural Huila',
      slug: 'geisha-natural-huila',
      variants: [baseVariant],
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const insertArg = mockProductInsert.mock.calls[0][0]
    expect(insertArg.images).toEqual([])
  })
})

describe('POST /api/admin/products — variantes', () => {
  it('crea las variantes con product_id del producto recién insertado', async () => {
    mockProductSingle.mockResolvedValueOnce({ data: createdProduct, error: null })
    mockVariantInsert.mockResolvedValueOnce({ error: null })

    const req = makePostRequest({
      name: 'Geisha Natural Huila',
      slug: 'geisha-natural-huila',
      images: [],
      variants: [baseVariant],
    })

    await POST(req)

    const variantInsertArg = mockVariantInsert.mock.calls[0][0]
    expect(Array.isArray(variantInsertArg)).toBe(true)
    expect(variantInsertArg[0].product_id).toBe(42)
    expect(variantInsertArg[0].price).toBe(45000)
  })
})

describe('POST /api/admin/products — validación', () => {
  it('retorna 400 si falta el nombre', async () => {
    const req = makePostRequest({
      slug: 'geisha-natural-huila',
      variants: [baseVariant],
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/nombre|slug/i)
  })

  it('retorna 400 si falta el slug', async () => {
    const req = makePostRequest({
      name: 'Geisha Natural Huila',
      variants: [baseVariant],
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si no hay variantes', async () => {
    const req = makePostRequest({
      name: 'Geisha Natural Huila',
      slug: 'geisha-natural-huila',
      variants: [],
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/variante/i)
  })
})

describe('POST /api/admin/products — errores de BD', () => {
  it('retorna 500 si el insert de producto falla (ej. slug duplicado)', async () => {
    mockProductSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'duplicate key value violates unique constraint "products_slug_key"' },
    })

    const req = makePostRequest({
      name: 'Geisha Natural Huila',
      slug: 'geisha-natural-huila',
      images: [],
      variants: [baseVariant],
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toMatch(/duplicate|slug/i)
  })

  it('retorna 500 si el insert de variantes falla', async () => {
    mockProductSingle.mockResolvedValueOnce({ data: createdProduct, error: null })
    mockVariantInsert.mockResolvedValueOnce({ error: { message: 'FK violation' } })

    const req = makePostRequest({
      name: 'Geisha Natural Huila',
      slug: 'geisha-natural-huila',
      images: [],
      variants: [baseVariant],
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
