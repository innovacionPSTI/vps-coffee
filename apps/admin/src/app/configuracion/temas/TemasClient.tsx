'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Theme } from '@vps/database'

// ── Constantes ────────────────────────────────────────────────────────────────

const FONT_DISPLAY_OPTIONS = [
  { value: 'cormorant',    label: 'Cormorant Garamond', sample: 'Serif elegante' },
  { value: 'playfair',     label: 'Playfair Display',   sample: 'Display clásico' },
  { value: 'lora',         label: 'Lora',               sample: 'Serif literario' },
  { value: 'merriweather', label: 'Merriweather',       sample: 'Serif legible' },
]
const FONT_BODY_OPTIONS = [
  { value: 'dm-sans',    label: 'DM Sans',     sample: 'Sans moderno' },
  { value: 'inter',      label: 'Inter',       sample: 'Sans neutro' },
  { value: 'montserrat', label: 'Montserrat',  sample: 'Sans geométrico' },
  { value: 'nunito',     label: 'Nunito',      sample: 'Sans redondeado' },
]

const COLOR_FIELDS: { key: keyof ThemeFormData; label: string; description: string }[] = [
  { key: 'color_primary',     label: 'Primario',         description: 'Color principal de botones, encabezados y elementos de énfasis' },
  { key: 'color_dark',        label: 'Oscuro',           description: 'Variante oscura del primario para hover y fondos profundos' },
  { key: 'color_cream',       label: 'Crema',            description: 'Fondo principal del sitio' },
  { key: 'color_cream_warm',  label: 'Crema cálida',     description: 'Fondo alternativo para secciones' },
  { key: 'color_yellow',      label: 'Amarillo',         description: 'Acentos cálidos y tarjetas destacadas' },
  { key: 'color_yellow_pale', label: 'Amarillo pálido',  description: 'Fondos de secciones secundarias' },
  { key: 'color_text',        label: 'Texto',            description: 'Color base del cuerpo de texto' },
]

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ThemeFormData {
  name: string
  color_primary: string
  color_dark: string
  color_cream: string
  color_cream_warm: string
  color_yellow: string
  color_yellow_pale: string
  color_text: string
  font_display: string
  font_body: string
}

const DEFAULT_FORM: ThemeFormData = {
  name:              '',
  color_primary:     '#614A2A',
  color_dark:        '#604B30',
  color_cream:       '#FFF0D1',
  color_cream_warm:  '#FFF1D3',
  color_yellow:      '#FFF6B8',
  color_yellow_pale: '#FDF8B9',
  color_text:        '#2D1A0A',
  font_display:      'cormorant',
  font_body:         'dm-sans',
}

