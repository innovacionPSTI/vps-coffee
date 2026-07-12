'use client'

import { useState } from 'react'
import type { Testimonial } from '@vps/database'

const STARS = [1, 2, 3, 4, 5]

const EMPTY: Partial<Testimonial> = {
  author_name: '',
  author_role: '',
  content: '',
  avatar_url: '',
  rating: 5,
  active: true,
  order_index: 0,
}

interface Props {
  initialTestimonials: Testimonial[]
}

export default function TestimoniosClient({ initialTestimonials }: Props) {
  const [items, setItems] = useState<Testimonial[]>(initialTestimonials)
  const [form, setForm] = useState<Partial<Testimonial>>(EMPTY)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openNew() {
    setForm(EMPTY)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  function openEdit(t: Testimonial) {
    setForm({ ...t })
    setEditingId(t.id)
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.author_name?.trim()) { setError('El nombre es requerido'); return }
    if (!form.content?.trim()) { setError('El testimonio es requerido'); return }

    setSaving(true)
    setError('')
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? { id: editingId, ...form } : form
      const res = await fetch('/api/admin/testimonios', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error guardando'); return }

      if (editingId) {
        setItems((prev) => prev.map((t) => t.id === editingId ? data.testimonial : t))
      } else {
        setItems((prev) => [...prev, data.testimonial].sort((a, b) => a.order_index - b.order_index))
      }
      setShowForm(false)
    } catch { setError('Error de red') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este testimonio?')) return
    const res = await fetch('/api/admin/testimonios', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setItems((prev) => prev.filter((t) => t.id !== id))
  }

  async function toggleActive(t: Testimonial) {
    const res = await fetch('/api/admin/testimonios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, active: !t.active }),
    })
    if (res.ok) {
      const { testimonial } = await res.json()
      setItems((prev) => prev.map((x) => x.id === t.id ? testimonial : x))
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex justify-end">
        <button
          onClick={openNew}
          className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark transition-colors"
        >
          + Nuevo testimonio
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="font-brand font-semibold text-brand-primary text-lg">
              {editingId ? 'Editar testimonio' : 'Nuevo testimonio'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Nombre *</label>
                <input
                  value={form.author_name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                  placeholder="María García"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Cargo / Empresa</label>
                <input
                  value={form.author_role ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, author_role: e.target.value }))}
                  placeholder="Dueña de Café La Paloma"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="col-span-2">
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Testimonio *</label>
                <textarea
                  rows={4}
                  value={form.content ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Describe la experiencia del cliente..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>

              <div className="col-span-2">
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">URL de avatar (opcional)</label>
                <input
                  value={form.avatar_url ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-2">Calificación</label>
                <div className="flex gap-1">
                  {STARS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, rating: s }))}
                      className={`text-2xl transition-colors ${s <= (form.rating ?? 5) ? 'text-amber-400' : 'text-gray-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Orden</label>
                <input
                  type="number"
                  min={0}
                  value={form.order_index ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, order_index: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="col-span-2 flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.active ?? true}
                  onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                  className={`relative flex-shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    form.active ? 'bg-brand-primary' : 'bg-brand-primary/20'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    form.active ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
                <span className="font-brand text-sm text-brand-primary">Visible en el sitio</span>
              </div>
            </div>

            {error && <p className="font-brand text-xs text-red-600">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-brand-primary text-brand-cream rounded-full py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 font-brand text-sm text-brand-primary/50 hover:text-brand-primary transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="font-brand text-brand-primary/40 text-sm">No hay testimonios aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((t) => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-colors ${
                t.active ? 'border-transparent' : 'border-gray-100'
              }`}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {STARS.map((s) => (
                  <span key={s} className={`text-base ${s <= t.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                ))}
              </div>

              {/* Content */}
              <p className="font-brand text-sm text-brand-primary/70 leading-relaxed mb-4 line-clamp-4">
                "{t.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                {t.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.avatar_url} alt={t.author_name} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center font-brand font-semibold text-brand-primary text-sm">
                    {t.author_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-brand text-sm font-semibold text-brand-primary">{t.author_name}</p>
                  {t.author_role && (
                    <p className="font-brand text-xs text-brand-primary/50">{t.author_role}</p>
                  )}
                </div>
                <span className={`ml-auto font-brand text-xs px-2 py-0.5 rounded-full ${
                  t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.active ? 'Visible' : 'Oculto'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                <span className="font-brand text-xs text-brand-primary/30">#{t.order_index}</span>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => toggleActive(t)}
                    className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary transition-colors"
                    title={t.active ? 'Ocultar' : 'Mostrar'}
                  >
                    {t.active ? '👁 Ocultar' : '👁 Mostrar'}
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="font-brand text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
