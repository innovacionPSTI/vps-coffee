import { NextRequest, NextResponse } from 'next/server'
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '@vps/database'
import { getAdminUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) return null
  if (user.role !== 'super_admin' && user.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const testimonials = await getTestimonials(false) // all, including inactive
  return NextResponse.json({ testimonials })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { author_name, author_role, content, avatar_url, rating, active, order_index } = body

  if (!author_name?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  if (!content?.trim()) return NextResponse.json({ error: 'Contenido requerido' }, { status: 400 })

  const testimonial = await createTestimonial({
    author_name: author_name.trim(),
    author_role: author_role?.trim() || null,
    content: content.trim(),
    avatar_url: avatar_url?.trim() || null,
    rating: rating ?? 5,
    active: active ?? true,
    order_index: order_index ?? 0,
  })

  return NextResponse.json({ testimonial }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  if (updates.author_name !== undefined) updates.author_name = updates.author_name.trim()
  if (updates.content !== undefined) updates.content = updates.content.trim()

  const testimonial = await updateTestimonial(id, updates)
  return NextResponse.json({ testimonial })
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  await deleteTestimonial(id)
  return NextResponse.json({ ok: true })
}
