/**
 * Unit tests — packages/database/src/queries/home.ts
 *
 * Verifica que getWebHomeData() consolida las queries paralelas
 * y devuelve el shape correcto, con fail-open por query.
 *
 * Tras migración 19 (CMS unificado), el home usa page_sections +
 * section_items en lugar de banners + section_settings legacy.
 */

// @jest-environment node

jest.mock('../../client')
jest.mock('../products')
jest.mock('../blog')

import { getWebHomeData } from '../home'
import { getFeaturedProducts, getBestSellingProducts, getCategories } from '../products'
import { getBlogPosts } from '../blog'
import { createServerClient } from '../../client'

const mockGetFeaturedProducts    = getFeaturedProducts    as jest.MockedFunction<typeof getFeaturedProducts>
const mockGetBestSellingProducts = getBestSellingProducts as jest.MockedFunction<typeof getBestSellingProducts>
const mockGetCategories          = getCategories          as jest.MockedFunction<typeof getCategories>
const mockGetBlogPosts           = getBlogPosts           as jest.MockedFunction<typeof getBlogPosts>
const mockCreateServerClient     = createServerClient     as jest.MockedFunction<typeof createServerClient>

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeSection = {
  id: 1, page_key: 'home', section_type: 'hero', title: 'Hero', enabled: true, order_index: 0,
  subtitle: null, image_url: null, cta_label: null, cta_url: null, settings: {},
  section_key: 'abc', created_at: '2024-01-01',
}
const fakeItem = {
  id: 10, section_id: 1, item_type: 'slide', title: 'Slide 1', enabled: true, order_index: 0,
  description: null, icon: null, question: null, answer: null, image_url: null,
  image_url_mobile: null, link_url: null, cta_text: null, metadata: {}, created_at: '2024-01-01',
}
const fakeProduct    = { product_id: 10, product_name: 'Café', price: 30000 } as any
const fakeBestSeller = { product_id: 11, product_name: 'Espresso', price: 25000 } as any
const fakePost       = { id: 5, title: 'Blog post', slug: 'blog-post' } as any
const fakeCategory   = { id: 3, name: 'Café', slug: 'cafe' } as any

// Supabase mock that returns home sections + items
function makeSupabaseMock(
  sectionsData: unknown[] = [fakeSection],
  itemsData: unknown[] = [fakeItem]
) {
  const selectChain = (data: unknown[]) => ({
    select: jest.fn().mockReturnThis(),
    eq:     jest.fn().mockReturnThis(),
    in:     jest.fn().mockReturnThis(),
    order:  jest.fn().mockResolvedValue({ data, error: null }),
  })
  return {
    from: jest.fn((table: string) =>
      table === 'page_sections' ? selectChain(sectionsData) : selectChain(itemsData)
    ),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetFeaturedProducts.mockResolvedValue([fakeProduct])
  mockGetBestSellingProducts.mockResolvedValue([fakeBestSeller])
  mockGetBlogPosts.mockResolvedValue([fakePost])
  mockGetCategories.mockResolvedValue([fakeCategory])
  mockCreateServerClient.mockReturnValue(makeSupabaseMock() as any)
})

// ─────────────────────────────────────────────
// Shape y datos
// ─────────────────────────────────────────────
describe('getWebHomeData()', () => {
  it('devuelve las 5 propiedades esperadas', async () => {
    const data = await getWebHomeData()
    expect(data).toHaveProperty('homeSections')
    expect(data).toHaveProperty('featuredProducts')
    expect(data).toHaveProperty('blogPosts')
    expect(data).toHaveProperty('bestSellers')
    expect(data).toHaveProperty('categories')
  })

  it('las secciones incluyen sus items anidados', async () => {
    const data = await getWebHomeData()
    expect(data.homeSections).toHaveLength(1)
    expect(data.homeSections[0].section_type).toBe('hero')
    expect(data.homeSections[0].items).toHaveLength(1)
    expect(data.homeSections[0].items[0].id).toBe(10)
  })

  it('datos dinámicos corresponden a los mocks', async () => {
    const data = await getWebHomeData()
    expect(data.featuredProducts).toEqual([fakeProduct])
    expect(data.blogPosts).toEqual([fakePost])
    expect(data.bestSellers).toEqual([fakeBestSeller])
    expect(data.categories).toEqual([fakeCategory])
  })

  it('sección sin items devuelve items = []', async () => {
    mockCreateServerClient.mockReturnValue(makeSupabaseMock([fakeSection], []) as any)
    const data = await getWebHomeData()
    expect(data.homeSections[0].items).toEqual([])
  })
})

// ─────────────────────────────────────────────
// Fail-open (query individual falla → valor vacío)
// ─────────────────────────────────────────────
describe('getWebHomeData() — fail-open por query', () => {
  it('devuelve [] en homeSections si la query de page_sections falla', async () => {
    mockCreateServerClient.mockReturnValue(makeSupabaseMock([], []) as any)
    const data = await getWebHomeData()
    expect(data.homeSections).toEqual([])
    // Resto sigue
    expect(data.featuredProducts).toEqual([fakeProduct])
  })

  it('devuelve [] en featuredProducts si getFeaturedProducts lanza error', async () => {
    mockGetFeaturedProducts.mockRejectedValue(new Error('DB error'))
    const data = await getWebHomeData()
    expect(data.featuredProducts).toEqual([])
    expect(data.homeSections).toHaveLength(1)
  })

  it('devuelve [] en blogPosts si getBlogPosts lanza error', async () => {
    mockGetBlogPosts.mockRejectedValue(new Error('timeout'))
    const data = await getWebHomeData()
    expect(data.blogPosts).toEqual([])
  })

  it('devuelve [] en bestSellers si getBestSellingProducts lanza error', async () => {
    mockGetBestSellingProducts.mockRejectedValue(new Error('timeout'))
    const data = await getWebHomeData()
    expect(data.bestSellers).toEqual([])
  })

  it('devuelve [] en categories si getCategories lanza error', async () => {
    mockGetCategories.mockRejectedValue(new Error('timeout'))
    const data = await getWebHomeData()
    expect(data.categories).toEqual([])
  })

  it('cuando todas las queries dinámicas fallan, no lanza error', async () => {
    mockGetFeaturedProducts.mockRejectedValue(new Error('fail'))
    mockGetBestSellingProducts.mockRejectedValue(new Error('fail'))
    mockGetBlogPosts.mockRejectedValue(new Error('fail'))
    mockGetCategories.mockRejectedValue(new Error('fail'))

    const data = await getWebHomeData()
    expect(data.featuredProducts).toEqual([])
    expect(data.blogPosts).toEqual([])
    expect(data.bestSellers).toEqual([])
    expect(data.categories).toEqual([])
    expect(data.homeSections).toHaveLength(1) // DB mock still works
  })
})
