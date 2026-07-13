'use client'

import { useState, useEffect } from 'react'
import type { CustomerAddress } from '@vps/database'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { DEPARTMENTS, getCitiesForDepartment } from '@/lib/colombia-locations'

interface AddrForm {
  label:       string
  full_name:   string
  phone:       string
  address:     string
  city:        string
  department:  string
  postal_code: string
  is_default:  boolean
}

const EMPTY: AddrForm = {
  label: '', full_name: '', phone: '', address: '',
  city: '', department: '', postal_code: '', is_default: false,
}

function fromAddress(a: CustomerAddress): AddrForm {
  return {
    label:       a.label       ?? '',
    full_name:   a.full_name   ?? '',
    phone:       a.phone       ?? '',
    address:     a.address     ?? '',
    city:        a.city        ?? '',
    department:  a.department  ?? '',
    postal_code: a.postal_code ?? '',
    is_default:  a.is_default  ?? false,
  }
}

function AddressFormFields({
  form,
  onChange,
  onDepartmentChange,
}: {
  form: AddrForm
  onChange: (key: keyof AddrForm, value: string | boolean) => void
  onDepartmentChange: (dept: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nombre completo */}
        <div className="sm:col-span-2">
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
            Nombre completo *
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => onChange('full_name', e.target.value)}
            placeholder="Juan García"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Teléfono</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="3001234567"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Etiqueta */}
        <div>
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Etiqueta</label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => onChange('label', e.target.value)}
            placeholder="Casa, Oficina…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Dirección */}
        <div className="sm:col-span-2">
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Dirección *</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="Calle 10 # 43-57, Apto 801"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Departamento */}
        <SearchableSelect
          label="Departamento *"
          required
          value={form.department}
          options={DEPARTMENTS}
          placeholder="Selecciona departamento"
          onChange={(dept) => onDepartmentChange(dept)}
        />

        {/* Ciudad */}
        <SearchableSelect
          label="Ciudad / Municipio *"
          required
          value={form.city}
          options={getCitiesForDepartment(form.department)}
          placeholder={form.department ? 'Selecciona ciudad' : 'Elige departamento primero'}
          disabled={!form.department}
          onChange={(city) => onChange('city', city)}
        />

        {/* Código postal */}
        <div>
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
            Código postal <span className="font-normal text-brand-primary/40">(opcional)</span>
          </label>
          <input
            type="text"
            value={form.postal_code}
            onChange={(e) => onChange('postal_code', e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6 dígitos"
            maxLength={6}
            inputMode="numeric"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Default checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => onChange('is_default', e.target.checked)}
          className="accent-brand-primary"
        />
        <span className="font-brand text-sm text-brand-primary">Usar como dirección predeterminada</span>
      </label>
    </div>
  )
}

