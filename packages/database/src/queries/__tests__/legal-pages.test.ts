/**
 * Unit tests — HU-049: páginas legales en el CMS
 *
 * Verifica que getPageBySlug y getPageWithSections devuelven
 * las páginas de privacidad y términos correctamente.
 * El cliente Supabase se mockea para aislar la lógica de query.
 */

jest.mock('../../client')

import { getPageBySlug, getPageWithSections } from '../content'
import { createServerClient } from '../../client'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// ── Fixtures ──────────────────────────────────────────────────────────────────

const privacidadPage = {
  key: 'privacidad',
  label: 'Política de privacidad',
  slug: 'privacidad',
  page_type: 'custom',
  enabled: true,
  show_in_footer: false,
  meta_title: null,
  meta_description: null,
  order_index: 90,
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
}

const privacidadSection = {
  id: 100,
  section_key: 'sec-priv-001',
  page_key: 'privacidad',
  section_type: 'text',
  title: 'Política de privacidad',
  subtitle: null,
  body: '## Política de privacidad\n\nContenido de prueba.',
  image_url: null,
  cta_label: null,
  cta_url: null,
  enabled: true,
  order_index: 1,
  settings: {},
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
}

function buildMock(pageData: object | null, sectionsData: object[] = [], itemsData: object[] = []) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fromFn = jest.fn((table: string): any => {
    // Determine the resolved value for awaiting the chain directly
    let resolvedValue: { data: object | object[] | null; error: null }
    if (table === 'pages') {
      resolvedValue = { data: pageData, error: null }
    } else if (table === 'page_sections') {
      resolvedValue = { data: sectionsData, error: null }
    } else if (table === 'section_items') {
      resolvedValue = { data: itemsData, error: null }
    } else {
      resolvedValue = { data: [], error: null }
    }

    // Build a thenable chain where every method returns `this`
    // and `maybeSingle()` wraps resolvedValue (pages use maybeSingle, sections await chain)
    const chain: Record<string, unknown> = {}
    const selfReturn = () => chain

    chain.select     = jest.fn(selfReturn)
    chain.eq         = jest.fn(selfReturn)
    chain.order      = jest.fn(selfReturn)
    chain.in         = jest.fn(selfReturn)
    chain.is         = jest.fn(selfReturn)
    chain.maybeSingle = jest.fn(() => Promise.resolve(resolvedValue))
    // Make the chain itself thenable so `await chain` works
    chain.then = (resolve: (v: unknown) => unknown) => Promise.resolve(resolvedValue).then(resolve)

    return chain
  })

  return { from: fromFn }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─────────────────────────────────────────────
// getPageBySlug
// ─────────────────────────────────────────────
describe('getPageBySlug (páginas legales)', () => {
  it('devuelve la página de privacidad por slug', async () => {
    mockCreateServerClient.mockReturnValue(
      buildMock(privacidadPage) as unknown as ReturnType<typeof createServerClient>
    )
    const page = await getPageBySlug('privacidad')
    expect(page).not.toBeNull()
    expect(page?.slug).toBe('privacidad')
    expect(page?.key).toBe('privacidad')
  })

  it('devuelve null para un slug que no existe', async () => {
    mockCreateServerClient.mockReturnValue(
      buildMock(null) as unknown as ReturnType<typeof createServerClient>
    )
    const page = await getPageBySlug('slug-inexistente')
    expect(page).toBeNull()
  })

  it('devuelve la página de términos por slug', async () => {
    const terminosPage = { ...privacidadPage, key: 'terminos', slug: 'terminos', label: 'Términos y condiciones', order_index: 91 }
    mockCreateServerClient.mockReturnValue(
      buildMock(terminosPage) as unknown as ReturnType<typeof createServerClient>
    )
    const page = await getPageBySlug('terminos')
    expect(page?.slug).toBe('terminos')
  })
})

// ─────────────────────────────────────────────
// getPageWithSections (incluyendo body de section)
// ─────────────────────────────────────────────
describe('getPageWithSections (páginas legales)', () => {
  it('devuelve la página con su sección de texto para privacidad', async () => {
    mockCreateServerClient.mockReturnValue(
      buildMock(privacidadPage, [privacidadSection]) as unknown as ReturnType<typeof createServerClient>
    )
    const result = await getPageWithSections('privacidad')
    expect(result).not.toBeNull()
    expect(result?.slug).toBe('privacidad')
    expect(result?.sections).toHaveLength(1)
    expect(result?.sections[0].section_type).toBe('text')
    expect(result?.sections[0].body).toContain('Política de privacidad')
  })

  it('la sección de texto tiene el body del seed', async () => {
    mockCreateServerClient.mockReturnValue(
      buildMock(privacidadPage, [privacidadSection]) as unknown as ReturnType<typeof createServerClient>
    )
    const result = await getPageWithSections('privacidad')
    const textSection = result?.sections.find((s) => s.section_type === 'text')
    expect(textSection?.body).toBeTruthy()
    expect(typeof textSection?.body).toBe('string')
  })

  it('devuelve null si la página no existe o está deshabilitada', async () => {
    mockCreateServerClient.mockReturnValue(
      buildMock(null) as unknown as ReturnType<typeof createServerClient>
    )
    const result = await getPageWithSections('pagina-inexistente')
    expect(result).toBeNull()
  })

  it('devuelve sections vacío si la página existe pero no tiene secciones', async () => {
    mockCreateServerClient.mockReturnValue(
      buildMock(privacidadPage, []) as unknown as ReturnType<typeof createServerClient>
    )
    const result = await getPageWithSections('privacidad')
    expect(result?.sections).toEqual([])
  })
})
