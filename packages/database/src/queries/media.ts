import { createServerClient } from '../client'
import type { MediaAsset } from '../types'

export type { MediaAsset }

/** Lista todos los assets ordenados por fecha de subida (más reciente primero). */
export async function getMediaAssets(opts?: { mimeType?: string; limit?: number }): Promise<MediaAsset[]> {
  const supabase = createServerClient()
  let query = supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (opts?.mimeType) query = query.eq('mime_type', opts.mimeType)
  if (opts?.limit)    query = query.limit(opts.limit)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as MediaAsset[]
}

export interface CreateMediaAssetInput {
  key: string
  url: string
  bucket?: string
  mime_type?: string
  size_bytes?: number
  width_px?: number
  height_px?: number
  alt_text?: string
  uploaded_by?: string
}

/** Inserta un nuevo asset en la tabla media_assets. */
export async function createMediaAsset(input: CreateMediaAssetInput): Promise<MediaAsset> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      key:          input.key,
      url:          input.url,
      bucket:       input.bucket ?? 'public',
      mime_type:    input.mime_type,
      size_bytes:   input.size_bytes,
      width_px:     input.width_px,
      height_px:    input.height_px,
      alt_text:     input.alt_text,
      uploaded_by:  input.uploaded_by,
      used_in:      [],
    })
    .select()
    .single()

  if (error) throw error
  return data as MediaAsset
}

/** Elimina un asset por su key. */
export async function deleteMediaAsset(key: string): Promise<void> {
  const supabase = createServerClient()
  const { error } = await supabase.from('media_assets').delete().eq('key', key)
  if (error) throw error
}

/** Actualiza el alt_text de un asset. */
export async function updateMediaAssetAlt(key: string, altText: string): Promise<MediaAsset> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('media_assets')
    .update({ alt_text: altText, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
    .single()

  if (error) throw error
  return data as MediaAsset
}
