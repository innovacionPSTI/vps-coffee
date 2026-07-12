'use client'

import { useState, useEffect } from 'react'
import type { CustomerAddress } from '@vps/database'

interface NewAddr {
  label:     string
  full_name: string
  phone:     string
  address:   string
  city:      string
  department:  string
  postal_code: string
  is_default:  boolean
}

const EMPTY: NewAddr = {
  label: '', full_name: '', phone: '', address: '',
  city: '', department: '', postal_code: '', is_default: false,
}

export default function AddressesForm() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [loading, setLoading]     = useState(true)
  const [adding, setAdding]       = useState(false)
  const [form, setForm]           = useState<NewAddr>(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => {
    fetch('/api/account/addresses')
      .then((r) => r.ok ? r.json() : { addresses: [] })
      .then((d) => setAddresses(d.addresses ?? []))
      .finally(() => setLoading(false))
  }, [])

  function field(key: keyof NewAddr) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al guardar')
      setSaving(false)
      return
    }

    // Refetch
    const updated = await fetch('/api/account/addresses').then((r) => r.json())
    setAddresses(updated.addresses ?? [])
    setForm(EMPTY)
    setAdding(false)
    setSaving(false)
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-brand-primary text-xl">Direcciones guardadas</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
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
        <p className="font-brand text-sm text-brand-primary/40">
          No tienes direcciones guardadas todavía.
        </p>
      ) : (
        <div className="space-y-3 mb-5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-xl border p-4 ${addr.is_default ? 'border-brand-primary/40 bg-brand-cream/30' : 'border-gray-100'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  {addr.is_default && (
                    <span className="font-brand text-[10px] bg-brand-primary text-brand-cream rounded-full px-2 py-0.5 mr-2">
                      Predeterminada
                    </span>
                  )}
                  {addr.label && (
                    <span className="font-brand text-[10px] text-brand-primary/50 uppercase tracking-wide">
                      {addr.label}
                    </span>
                  )}
                  <p className="font-brand text-sm font-semibold text-brand-primary mt-1">{addr.full_name}</p>
                  <p className="font-brand text-xs text-brand-primary/60 mt-0.5">
                    {addr.address}, {addr.city}
                    {addr.department ? `, ${addr.department}` : ''}
                    {addr.postal_code ? ` (${addr.postal_code})` : ''}
                  </p>
                  {addr.phone && (
                    <p className="font-brand text-xs text-brand-primary/40 mt-0.5">{addr.phone}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="border border-brand-primary/10 rounded-2xl p-5 space-y-4 bg-brand-cream/20">
          <p className="font-brand text-sm font-semibold text-brand-primary">Nueva dirección</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              { key: 'full_name',   label: 'Nombre completo *', required: true,  placeholder: 'Juan García' },
              { key: 'phone',       label: 'Teléfono',          required: false, placeholder: '3001234567' },
              { key: 'label',       label: 'Etiqueta',          required: false, placeholder: 'Casa, Oficina…' },
              { key: 'address',     label: 'Dirección *',       required: true,  placeholder: 'Calle 10 # 43-57' },
              { key: 'city',        label: 'Ciudad *',          required: true,  placeholder: 'Medellín' },
              { key: 'department',  label: 'Departamento',      required: false, placeholder: 'Antioquia' },
              { key: 'postal_code', label: 'Código postal',     required: false, placeholder: '050001' },
            ] as const).map((f) => (
              <div key={f.key}>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">{f.label}</label>
                <input
                  type="text"
                  value={form[f.key] as string}
                  onChange={field(f.key)}
                  placeholder={f.placeholder}
                  required={f.required}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm
                             focus:outline-none focus:border-brand-primary"
                />
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={field('is_default')}
              className="accent-brand-primary"
            />
            <span className="font-brand text-sm text-brand-primary">Usar como dirección predeterminada</span>
          </label>

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
              onClick={() => { setAdding(false); setForm(EMPTY); setError('') }}
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
