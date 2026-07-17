'use client'

import { useState, useRef } from 'react'

interface Props {
  orderId: number
  initialNotes: string | null
}

export default function OrderNotes({ orderId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [saved, setSaved] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const changed = notes !== (initialNotes ?? '')

  async function save() {
    setSaving(true)
    setSaved(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internal_notes: notes || null }),
      })
      setSaved(res.ok)
      if (res.ok) {
        // Auto-hide el indicador tras 2s
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setSaved(null), 2000)
      }
    } catch {
      setSaved(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-brand font-semibold text-brand-primary">Notas internas</h3>
        {saved === true && (
          <span className="font-brand text-xs text-green-600">✓ Guardado</span>
        )}
        {saved === false && (
          <span className="font-brand text-xs text-red-500">Error al guardar</span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(null) }}
        placeholder="Notas del equipo (no visibles al cliente)…"
        rows={4}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 font-brand text-sm text-brand-primary focus:outline-none focus:border-brand-primary resize-none placeholder:text-brand-primary/30"
      />
      {changed && (
        <button
          onClick={save}
          disabled={saving}
          className="font-brand text-sm bg-brand-primary text-brand-cream rounded-full px-4 py-1.5 hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar nota'}
        </button>
      )}
    </div>
  )
}
