'use client'

import { useState } from 'react'
import type { VariantType } from '@vps/database'

interface Props {
  variantTypes: VariantType[]
}

type DisplayType = 'pill' | 'swatch'

interface FormState {
  name: string
  values: string        // newline-separated
  display_type: DisplayType
  active: boolean
}

const EMPTY_FORM: FormState = { name: '', values: '', display_type: 'pill', active: true }

export default function VariantTypesClient({ variantTypes: initial }: Props) {
  const [items, setItems] = useState<VariantType[]>(initial)
  const [editing, setEditing] = useState<VariantType | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function openNew() {
    setEditing(null)
    setIsNew(true)
    setForm(EMPTY_FORM)
    setError('')
  }

  function openEdit(vt: VariantType) {
    setEditing(vt)
    setIsNew(false)
    setForm({
      name: vt.name,
      values: vt.values.join('\n'),
      display_type: vt.display_type,
      active: vt.active,
    })
    setError('')
  }

  function closeModal() {
    setEditing(null)
    setIsNew(false)
    setError('')
  }

  function parseValues(raw: string): string[] {
    return raw.split('\n').map((v) => v.trim()).filter(Boolean)
  }

  async function handleSave() {
    const values = parseValues(form.values)
    if (!form.name.trim()) { setError('El nombre es requerido'); return }
    if (values.length === 0) { setError('Agrega al menos un valor'); return }

    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      values,
      display_type: form.display_type,
      active: form.active,
    }

    try {
      if (isNew) {
        const res = await fetch('/api/admin/variant-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Error al crear'); return }
        setItems((prev) => [...prev, data])
      } else if (editing) {
        const res = await fetch(`/api/admin/variant-types/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Error al guardar'); return }
        setItems((prev) => prev.map((v) => v.id === editing.id ? data : v))
      }
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(vt: VariantType) {
    const res = await fetch(`/api/admin/variant-types/${vt.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !vt.active }),
    })
    if (res.ok) {
      const data = await res.json()
      setItems((prev) => prev.map((v) => v.id === vt.id ? data : v))
    }
  }

  async function handleDelete(vt: VariantType) {
    if (!confirm(`¿Eliminar "${vt.name}"? Los productos que usen este tipo perderán esta opción.`)) return
    const res = await fetch(`/api/admin/variant-types/${vt.id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((v) => v.id !== vt.id))
    }
  }

  const modalOpen = isNew || !!editing

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-brand-primary text-2xl">Tipos de variante</h1>
          <p className="font-brand text-sm text-brand-primary/50 mt-0.5">
            Plantillas globales reutilizables que se asignan a los productos para generar combinaciones.
          </p>
        </div>
        <button
          onClick={openNew}
          className="font-brand text-sm bg-brand-primary text-brand-cream px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors"
        >
          + Nuevo tipo
        </button>
      </div>

      {/* Lista */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="font-brand text-brand-primary/40 text-sm">
            No hay tipos de variante. Crea uno para empezar.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left font-brand text-xs text-brand-primary/40 px-6 py-3">Nombre</th>
                <th className="text-left font-brand text-xs text-brand-primary/40 px-6 py-3">Valores</th>
                <th className="text-left font-brand text-xs text-brand-primary/40 px-6 py-3">Tipo</th>
                <th className="text-left font-brand text-xs text-brand-primary/40 px-6 py-3">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((vt) => (
                <tr key={vt.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-brand font-semibold text-sm text-brand-primary">{vt.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {vt.values.map((val) => (
                        <span
                          key={val}
                          className="font-brand text-xs bg-brand-cream text-brand-primary px-2.5 py-1 rounded-full"
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-brand text-xs px-2.5 py-1 rounded-full ${
                      vt.display_type === 'swatch'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {vt.display_type === 'swatch' ? 'Color' : 'Pastilla'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(vt)}
                      className={`font-brand text-xs px-2.5 py-1 rounded-full transition-colors ${
                        vt.active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {vt.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => openEdit(vt)}
                        className="font-brand text-xs text-brand-primary/50 hover:text-brand-primary transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(vt)}
                        className="font-brand text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md space-y-5 p-6">
            <h2 className="font-display text-brand-primary text-lg">
              {isNew ? 'Nuevo tipo de variante' : `Editar: ${editing?.name}`}
            </h2>

            {error && (
              <p className="font-brand text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="font-brand text-xs text-brand-primary/50 block mb-1">
                  Nombre del tipo *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="ej: Color, Talla, Material, Acabado"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="font-brand text-xs text-brand-primary/50 block mb-1">
                  Valores * <span className="text-brand-primary/30">(uno por línea)</span>
                </label>
                <textarea
                  rows={5}
                  value={form.values}
                  onChange={(e) => setForm((f) => ({ ...f, values: e.target.value }))}
                  placeholder={'Opción A\nOpción B\nOpción C'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary resize-none"
                />
                {parseValues(form.values).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {parseValues(form.values).map((v) => (
                      <span key={v} className="font-brand text-xs bg-brand-cream text-brand-primary px-2.5 py-1 rounded-full">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="font-brand text-xs text-brand-primary/50 block mb-1">
                  Visualización en tienda
                </label>
                <div className="flex gap-3">
                  {(['pill', 'swatch'] as DisplayType[]).map((dt) => (
                    <label key={dt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="display_type"
                        value={dt}
                        checked={form.display_type === dt}
                        onChange={() => setForm((f) => ({ ...f, display_type: dt }))}
                        className="accent-brand-primary"
                      />
                      <span className="font-brand text-sm text-brand-primary">
                        {dt === 'pill' ? 'Pastilla de texto' : 'Swatch de color'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 accent-brand-primary"
                />
                <span className="font-brand text-sm text-brand-primary">Activo</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeModal}
                disabled={saving}
                className="flex-1 font-brand text-sm border border-gray-200 text-brand-primary px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 font-brand text-sm bg-brand-primary text-brand-cream px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
