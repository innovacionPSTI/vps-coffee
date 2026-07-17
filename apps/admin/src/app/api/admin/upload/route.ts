import { createServerClient } from '@vps/database'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const bucket = (formData.get('bucket') as string) ?? 'products'

  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Tipo de archivo no permitido. Usa JPG, PNG o WebP.' }, { status: 400 })
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: 'El archivo excede 5 MB' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const supabase = createServerClient()

  // Ensure bucket exists (creates it if missing)
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some((b) => b.name === bucket)
  if (!exists) {
    const { error: createErr } = await supabase.storage.createBucket(bucket, { public: true })
    if (createErr) return NextResponse.json({ error: `No se pudo crear el bucket: ${createErr.message}` }, { status: 500 })
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename)

  // Registrar en media_assets si se solicitó (ej: desde la media library)
  const register = formData.get('register') === 'true'
  if (register) {
    const altText  = (formData.get('alt_text') as string | null) ?? ''
    const assetKey = `${bucket}/${filename}`
    await supabase.from('media_assets').insert({
      key:       assetKey,
      url:       publicUrl,
      bucket,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text:  altText || null,
      used_in:   [],
    }).select().single()
    // Ignoramos el error — si falla el registro, el upload sigue siendo válido
  }

  return NextResponse.json({ url: publicUrl, filename })
}

export async function DELETE(req: NextRequest) {
  const { filename, bucket = 'products' } = await req.json()
  if (!filename) return NextResponse.json({ error: 'filename requerido' }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase.storage.from(bucket).remove([filename])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
