import { createServerClient } from '../client'
import type { Page, PageItem } from '../types'

export type { Page, PageItem }

export type UpdatePageInput = Partial<
  Omit<Page, 'key' | 'slug' | 'created_at' | 'updated_at'>
>

export type UpsertPageItemInput = Omit<PageItem, 'id' | 'created_at'>
export type CreatePageItemInput = UpsertPageItemInput

/** Devuelve todas las páginas ordenadas por order_index. */
export async function getPages(): Promise<Page[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('order_index')
  if (error) throw error
  return (data ?? []) as Page[]
}

/** Devuelve las páginas visibles en el footer. */
export async function getFooterPages(): Promise<Page[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pages')
    .select('key, label, slug, enabled, show_in_footer, order_index')
    .eq('enabled', true)
    .eq('show_in_footer', true)
    .order('order_index')
  if (error) throw error
  return (data ?? []) as Page[]
}

/** Devuelve una página por su key. */
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

/** Devuelve los ítems de una página, filtrando opcionalmente por item_type. */
export async function getPageItems(
  pageKey: string,
  itemType?: string,
  onlyEnabled = true
): Promise<PageItem[]> {
  const supabase = createServerClient()
  let query = supabase
    .from('page_items')
    .select('*')
    .eq('page_key', pageKey)
    .order('order_index')

  if (itemType) query = query.eq('item_type', itemType)
  if (onlyEnabled) query = query.eq('enabled', true)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as PageItem[]
}

/** Crea un ítem en una página. */
export async function createPageItem(input: CreatePageItemInput): Promise<PageItem> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('page_items')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as PageItem
}

/** Actualiza un ítem de página. */
export async function updatePageItem(
  id: number,
  input: Partial<UpsertPageItemInput>
): Promise<PageItem> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('page_items')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as PageItem
}

/** Elimina un ítem de página. */
export async function deletePageItem(id: number): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.from('page_items').delete().eq('id', id)
  if (error) throw error
}