function themeToForm(t: Theme): ThemeFormData {
  return {
    name:              t.name,
    color_primary:     t.color_primary,
    color_dark:        t.color_dark,
    color_cream:       t.color_cream,
    color_cream_warm:  t.color_cream_warm,
    color_yellow:      t.color_yellow,
    color_yellow_pale: t.color_yellow_pale,
    color_text:        t.color_text,
    font_display:      t.font_display,
    font_body:         t.font_body,
  }
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

/** Mini preview que muestra cómo se verán los colores del tema */
function ThemePreview({ form }: { form: ThemeFormData }) {
  return (
    <div
      className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
      style={{ background: form.color_cream }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: form.color_primary }}
      >
        <span className="font-semibold text-sm" style={{ color: form.color_cream }}>
          Mi Tienda
        </span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full opacity-50" style={{ background: form.color_cream }} />
          <div className="w-2 h-2 rounded-full opacity-50" style={{ background: form.color_cream }} />
        </div>
      </div>
      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <div className="text-xs mb-1" style={{ color: form.color_text + '80' }}>Encabezado</div>
          <div className="text-lg font-bold leading-tight" style={{ color: form.color_primary }}>
            Nombre del Producto
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: form.color_text + '80' }}>Párrafo</div>
          <div className="text-xs leading-relaxed" style={{ color: form.color_text }}>
            Descripción del producto con sus principales características.
          </div>
        </div>
        {/* Botones */}
        <div className="flex gap-2 pt-1">
          <div
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: form.color_primary, color: form.color_cream }}
          >
            Comprar →
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{ borderColor: form.color_primary, color: form.color_primary, background: 'transparent' }}
          >
            Ver más
          </div>
        </div>
        {/* Paleta */}
        <div className="flex gap-1.5 pt-1">
          {[
            form.color_primary, form.color_dark, form.color_cream,
            form.color_yellow, form.color_text,
          ].map((c, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border border-black/10"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Card de un tema en la lista */
function ThemeCard({
  theme,
  onEdit,
  onActivate,
  onDelete,
  isPending,
}: {
  theme: Theme
  onEdit: (t: Theme) => void
  onActivate: (id: number) => void
  onDelete: (id: number) => void
  isPending: boolean
}) {
  const canDelete = !theme.is_active && !theme.is_default

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${
        theme.is_active
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Header de la card */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">{theme.name}</span>
            {theme.is_active && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                Activo
              </span>
            )}
            {theme.is_default && !theme.is_active && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                Por defecto
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {FONT_DISPLAY_OPTIONS.find(f => f.value === theme.font_display)?.label ?? theme.font_display}
            {' · '}
            {FONT_BODY_OPTIONS.find(f => f.value === theme.font_body)?.label ?? theme.font_body}
          </div>
        </div>
      </div>

      {/* Paleta de colores */}
      <div className="flex gap-1.5 mb-4">
        {[
          theme.color_primary, theme.color_dark, theme.color_cream,
          theme.color_yellow, theme.color_cream_warm, theme.color_text,
        ].map((color, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border border-black/10 flex-shrink-0"
            style={{ background: color }}
            title={color}
          />
        ))}
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(theme)}
          className="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Editar
        </button>
        {!theme.is_active && (
          <button
            onClick={() => onActivate(theme.id)}
            disabled={isPending}
            className="flex-1 py-1.5 text-xs font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            Activar
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onDelete(theme.id)}
            disabled={isPending}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar tema"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

/** Modal de crear/editar tema */
function ThemeModal({
  editing,
  form,
  setForm,
  onSave,
  onClose,
  isSaving,
}: {
  editing: Theme | null
  form: ThemeFormData
  setForm: (f: ThemeFormData) => void
  onSave: () => void
  onClose: () => void
  isSaving: boolean
}) {
  function update<K extends keyof ThemeFormData>(key: K, value: ThemeFormData[K]) {
    setForm({ ...form, [key]: value })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-semibold text-gray-900">
            {editing ? 'Editar tema' : 'Nuevo tema'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-3 space-y-5">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del tema</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ej: Temporada Navideña"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>

            {/* Colores */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Paleta de colores</div>
              <div className="space-y-2">
                {COLOR_FIELDS.map(({ key, label, description }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form[key] as string}
                      onChange={(e) => update(key, e.target.value)}
                      className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800">{label}</div>
                      <div className="text-xs text-gray-400 truncate">{description}</div>
                    </div>
                    <span className="text-xs font-mono text-gray-400">{(form[key] as string).toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tipografía */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Tipografía</div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Encabezados (display)</div>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_DISPLAY_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => update('font_display', f.value)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          form.font_display === f.value
                            ? 'border-brand-primary bg-brand-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-800">{f.label}</div>
                        <div className="text-xs text-gray-400">{f.sample}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Cuerpo de texto (body)</div>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_BODY_OPTIONS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => update('font_body', f.value)}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          form.font_body === f.value
                            ? 'border-brand-primary bg-brand-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-sm font-semibold text-gray-800">{f.label}</div>
                        <div className="text-xs text-gray-400">{f.sample}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Vista previa</div>
            <ThemePreview form={form} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !form.name.trim()}
            className="px-5 py-2 text-sm font-medium text-white bg-brand-primary rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear tema'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function TemasClient({ initialThemes }: { initialThemes: Theme[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Estado de lista
  const [themes, setThemes] = useState<Theme[]>(initialThemes)

  // Estado del modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null)
  const [form, setForm] = useState<ThemeFormData>(DEFAULT_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditingTheme(null)
    setForm(DEFAULT_FORM)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(theme: Theme) {
    setEditingTheme(theme)
    setForm(themeToForm(theme))
    setError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingTheme(null)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setIsSaving(true)
    setError(null)

    try {
      if (editingTheme) {
        // Actualizar
        const res = await fetch(`/api/admin/themes/${editingTheme.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const j = await res.json()
          throw new Error(j.error ?? 'Error al guardar')
        }
        const { theme } = await res.json()
        setThemes((prev) => prev.map((t) => (t.id === theme.id ? theme : t)))
      } else {
        // Crear
        const res = await fetch('/api/admin/themes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const j = await res.json()
          throw new Error(j.error ?? 'Error al crear')
        }
        const { theme } = await res.json()
        setThemes((prev) => [...prev, theme])
      }
      closeModal()
      startTransition(() => router.refresh())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleActivate(id: number) {
    startTransition(async () => {
      const res = await fetch(`/api/admin/themes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setActive: true }),
      })
      if (res.ok) {
        setThemes((prev) => prev.map((t) => ({ ...t, is_active: t.id === id })))
        router.refresh()
      }
    })
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este tema?')) return
    startTransition(async () => {
      const res = await fetch(`/api/admin/themes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setThemes((prev) => prev.filter((t) => t.id !== id))
      } else {
        const j = await res.json()
        alert(j.error ?? 'No se pudo eliminar')
      }
    })
  }

  return (
    <>
      {/* Barra de acción */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500">
          {themes.length} tema{themes.length !== 1 ? 's' : ''} configurado{themes.length !== 1 ? 's' : ''}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-primary text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-brand-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo tema
        </button>
      </div>

      {/* Grid de temas */}
      {themes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🎨</div>
          <div className="text-sm">No hay temas. Crea el primero.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              onEdit={openEdit}
              onActivate={handleActivate}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Nota informativa */}
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <strong>Nota:</strong> Los cambios de tema se reflejan en el sitio web en la próxima carga de página.
        El tema predeterminado no se puede eliminar.
      </div>

      {/* Modal crear/editar */}
      {modalOpen && (
        <ThemeModal
          editing={editingTheme}
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={closeModal}
          isSaving={isSaving}
        />
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm z-50">
          {error}
          <button onClick={() => setError(null)} className="ml-3 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}
    </>
  )
}
