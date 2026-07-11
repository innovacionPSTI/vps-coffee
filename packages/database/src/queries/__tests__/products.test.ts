/**
 * Unit tests for products query helpers.
 * Supabase client is mocked to avoid real DB calls.
 */

import { getProducts, getProductBySlug, getFeaturedProducts } from '../products'
import { createServerClient } from '../../client'

jest.mock('../../client')
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function buildSupabaseMock(resolvedValue: { data: unknown; error: null | object }) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolvedValue),
    then: jest.fn(),
  }
  // Make it thenable (for queries that don't end in .single())
  Object.assign(chain, { ...resolvedValue, ...chain })
  // Simulate final await on the chain
  chain.order = jest.fn().mockResolvedValue(resolvedValue)

  return {
    from: jest.fn().mockReturnValue({
      ...chain,
      select: jest.fn().mockReturnValue({
        ...chain,
        eq: jest.fn().mockReturnValue({
          ...chain,
          eq: jest.fn().mockReturnValue({
            ...chain,
          }),
        }),
      }),
    }),
  }
}

const mockProduct = {
  id: 1,
  slug: 'cafe-huila',
  name: 'Café Huila',
  active: true,
  featured: true,
  category: { id: 1, name: 'Origen Único', slug: 'origen-unico' },
  variants: [
    { id: 10, roast: 'claro', weight: '500g', price: 45000, stock: 20 },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─────────────────────────────────────────────
// getProducts
// ─────────────────────────────────────────────
describe('getProducts', () => {
  it('retorna un arreglo de productos activos', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [mockProduct], error: null }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const products = await getProducts()
    expect(products).toHaveLength(1)
    expect(products[0].slug).toBe('cafe-huila')
  })

  it('aplica filtro featured cuando se pasa la opción', async () => {
    const eqMock = jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: [mockProduct], error: null }),
    })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ eq: eqMock }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await getProducts({ featured: true })
    expect(eqMock).toHaveBeenCalledWith('featured', true)
  })

  it('lanza un error si Supabase devuelve error', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('DB error'),
            }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await expect(getProducts()).rejects.toThrow('DB error')
  })
})

// ─────────────────────────────────────────────
// getProductBySlug
// ─────────────────────────────────────────────
describe('getProductBySlug', () => {
  it('retorna el producto con el slug indicado', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: mockProduct, error: null })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ single: singleMock }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const product = await getProductBySlug('cafe-huila')
    expect(product.slug).toBe('cafe-huila')
  })

  it('lanza error si el producto no existe (PGRST116)', async () => {
    const notFoundError = { code: 'PGRST116', message: 'Row not found' }
    const singleMock = jest.fn().mockResolvedValue({ data: null, error: notFoundError })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({ single: singleMock }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await expect(getProductBySlug('inexistente')).rejects.toMatchObject({ code: 'PGRST116' })
  })
})

// ─────────────────────────────────────────────
// getFeaturedProducts
// ─────────────────────────────────────────────
describe('getFeaturedProducts', () => {
  it('retorna máximo `limit` productos', async () => {
    const fiveProducts = Array.from({ length: 5 }, (_, i) => ({
      ...mockProduct,
      id: i + 1,
      slug: `product-${i + 1}`,
      featured: true,
    }))

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: fiveProducts, error: null }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const products = await getFeaturedProducts(3)
    expect(products).toHaveLength(3)
  })

  it('usa limit = 3 por defecto', async () => {
    const tenProducts = Array.from({ length: 10 }, (_, i) => ({
      ...mockProduct, id: i + 1, slug: `p-${i + 1}`,
    }))

    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: tenProducts, error: null }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const products = await getFeaturedProducts()
    expect(products).toHaveLength(3)
  })
})
