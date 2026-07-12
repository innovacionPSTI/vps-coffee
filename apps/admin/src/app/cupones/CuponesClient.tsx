'use client'

import { useState } from 'react'
import type { Coupon } from '@vps/database'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const STATUS_BADGE: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  expired:  'bg-red-100 text-red-600',
  exhausted:'bg-amber-100 text-amber-700',
}

function couponStatus(c: Coupon): 'active' | 'inactive' | 'expired' | 'exhausted' {
  if (!c.active) return 'inactive'
  if (c.expires_at && new Date(c.expires_at) < new Date()) return 'expired'
  if (c.max_uses !== null && c.used_count >= c.max_uses) return 'exhausted'
  return 'active'
}

const EMPTY: Partial<Coupon> = {
  code: '', type: 'percentage', value: 10, min_order_amount: 0,
  max_uses: null, expires_at: null, active: true,
}

interface Props {
  initialCoupons: Coupon[]
}

export default function CuponesClient({ initialCoupons }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [form, setForm] = useState<Partial<Coupon>>(EMPTY)
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

  function openEdit(c: Coupon) {
    setForm({ ...c, expires_at: c.expires_at ? c.expires_at.slice(0, 10) : null })
    setEditingId(c.id)
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? { id: editingId, ...form } : form
      const res = await fetch('/api/admin/coupons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error guardando'); return }

      if (editingId) {
        setCoupons((prev) => prev.map((c) => c.id === editingId ? data.coupon : c))
      } else {
        setCoupons((prev) => [data.coupon, ...prev])
      }
      setShowForm(false)
    } catch { setError('Error de red') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este cupón?')) return
    const res = await fetch('/api/admin/coupons', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setCoupons((prev) => prev.filter((c) => c.id !== id))
  }

  async function toggleActive(c: Coupon) {
    const res = await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    })
    if (res.ok) {
      const { coupon } = await res.json()
      setCoupons((prev) => prev.map((x) => x.id === c.id ? coupon : x))
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
          + Nuevo cupón
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md space-y-4">
            <h2 className="font-brand font-semibold text-brand-primary text-lg">
              {editingId ? 'Editar cupón' : 'Nuevo cupón'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Código</label>
                <input
                  value={form.code ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="DESCUENTO20"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm uppercase focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Tipo</label>
                <select
                  value={form.type ?? 'percentage'}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'percentage' | 'fixed' }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Valor fijo ($)</option>
                </select>
              </div>

              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
                  {form.type === 'percentage' ? 'Descuento (%)' : 'Descuento ($)'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={form.type === 'percentage' ? 100 : undefined}
                  value={form.value ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Mínimo de pedido ($)</label>
                <input
                  type="number"
                  min={0}
                  value={form.min_order_amount ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, min_order_amount: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Usos máximos</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Ilimitados"
                  value={form.max_uses ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="col-span-2">
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Fecha de expiración</label>
                <input
                  type="date"
                  value={form.expires_at ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value || null }))}
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
                <span className="font-brand text-sm text-brand-primary">Activo</span>
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-brand text-brand-primary/40 text-sm">No hay cupones creados aún</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Código', 'Descuento', 'Mín. pedido', 'Usos', 'Expira', 'Estado', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-brand text-xs font-semibold text-brand-primary/40 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map((c) => {
                const st = couponStatus(c)
                return (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-brand text-sm font-semibold text-brand-primary tracking-wider">
                      {c.code}
                    </td>
                    <td className="px-4 py-3 font-brand text-sm text-brand-primary">
                      {c.type === 'percentage' ? `${c.value}%` : fmt(c.value)}
                    </td>
                    <td className="px-4 py-3 font-brand text-sm text-brand-primary/60">
                      {c.min_order_amount > 0 ? fmt(c.min_order_amount) : '—'}
                    </td>
                    <td className="px-4 py-3 font-brand text-sm text-brand-primary/60">
                      {c.used_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-3 font-brand text-sm text-brand-primary/60">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-brand text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[st]}`}>
                        {st === 'active' ? 'Activo' : st === 'inactive' ? 'Inactivo' : st === 'expired' ? 'Expirado' : 'Agotado'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(c)}
                          className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary transition-colors"
                          title={c.active ? 'Desactivar' : 'Activar'}
                        >
                          {c.active ? '⏸' : '▶️'}
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="font-brand text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
