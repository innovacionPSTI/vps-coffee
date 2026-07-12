'use client'

import { useState } from 'react'
import type { ShippingProfile } from '@vps/database'

interface Props {
  initial: ShippingProfile | null
}

const EMPTY = {
  first_name: '',
  last_name: '',
  phone: '',
  address: '',
  city: '',
  department: '',
  postal_code: '',
}

type FormData = typeof EMPTY

function toForm(p: ShippingProfile | null): FormData {
  if (!p) return EMPTY
  return {
    first_name: p.first_name ?? '',
    last_name: p.last_name ?? '',
    phone: p.phone ?? '',
    address: p.address ?? '',
    city: p.city ?? '',
    department: p.department ?? '',
    postal_code: p.postal_code ?? '',
  }
}

const isComplete = (d: FormData) =>
  !!(d.first_name && d.last_name && d.address && d.city && d.department && d.phone)

export default function ShippingProfileForm({ initial }: Props) {
  const [data, setData] = useState<FormData>(toForm(initial))
  const [editing, setEditing] = useState(!isComplete(toForm(initial)))
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function set(key: keyof FormData, value: string) {
    setData((d) => ({ ...d, [key]: value }))
  }

  async function handleSave() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch('/api/shipping-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setMsg({ ok: true, text: 'Datos de envío guardados.' })
      setEditing(false)
    } catch {
      setMsg({ ok: false, text: 'No se pudo guardar. Intenta de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  const field = (
    key: keyof FormData,
    label: string,
    placeholder: string,
    type = 'text'
  ) => (
    <div>
      <label className="font-brand text-xs text-brand-primary/40 uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      {editing ? (
        <input
          type={type}
          value={data[key]}
          onChange={(e) => set(key, e.target.value)}
          placeholder={placeholder}
          autoComplete={key === 'phone' ? 'tel' : key === 'postal_code' ? 'postal-code' : 'off'}
          className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary transition-colors"
        />
      ) : (
        <p className="font-brand text-sm text-brand-primary">
          {data[key] || <span className="text-brand-primary/30 italic">—</span>}
        </p>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-brand-primary/8 flex items-center justify-between">
        <div>
          <h2 className="font-brand font-semibold text-brand-primary">Datos de envío</h2>
          <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
            Se usarán para completar tu compra automáticamente
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => { setEditing(true); setMsg(null) }}
            className="font-brand text-xs text-brand-primary/50 hover:text-brand-primary transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar
          </button>
        )}
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('first_name', 'Nombre', 'Juan')}
          {field('last_name', 'Apellido', 'García')}
        </div>
        {field('phone', 'Teléfono', '+57 300 123 4567', 'tel')}
        {field('address', 'Dirección', 'Calle 123 #45-67, Apto 8')}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('city', 'Ciudad', 'Medellín')}
          {field('department', 'Departamento', 'Antioquia')}
        </div>
        {field('postal_code', 'Código postal', '050001')}

        {msg && (
          <p className={`font-brand text-xs ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>
            {msg.text}
          </p>
        )}

        {editing && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
            {isComplete(toForm(initial)) && (
              <button
                onClick={() => { setEditing(false); setData(toForm(initial)); setMsg(null) }}
                className="border border-brand-primary/20 text-brand-primary rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-cream transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
