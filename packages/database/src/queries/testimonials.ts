import { createServerClient } from '../client'
import type { Testimonial } from '../types'

export type { Testimonial }

export type CreateTestimonialInput = {
  author_name: string
  author_role?: string | null
  content: string
  avatar_url?: string | null
  rating?: number
  active?: boolean
  order_index?: number
}

export type UpdateTestimonialInput = Partial<CreateTestimonialInput>

export async function getTestimonials(onlyActive = true): Promise<Testimonial[]> {
  const supabase = createServerClient()
  let query = supabase
    .from('testimonials')
    .select('*')
    .order('order_index', { ascending: true })
    .order('id', { ascending: true })

  if (onlyActive) query = query.eq('active', true)

  const { data, error } = await query
  if (error) throw error
  return data as Testimonial[]
}

export async function createTestimonial(input: CreateTestimonialInput): Promise<Testimonial> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('testimonials')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as Testimonial
}

export async function updateTestimonial(id: number, input: UpdateTestimonialInput): Promise<Testimonial> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('testimonials')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Testimonial
}

export async function deleteTestimonial(id: number): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.from('testimonials').delete().eq('id', id)
  if (error) throw error
}
