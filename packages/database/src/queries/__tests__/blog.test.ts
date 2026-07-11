/**
 * Unit tests for blog query helpers.
 */

import { getBlogPosts, getBlogPostBySlug, getFeaturedPost } from '../blog'
import { createServerClient } from '../../client'

jest.mock('../../client')
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

const mockPost = {
  id: 1,
  slug: 'guia-catacion-cafe',
  title: 'Guía de catación de café',
  category: 'Cultura',
  published: true,
  published_at: '2026-06-01T00:00:00Z',
  excerpt: 'Aprende a catar café como un profesional.',
  content: '<p>Contenido completo...</p>',
  cover_image: '/blog/catacion.jpg',
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// getBlogPosts
// ─────────────────────────────────────────────
describe('getBlogPosts', () => {
  it('retorna posts publicados ordenados por fecha descendente', async () => {
    const posts = [
      { ...mockPost, id: 2, slug: 'post-nuevo', published_at: '2026-07-01T00:00:00Z' },
      { ...mockPost, id: 1, slug: 'guia-catacion-cafe', published_at: '2026-06-01T00:00:00Z' },
    ]
    const orderMock = jest.fn().mockResolvedValue({ data: posts, error: null })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ order: orderMock }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const result = await getBlogPosts()
    expect(result).toHaveLength(2)
    expect(orderMock).toHaveBeenCalledWith('published_at', { ascending: false })
  })

  it('filtra por categoría cuando se proporciona', async () => {
    const categoryEqMock = jest.fn().mockResolvedValue({ data: [mockPost], error: null })
    const limitMock = jest.fn().mockReturnValue({ then: undefined })
    const orderMock = jest.fn().mockReturnValue({ eq: categoryEqMock, limit: limitMock })
    const publishedEqMock = jest.fn().mockReturnValue({ order: orderMock })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: publishedEqMock }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await getBlogPosts({ category: 'Cultura' })
    expect(categoryEqMock).toHaveBeenCalledWith('category', 'Cultura')
  })

  it('aplica limit cuando se proporciona', async () => {
    const limitMock = jest.fn().mockResolvedValue({ data: [mockPost], error: null })
    const orderMock = jest.fn().mockReturnValue({ limit: limitMock })
    const publishedEqMock = jest.fn().mockReturnValue({ order: orderMock })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: publishedEqMock }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await getBlogPosts({ limit: 5 })
    expect(limitMock).toHaveBeenCalledWith(5)
  })

  it('lanza error si Supabase falla', async () => {
    const orderMock = jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ order: orderMock }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await expect(getBlogPosts()).rejects.toThrow('DB error')
  })
})

// ─────────────────────────────────────────────
// getBlogPostBySlug
// ─────────────────────────────────────────────
describe('getBlogPostBySlug', () => {
  it('retorna el post con el slug indicado', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: mockPost, error: null })
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

    const post = await getBlogPostBySlug('guia-catacion-cafe')
    expect(post.slug).toBe('guia-catacion-cafe')
  })

  it('lanza error si el post no existe', async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Row not found' },
    })
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

    await expect(getBlogPostBySlug('no-existe')).rejects.toMatchObject({ code: 'PGRST116' })
  })
})

// ─────────────────────────────────────────────
// getFeaturedPost
// ─────────────────────────────────────────────
describe('getFeaturedPost', () => {
  it('retorna el post más reciente publicado', async () => {
    const singleMock = jest.fn().mockResolvedValue({ data: mockPost, error: null })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({ single: singleMock }),
            }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const post = await getFeaturedPost()
    expect(post?.slug).toBe('guia-catacion-cafe')
  })

  it('retorna null si no hay posts publicados (no lanza)', async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Row not found' },
    })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({ single: singleMock }),
            }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const post = await getFeaturedPost()
    expect(post).toBeNull()
  })
})
