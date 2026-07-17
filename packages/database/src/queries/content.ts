/**
 * queries/content.ts
 *
 * CRUD unificado para el sistema de contenido:
 *   pages → page_sections → section_items
 *
 * No contiene ningún dato específico de dominio (café u otro).
 * Los seeds del sitio concreto van en supabase/seeds/coffee_content.sql.
 */
import { createServerClient } from '../client'
import type { Json, Page, PageSection, SectionItem, PageWithSections } from '../types'

export type { Page, PageSection, SectionItem, PageWithSections }

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreatePageInput = {
  key: string
  label: string
  slug: string
  page_type?: string
  enabled?: boolean
  show_in_footer?: boolean
  meta_title?: string | null
  meta_description?: string | null
  order_index?: number
}

export type UpdatePageInput = Partial<Omit<CreatePageInput, 'key'>>

export type CreatePageSectionInput = {
  page_key: string
  section_type: string
  title?: string | null
  subtitle?: string | null
  body?: string | null
  image_url?: string | null
  cta_label?: string | null
  cta_url?: string | null
  enabled?: boolean
  order_index?: number
  settings?: Record<string, unknown>
}

export type UpdatePageSectionInput = Partial<Omit<CreatePageSectionInput, 'page_key'>>

export type CreateSectionItemInput = {
  section_id: number
  item_type?: string
  icon?: string | null
  title?: string | null
  description?: string | null
  question?: string | null
  answer?: string | null
  image_url?: string | null
  image_url_mobile?: string | null
  link_url?: string | null
  cta_text?: string | null
  metadata?: Record<string, unknown>
  enabled?: boolean
  order_index?: number
}

export type UpdateSectionItemInput = Partial<Omit<CreateSectionItemInput, 'section_id'>>

// ─── Pages ────────────────────────────────────────────────────────────────────

/** Todas las páginas ordenadas por order_index. */
export async function getPages(): Promise<Page[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('order_index')
  if (error) throw error
  return (data ?? []) as Page[]
}

/** Páginas habilitadas que aparecen en el footer. */
export async function getFooterPages(): Promise<Pick<Page, 'key' | 'label' | 'slug'>[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pages')
    .select('key, label, slug')
    .eq('enabled', true)
    .eq('show_in_footer', true)
    .order('order_index')
  if (error) throw error
  return (data ?? []) as Pick<Page, 'key' | 'label' | 'slug'>[]
}

/** Una página por su key. */
export async function getPage(key: string): Promise<Page | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('key', key)
    .maybeSingle()
  if (error) throw error
  return data as Page | null
}

/** Una página por su slug (para el renderizador de rutas dinámicas). */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('enabled', true)
    .maybeSingle()
  if (error) throw error
  return data as Page | null
}

/**
 * Página con todas sus secciones habilitadas y los ítems de cada sección.
 * Orden: secciones por order_index, ítems por order_index dentro de cada sección.
 */
export async function getPageWithSections(
  slug: string,
  onlyEnabled = true
): Promise<PageWithSections | null> {
  const supabase = createServerClient()

  // 1. Fetch page
  const pageQuery = supabase.from('pages').select('*').eq('slug', slug)
  if (onlyEnabled) pageQuery.eq('enabled', true)
  const { data: pageData, error: pageError } = await pageQuery.maybeSingle()
  if (pageError) throw pageError
  if (!pageData) return null

  const page = pageData as Page

  // 2. Fetch sections
  const sectionsQuery = supabase
    .from('page_sections')
    .select('*')
    .eq('page_key', page.key)
    .order('order_index')
  if (onlyEnabled) sectionsQuery.eq('enabled', true)
  const { data: sectionsData, error: sectionsError } = await sectionsQuery
  if (sectionsError) throw sectionsError
  const sections = (sectionsData ?? []) as PageSection[]

  if (sections.length === 0) return { ...page, sections: [] }

  // 3. Fetch items for all sections in one query
  const sectionIds = sections.map((s) => s.id)
  const itemsQuery = supabase
    .from('section_items')
    .select('*')
    .in('section_id', sectionIds)
    .order('order_index')
  if (onlyEnabled) itemsQuery.eq('enabled', true)
  const { data: itemsData, error: itemsError } = await itemsQuery
  if (itemsError) throw itemsError
  const items = (itemsData ?? []) as SectionItem[]

  // 4. Group items by section
  const itemsBySection = items.reduce<Record<number, SectionItem[]>>((acc, item) => {
    if (!acc[item.section_id]) acc[item.section_id] = []
    acc[item.section_id].push(item)
    return acc
  }, {})

  return {
    ...page,
    sections: sections.map((s) => ({
      ...s,
      items: itemsBySection[s.id] ?? [],
    })),
  }
}

