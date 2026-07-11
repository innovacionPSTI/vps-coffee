import { createServerClient } from '../client'
import type { ProductWithVariants } from '../types'

export async function getProducts(filters?: {
  roast?: string
  weight?: string
  brew_method?: string
  featured?: boolean
  category_slug?: string
}) {
  const supabase = createServerClient()
  let query = supabase
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*)
    `
    )
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (filters?.featured) query = query.eq('featured', true)
  if (filters?.category_slug) {
    query = query.eq('categories.slug', filters.category_slug)
  }

  const { data, error } = await query
  if (error) throw error
  return data as unknown as ProductWithVariants[]
}

export async function getProductBySlug(slug: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*)
    `
    )
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (error) throw error
  return data as unknown as ProductWithVariants
}

export async function getFeaturedProducts(limit = 3) {
  return getProducts({ featured: true })
    .then((products) => products.slice(0, limit))
}
