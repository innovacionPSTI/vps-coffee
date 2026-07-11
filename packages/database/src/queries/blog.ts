import { createServerClient } from '../client'
import type { BlogPost } from '../types'

export async function getBlogPosts(options?: { category?: string; limit?: number }) {
  const supabase = createServerClient()
  let query = supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (options?.category) query = query.eq('category', options.category)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error
  return data as BlogPost[]
}

export async function getBlogPostBySlug(slug: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) throw error
  return data as BlogPost
}

export async function getFeaturedPost() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data as BlogPost
}
