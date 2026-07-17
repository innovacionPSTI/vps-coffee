/**
 * queries/home.ts
 *
 * Datos de la página Home consolidados en una sola función.
 * Tras la migración 19 (CMS unificado), el home se gestiona
 * íntegramente desde page_sections + section_items, igual que
 * el resto de páginas del sitio.
 *
 * Los datos "dinámicos" (productos, blog, categorías) se siguen
 * cargando en paralelo desde sus propios módulos.
 */

import { createServerClient } from '../client'
import { getFeaturedProducts, getBestSellingProducts, getCategories } from './products'
import { getBlogPosts } from './blog'
import type { PageSection, SectionItem } from '../types'
import type { BestSellingProduct } from './products'

export type HomeSection = PageSection & { items: SectionItem[] }

export interface WebHomeData {
  homeSections: HomeSection[]
  featuredProducts: Awaited<ReturnType<typeof getFeaturedProducts>>
  blogPosts:        Awaited<ReturnType<typeof getBlogPosts>>
  bestSellers:      BestSellingProduct[]
  categories:       Awaited<ReturnType<typeof getCategories>>
}

/**
 * Obtiene todos los datos necesarios para renderizar la página Home pública.
 * Las secciones del home (hero, services, historia, etc.) vienen de
 * page_sections + section_items con page_key = 'home'.
 * El resto de queries corre en paralelo — fallo individual no rompe el render.
 */
export async function getWebHomeData(): Promise<WebHomeData> {
  const supabase = createServerClient()

  async function fetchHomeSections(): Promise<HomeSection[]> {
    const { data: sections, error: sErr } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_key', 'home')
      .order('order_index')
    if (sErr || !sections?.length) return []

    const sectionIds = sections.map((s) => s.id)
    const { data: items } = await supabase
      .from('section_items')
      .select('*')
      .in('section_id', sectionIds)
      .eq('enabled', true)
      .order('order_index')

    const bySection = (items ?? []).reduce<Record<number, SectionItem[]>>((acc, item) => {
      if (!acc[item.section_id]) acc[item.section_id] = []
      acc[item.section_id].push(item as SectionItem)
      return acc
    }, {})

    return sections.map((s) => ({ ...s, items: bySection[s.id] ?? [] } as HomeSection))
  }

  const [homeSections, featuredProducts, blogPosts, bestSellers, categories] = await Promise.all([
    fetchHomeSections().catch(() => [] as HomeSection[]),
    getFeaturedProducts(3).catch(() => []),
    getBlogPosts({ limit: 2 }).catch(() => []),
    getBestSellingProducts(4).catch(() => [] as BestSellingProduct[]),
    getCategories().catch(() => []),
  ])

  return { homeSections, featuredProducts, blogPosts, bestSellers, categories }
}
