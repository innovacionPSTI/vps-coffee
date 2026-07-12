import { createServerClient } from '../client'

export interface SectionSetting {
  key: string
  label: string
  description: string | null
  enabled: boolean
  order_index: number
}

/** Devuelve todas las secciones ordenadas por order_index. */
export async function getSectionSettings(): Promise<SectionSetting[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('section_settings')
    .select('key, label, description, enabled, order_index')
    .order('order_index')
  if (error) throw error
  return (data ?? []) as SectionSetting[]
}

/**
 * Verifica si una sección específica está habilitada.
 * Devuelve true si la sección no existe (fail-open, para no romper el sitio
 * si la migración aún no se ha ejecutado).
 */
export async function isSectionEnabled(key: string): Promise<boolean> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('section_settings')
      .select('enabled')
      .eq('key', key)
      .maybeSingle()
    return data?.enabled ?? true
  } catch {
    return true
  }
}
