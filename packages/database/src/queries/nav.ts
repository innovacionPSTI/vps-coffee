import { createServerClient } from '../client'
import type { NavItem } from '../types'

export type { NavItem }

/** Ítem de nav con sus hijos (para renderizar dropdowns) */
export type NavItemWithChildren = NavItem & {
  children: NavItem[]
}

export type CreateNavItemInput = {
  label: string
  href?: string | null
  page_key?: string | null
  enabled?: boolean
  order_index?: number
  parent_id?: number | null
}

export type UpdateNavItemInput = Partial<CreateNavItemInput>

/**
 * Devuelve todos los ítems de nav habilitados como árbol:
 * - Top-level items (parent_id IS NULL) en orden
 * - Cada ítem top-level tiene children[] con sus hijos en orden
 * Solo incluye ítems enabled = true.
 */
export async function getNavTree(): Promise<NavItemWithChildren[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('nav_items')
    .select('*')
    .eq('enabled', true)
    .order('order_index')

  if (error) throw error
  const items = (data ?? []) as NavItem[]

  // Construir árbol: primero top-level, luego asignar hijos
  const topLevel = items.filter((i) => i.parent_id === null)
  return topLevel.map((parent) => ({
    ...parent,
    children: items.filter((i) => i.parent_id === parent.id),
  }))
}

/**
 * Devuelve TODOS los ítems (habilitados y deshabilitados) para el admin.
 * Retorna como árbol para facilitar la gestión.
 */
export async function getAllNavItems(): Promise<NavItemWithChildren[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('nav_items')
    .select('*')
    .order('order_index')

  if (error) throw error
  const items = (data ?? []) as NavItem[]

  const topLevel = items.filter((i) => i.parent_id === null)
  return topLevel.map((parent) => ({
    ...parent,
    children: items.filter((i) => i.parent_id === parent.id),
  }))
}

/** Crea un ítem de nav. */
export async function createNavItem(input: CreateNavItemInput): Promise<NavItem> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('nav_items')
    .insert({ ...input, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data as NavItem
}

/** Actualiza un ítem de nav. */
export async function updateNavItem(id: number, input: UpdateNavItemInput): Promise<NavItem> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('nav_items')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as NavItem
}

/** Elimina un ítem de nav (y sus hijos por CASCADE). */
export async function deleteNavItem(id: number): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.from('nav_items').delete().eq('id', id)
  if (error) throw error
}
