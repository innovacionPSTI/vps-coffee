'use client'

import { useState, useRef, useCallback } from 'react'
import type { MediaAsset } from '@vps/database'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface Props {
  initialAssets: MediaAsset[]
  /** Modo picker: al seleccionar un asset se llama onSelect en vez de copiar URL */
  pickerMode?: boolean
  onSelect?: (url: string) => void
  onClose?: () => void
}

type Filter = 'all' | 'image'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(mimeType: string | null): boolean {
  return !!mimeType?.startsWith('image/')
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function MediaClient({ initialAssets, pickerMode = false, onSelect, onClose }: Props) {
  const [assets, setAssets] = useState<MediaAsset[]>(initialAssets)
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<MediaAsset | null>(null)
  const [editingAlt, setEditingAlt] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  // ── Filtro ────────────────────────────────────────────────────────────────

  const filtered = assets.filter((a) => {
    if (filter === 'image') return isImage(a.mime_type)
    return true
  })

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('bucket', 'media')
        fd.append('register', 'true')
        fd.append('alt_text', '')

        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Error al subir')
      }

      // Recargar lista
      const listRes = await fetch('/api/admin/media')
      const listJson = await listRes.json()
      setAssets(listJson.assets ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al subir el archivo')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [])

  // ── Eliminar ──────────────────────────────────────────────────────────────

  async function handleDelete(asset: MediaAsset) {
    if (!confirm(`¿Eliminar "${asset.key}"? Esta acción no se puede deshacer.`)) return
    setError(null)

    try {
      // Eliminar del storage
      const filename = asset.key.split('/').pop() ?? asset.key
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, bucket: asset.bucket }),
      })

      // Eliminar del registro
      await fetch(`/api/admin/media?key=${encodeURIComponent(asset.key)}`, { method: 'DELETE' })

      setAssets((prev) => prev.filter((a) => a.key !== asset.key))
      if (selected?.key === asset.key) setSelected(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  // ── Guardar alt ───────────────────────────────────────────────────────────

  async function saveAlt() {
    if (!selected) return
    setError(null)

    try {
      const res = await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: selected.key, alt_text: editingAlt }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const updated = await res.json() as MediaAsset
      setAssets((prev) => prev.map((a) => (a.key === updated.key ? updated : a)))
      setSelected(updated)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  // ── Copiar URL ────────────────────────────────────────────────────────────

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(url)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* fallback */ }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={pickerMode ? 'flex flex-col h-full' : 'space-y-4'}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Filtros */}
          {(['all', 'image'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-brand font-semibold transition-colors ${
                filter === f
                  ? 'bg-brand-primary text-brand-cream'
                  : 'bg-gray-100 text-brand-primary/60 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Todos' : 'Imágenes'}
            </button>
          ))}
          <span className="text-xs text-brand-primary/30 font-brand">{filtered.length} archivos</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón subir */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-brand-primary text-brand-cream text-sm font-brand font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {uploading ? 'Subiendo…' : '+ Subir'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />

          {/* Cerrar picker */}
          {pickerMode && onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-brand text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Área principal: grid + panel lateral */}
      <div className="flex gap-4">
        {/* Grid de assets */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div
              className="border-2 border-dashed border-gray-200 rounded-2xl py-20 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand-primary/30 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <span className="text-4xl">🖼️</span>
              <p className="text-sm text-gray-400 font-brand">No hay archivos. Haz clic para subir.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((asset) => (
                <button
                  key={asset.key}
                  onClick={() => {
                    if (pickerMode && onSelect) {
                      onSelect(asset.url)
                    } else {
                      setSelected(asset)
                      setEditingAlt(asset.alt_text ?? '')
                    }
                  }}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selected?.key === asset.key
                      ? 'border-brand-primary shadow-md'
                      : 'border-transparent hover:border-brand-primary/30'
                  }`}
                >
                  {isImage(asset.mime_type) ? (
                    <img
                      src={asset.url}
                      alt={asset.alt_text ?? asset.key}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl">📄</span>
                    </div>
                  )}

                  {/* Overlay con nombre */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] font-brand truncate leading-tight">
                      {asset.key.split('/').pop()}
                    </p>
                  </div>

                  {/* Check si está seleccionado */}
                  {selected?.key === asset.key && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center shadow">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panel lateral — detalle del asset seleccionado */}
        {selected && !pickerMode && (
          <div className="w-64 flex-shrink-0 bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-4">
            {/* Previsualización */}
            {isImage(selected.mime_type) ? (
              <img
                src={selected.url}
                alt={selected.alt_text ?? selected.key}
                className="w-full aspect-video object-contain rounded-xl bg-white border border-gray-100"
              />
            ) : (
              <div className="w-full aspect-video rounded-xl bg-white border border-gray-100 flex items-center justify-center text-3xl">
                📄
              </div>
            )}

            {/* Info */}
            <div className="space-y-1">
              <p className="font-brand text-xs font-semibold text-brand-primary break-all">
                {selected.key.split('/').pop()}
              </p>
              <p className="font-brand text-xs text-brand-primary/40">
                {selected.mime_type} · {formatBytes(selected.size_bytes)}
              </p>
              {selected.width_px && selected.height_px && (
                <p className="font-brand text-xs text-brand-primary/40">
                  {selected.width_px} × {selected.height_px} px
                </p>
              )}
              <p className="font-brand text-xs text-brand-primary/30">
                {new Date(selected.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Alt text */}
            <div>
              <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
                Alt text
              </label>
              <input
                type="text"
                value={editingAlt}
                onChange={(e) => setEditingAlt(e.target.value)}
                placeholder="Descripción de la imagen"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-brand focus:outline-none focus:border-brand-primary"
              />
              <button
                onClick={saveAlt}
                className="mt-2 w-full text-xs font-brand font-semibold bg-brand-primary text-brand-cream rounded-lg py-1.5 hover:bg-brand-dark transition-colors"
              >
                Guardar alt
              </button>
            </div>

            {/* Acciones */}
            <div className="space-y-2">
              <button
                onClick={() => copyUrl(selected.url)}
                className="w-full text-xs font-brand bg-gray-100 text-brand-primary rounded-lg py-2 hover:bg-gray-200 transition-colors"
              >
                {copied === selected.url ? '¡Copiado!' : 'Copiar URL'}
              </button>
              <button
                onClick={() => handleDelete(selected)}
                className="w-full text-xs font-brand text-red-500 rounded-lg py-2 hover:bg-red-50 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Acción picker: usar selección */}
      {pickerMode && selected && onSelect && (
        <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
          <img src={selected.url} alt="" className="w-10 h-10 rounded-lg object-cover" />
          <p className="flex-1 text-xs font-brand text-brand-primary truncate">{selected.url}</p>
          <button
            onClick={() => onSelect(selected.url)}
            className="px-4 py-2 rounded-xl bg-brand-primary text-brand-cream text-sm font-brand font-semibold hover:bg-brand-dark transition-colors"
          >
            Usar imagen
          </button>
        </div>
      )}
    </div>
  )
}
