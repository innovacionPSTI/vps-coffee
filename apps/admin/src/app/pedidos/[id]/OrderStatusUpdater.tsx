'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = [
  { value: 'pending',    label: 'Pendiente' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped',    label: 'Enviado' },
  { value: 'delivered',  label: 'Entregado' },
  { value: 'cancelled',  label: 'Cancelado' },
]

interface Props {
  orderId: number
  currentStatus: string
}

export default function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const router = useRouter()
  const [status, setStatus]   = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState<boolean | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function updateStatus() {
    if (status === currentStatus) return
    setLoading(true)
    setSaved(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setSaved(true)
        router.refresh()
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setSaved(null), 2500)
      } else {
        setSaved(false)
      }
    } catch {
      setSaved(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); setSaved(null) }}
        className="font-brand text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-brand-primary"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <button
        onClick={updateStatus}
        disabled={loading || status === currentStatus}
        className="bg-brand-primary text-brand-cream rounded-full px-4 py-2 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-40"
      >
        {loading ? 'Guardando…' : 'Actualizar estado'}
      </button>
      {saved === true  && <span className="font-brand text-xs text-green-600">✓ Actualizado</span>}
      {saved === false && <span className="font-brand text-xs text-red-500">Error al guardar</span>}
    </div>
  )
}
