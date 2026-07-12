import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@vps/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title, slug, excerpt, content, cover_image,
      category, published, published_at, seo_title, seo_desc,
    } = body

    if (!title?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: 'title y slug son requeridos' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title:       title.trim(),
        slug:        slug.trim(),
        excerpt:     excerpt     ?? null,
        content:     content     ?? null,
        cover_image: cover_image ?? null,
        category:    category    ?? null,
        published:   published   ?? false,
        published_at: published_at ?? null,
        seo_title:   seo_title   ?? null,
        seo_desc:    seo_desc    ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[blog POST]', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya existe un artículo con ese slug' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[blog POST]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