/** Crea una página. */
export async function createPage(input: CreatePageInput): Promise<Page> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pages')
    .insert({ ...input, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data as Page
}

/** Actualiza campos de una página. */
export async function updatePage(key: string, input: UpdatePageInput): Promise<Page> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pages')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
    .single()
  if (error) throw error
  return data as Page
}

/** Elimina una página y sus secciones e ítems (CASCADE). */
export async function deletePage(key: string): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.from('pages').delete().eq('key', key)
  if (error) throw error
}

// ─── Page Sections ────────────────────────────────────────────────────────────

/** Secciones de una página. */
export async function getPageSections(
  pageKey: string,
  onlyEnabled = false
): Promise<PageSection[]> {
  const supabase = createServerClient()
  let query = supabase
    .from('page_sections')
    .select('*')
    .eq('page_key', pageKey)
    .order('order_index')
  if (onlyEnabled) query = query.eq('enabled', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as PageSection[]
}

/** Crea una sección dentro de una página. */
export async function createPageSection(input: CreatePageSectionInput): Promise<PageSection> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('page_sections')
    .insert({
      ...input,
      settings: (input.settings ?? {}) as unknown as Json,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data as PageSection
}

/** Actualiza una sección. */
export async function updatePageSection(
  id: number,
  input: UpdatePageSectionInput
): Promise<PageSection> {
  const supabase = createServerClient()
  const { settings: rawSettings, ...rest } = input
  const { data, error } = await supabase
    .from('page_sections')
    .update({
      ...rest,
      ...(rawSettings !== undefined && { settings: rawSettings as unknown as Json }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as PageSection
}

/** Elimina una sección (y sus ítems por CASCADE). */
export async function deletePageSection(id: number): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.from('page_sections').delete().eq('id', id)
  if (error) throw error
}

// ─── Section Items ────────────────────────────────────────────────────────────

/** Ítems de una sección. */
export async function getSectionItems(
  sectionId: number,
  onlyEnabled = false
): Promise<SectionItem[]> {
  const supabase = createServerClient()
  let query = supabase
    .from('section_items')
    .select('*')
    .eq('section_id', sectionId)
    .order('order_index')
  if (onlyEnabled) query = query.eq('enabled', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as SectionItem[]
}

/** Crea un ítem dentro de una sección. */
export async function createSectionItem(input: CreateSectionItemInput): Promise<SectionItem> {
  const supabase = createServerClient()
  const { metadata, ...rest } = input
  const { data, error } = await supabase
    .from('section_items')
    .insert({
      ...rest,
      ...(metadata !== undefined && { metadata: metadata as unknown as import('../types').Json }),
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data as SectionItem
}

/** Actualiza un ítem de sección. */
export async function updateSectionItem(
  id: number,
  input: UpdateSectionItemInput
): Promise<SectionItem> {
  const supabase = createServerClient()
  const { metadata, ...rest } = input
  const { data, error } = await supabase
    .from('section_items')
    .update({
      ...rest,
      ...(metadata !== undefined && { metadata: metadata as unknown as import('../types').Json }),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as SectionItem
}

/** Elimina un ítem de sección. */
export async function deleteSectionItem(id: number): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.from('section_items').delete().eq('id', id)
  if (error) throw error
}
