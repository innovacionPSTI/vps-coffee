'use client'

import { useState } from 'react'

const STATUSES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
]

interface Props {
  orderId: number
  currentStatus: string
}

export default function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function updateStatus() {
    if (status === currentStatus) return
    setLoading(true)
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
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
        {loading ? 'Guardando...' : 'Actualizar estado'}
      </button>
    </div>
  )
}
