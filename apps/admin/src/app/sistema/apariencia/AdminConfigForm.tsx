'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminConfig } from '@vps/database'

interface Props {
  initialConfig: AdminConfig
}

const ACCENT_PRESETS = [
  { label: 'Indigo',    hex: '#4F46E5' },
  { label: 'Violeta',   hex: '#7C3AED' },
  { label: 'Azul',      hex: '#2563EB' },
  { label: 'Teal',      hex: '#0D9488' },
  { label: 'Esmeralda', hex: '#059669' },
  { label: 'Rosa',      hex: '#DB2777' },
  { label: 'Naranja',   hex: '#EA580C' },
]

const SIDEBAR_PRESETS = [
  { label: 'Slate 900', hex: '#0F172A' },
  { label: 'Slate 800', hex: '#1E293B' },
  { label: 'Zinc 900',  hex: '#18181B' },
  { label: 'Neutral',   hex: '#171717' },
  { label: 'Stone',     hex: '#1C1917' },
  { label: 'Blanco',    hex: '#FFFFFF' },
]

export default function AdminConfigForm({ initialConfig }: Props) {
  const router = useRouter()
  const [accentColor, setAccentColor]   = useState(initialConfig.accent_color)
  const [sidebarColor, setSidebarColor] = useState(initialConfig.sidebar_color)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/sistema', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accent_color: accentColor, sidebar_color: sidebarColor }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaved(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-8">

      {/* Color de acento */}
      <section>
        <p className="font-brand text-xs font-semibold text-brand-primary mb-1">Color de acento</p>
        <p className="font-brand text-xs text-brand-primary/40 mb-4">
          Usado en botones, enlaces activos y elementos destacados.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.hex}
              title={p.label}
              onClick={() => setAccentColor(p.hex)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                accentColor === p.hex ? 'border-gray-900 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: p.hex }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            className="font-brand text-sm border border-gray-200 rounded-lg px-3 py-2 w-32 focus:outline-none focus:border-brand-primary"
            placeholder="#4F46E5"
          />
          <span className="font-brand text-xs text-brand-primary/40">Hex</span>
        </div>
      </section>

      {/* Color del sidebar */}
      <section className="border-t border-gray-100 pt-6">
        <p className="font-brand text-xs font-semibold text-brand-primary mb-1">Color del sidebar</p>
        <p className="font-brand text-xs text-brand-primary/40 mb-4">
          Fondo del menú lateral de navegación.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {SIDEBAR_PRESETS.map((p) => (
            <button
              key={p.hex}
              title={p.label}
              onClick={() => setSidebarColor(p.hex)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                sidebarColor === p.hex ? 'border-gray-900 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: p.hex }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={sidebarColor}
            onChange={(e) => setSidebarColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={sidebarColor}
            onChange={(e) => setSidebarColor(e.target.value)}
            className="font-brand text-sm border border-gray-200 rounded-lg px-3 py-2 w-32 focus:outline-none focus:border-brand-primary"
            placeholder="#0F172A"
          />
          <span className="font-brand text-xs text-brand-primary/40">Hex</span>
        </div>
      </section>

      {/* Vista previa */}
      <section className="border-t border-gray-100 pt-6">
        <p className="font-brand text-xs font-semibold text-brand-primary mb-3">Vista previa</p>
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ backgroundColor: sidebarColor }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: accentColor }}
          >
            ▲
          </div>
          <span className="text-white/80 text-sm font-medium">Admin Panel</span>
          <div
            className="ml-auto px-3 py-1.5 rounded-lg text-white text-xs font-semibold"
            style={{ backgroundColor: accentColor }}
          >
            Botón
          </div>
        </div>
      </section>

      {/* Acciones */}
      <div className="border-t border-gray-100 pt-5 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-brand text-sm font-semibold bg-brand-primary text-white px-5 py-2.5 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {saved && (
          <p className="font-brand text-sm text-emerald-600">
            ✓ Guardado. Recarga la página para ver los nuevos colores.
          </p>
        )}
        {error && <p className="font-brand text-sm text-red-500">{error}</p>}
      </div>
    </div>
  )
}