export default function AddressesForm() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [loading, setLoading]     = useState(true)
  const [adding, setAdding]       = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm]           = useState<AddrForm>(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError]         = useState('')

  useEffect(() => {
    loadAddresses()
  }, [])

  async function loadAddresses() {
    setLoading(true)
    try {
      const data = await fetch('/api/account/addresses').then((r) => r.json())
      setAddresses(data.addresses ?? [])
    } finally {
      setLoading(false)
    }
  }

  function handleChange(key: keyof AddrForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleDepartmentChange(dept: string) {
    setForm((prev) => ({ ...prev, department: dept, city: '' }))
  }

  function startAdd() {
    setEditingId(null)
    setForm(EMPTY)
    setError('')
    setAdding(true)
  }

  function startEdit(addr: CustomerAddress) {
    setAdding(false)
    setError('')
    setEditingId(addr.id)
    setForm(fromAddress(addr))
  }

  function cancelForm() {
    setAdding(false)
    setEditingId(null)
    setForm(EMPTY)
    setError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.address || !form.city || !form.department) {
      setError('Nombre, dirección, ciudad y departamento son obligatorios')
      return
    }
    setSaving(true)
    setError('')

    const url = editingId
      ? `/api/account/addresses/${editingId}`
      : '/api/account/addresses'
    const method = editingId ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al guardar')
      setSaving(false)
      return
    }

    await loadAddresses()
    cancelForm()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta dirección?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
      await loadAddresses()
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSetDefault(id: string) {
    setDeletingId(id) // reuse loading state
    try {
      await fetch(`/api/account/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })
      await loadAddresses()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-brand-primary text-xl">Direcciones guardadas</h2>
        {!adding && editingId === null && (
          <button
            onClick={startAdd}
            className="font-brand text-sm text-brand-primary border border-brand-primary/30 rounded-full px-4 py-1.5
                       hover:border-brand-primary transition-colors"
          >
            + Nueva dirección
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <p className="font-brand text-sm text-brand-primary/40">Cargando...</p>
      ) : addresses.length === 0 && !adding ? (
        <p className="font-brand text-sm text-brand-primary/40">No tienes direcciones guardadas todavía.</p>
      ) : (
        <div className="space-y-3 mb-5">
          {addresses.map((addr) => (
            <div key={addr.id}>
              {/* Inline edit form */}
              {editingId === addr.id ? (
                <form
                  onSubmit={handleSave}
                  className="border-2 border-brand-primary/20 rounded-2xl p-5 space-y-4 bg-brand-cream/20"
                >
                  <p className="font-brand text-sm font-semibold text-brand-primary">Editar dirección</p>
                  <AddressFormFields form={form} onChange={handleChange} onDepartmentChange={handleDepartmentChange} />
                  {error && <p className="font-brand text-sm text-red-600">{error}</p>}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand text-sm
                                 hover:bg-brand-dark transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelForm}
                      className="font-brand text-sm text-brand-primary/50 hover:text-brand-primary px-4 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className={`rounded-xl border p-4 ${addr.is_default ? 'border-brand-primary/40 bg-brand-cream/30' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {addr.is_default && (
                          <span className="font-brand text-[10px] bg-brand-primary text-brand-cream rounded-full px-2 py-0.5">
                            Predeterminada
                          </span>
                        )}
                        {addr.label && (
                          <span className="font-brand text-[10px] text-brand-primary/50 uppercase tracking-wide">
                            {addr.label}
                          </span>
                        )}
                      </div>
                      <p className="font-brand text-sm font-semibold text-brand-primary">{addr.full_name}</p>
                      <p className="font-brand text-xs text-brand-primary/60 mt-0.5">
                        {addr.address}
                      </p>
                      <p className="font-brand text-xs text-brand-primary/60">
                        {addr.city}{addr.department ? `, ${addr.department}` : ''}
                      </p>
                      {addr.phone && (
                        <p className="font-brand text-xs text-brand-primary/40 mt-0.5">{addr.phone}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={() => startEdit(addr)}
                        disabled={deletingId === addr.id}
                        className="font-brand text-xs text-brand-primary/60 hover:text-brand-primary transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Editar
                      </button>
                      {!addr.is_default && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          disabled={deletingId === addr.id}
                          className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary transition-colors"
                        >
                          {deletingId === addr.id ? '...' : 'Predeterminada'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(addr.id)}
                        disabled={deletingId === addr.id}
                        className="font-brand text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {deletingId === addr.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <form
          onSubmit={handleSave}
          className="border border-brand-primary/10 rounded-2xl p-5 space-y-4 bg-brand-cream/20"
        >
          <p className="font-brand text-sm font-semibold text-brand-primary">Nueva dirección</p>
          <AddressFormFields form={form} onChange={handleChange} onDepartmentChange={handleDepartmentChange} />
          {error && <p className="font-brand text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand text-sm
                         hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar dirección'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="font-brand text-sm text-brand-primary/50 hover:text-brand-primary px-4 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
