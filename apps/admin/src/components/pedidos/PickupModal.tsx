'use client'

import { useState } from 'react'

interface Order {
  id: string
  order_number: string
  customer_name: string
  skydropx_shipment_id: string | null
  tracking_number: string | null
}

interface Props {
  shippedOrders: Order[]
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function PickupModal({ shippedOrders }: Props) {
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [date, setDate]         = useState(today)
  const [from, setFrom]         = useState('09:00')
  const [to, setTo]             = useState('18:00')
  const [status, setStatus]     = useState<'idle' | 'saving' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const eligible = shippedOrders.filter((o) => o.skydropx_shipment_id)

  function toggleOrder(shipmentId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(shipmentId)) next.delete(shipmentId)
      else next.add(shipmentId)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === eligible.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(eligible.map((o) => o.skydropx_shipment_id!)))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected.size) return
    setStatus('saving')
    setErrorMsg('')

    const res = await fetch('/api/admin/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shipment_ids: [...selected],
        pickup_date:      date,
        pickup_time_from: from,
        pickup_time_to:   to,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErrorMsg(data.error ?? 'Error al programar la recolección')
      setStatus('error')
      return
    }

    setStatus('ok')
  }

  function handleClose() {
    setOpen(false)
    setStatus('idle')
    setErrorMsg('')
    setSelected(new Set())
    setDate(today())
    setFrom('09:00')
    setTo('18:00')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!eligible.length}
        className="font-brand text-sm bg-brand-primary text-brand-cream rounded-full px-5 py-2
                   hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                   flex items-center gap-2"
        title={eligible.length ? undefined : 'No hay pedidos con guía Skydropx generada'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Programar recolección
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-display text-brand-primary text-xl">Programar recolección</h2>
              <button onClick={handleClose} className="text-brand-primary/40 hover:text-brand-primary transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {status === 'ok' ? (
              <div className="px-6 py-10 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-brand font-semibold text-brand-primary mb-1">¡Recolección programada!</p>
                <p className="font-brand text-sm text-brand-primary/50 mb-6">
                  Skydropx ha registrado la solicitud de recolección para {selected.size} guía(s).
                </p>
                <button
                  onClick={handleClose}
                  className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                {/* Order selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-brand text-sm font-semibold text-brand-primary">Seleccionar pedidos</p>
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="font-brand text-xs text-brand-primary/50 hover:text-brand-primary transition-colors"
                    >
                      {selected.size === eligible.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {eligible.length === 0 ? (
                      <p className="font-brand text-sm text-brand-primary/40 text-center py-4">
                        No hay pedidos con guía Skydropx generada
                      </p>
                    ) : eligible.map((o) => (
                      <label
                        key={o.id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-colors ${
                          selected.has(o.skydropx_shipment_id!)
                            ? 'border-brand-primary/40 bg-brand-cream/30'
                            : 'border-gray-100 hover:border-brand-primary/20'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(o.skydropx_shipment_id!)}
                          onChange={() => toggleOrder(o.skydropx_shipment_id!)}
                          className="accent-brand-primary flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-brand text-sm font-semibold text-brand-primary">{o.order_number}</p>
                          <p className="font-brand text-xs text-brand-primary/50 truncate">
                            {o.customer_name}
                            {o.tracking_number && ` · ${o.tracking_number}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date & time */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={date}
                      min={today()}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm
                                 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
                      Desde *
                    </label>
                    <input
                      type="time"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm
                                 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div>
                    <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
                      Hasta *
                    </label>
                    <input
                      type="time"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm
                                 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="font-brand text-sm text-red-600">{errorMsg}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={!selected.size || status === 'saving'}
                    className="flex-1 bg-brand-primary text-brand-cream rounded-full py-2.5 font-brand text-sm
                               hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {status === 'saving' ? 'Programando...' : `Programar (${selected.size} guía${selected.size !== 1 ? 's' : ''})`}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="font-brand text-sm text-brand-primary/50 hover:text-brand-primary px-4 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
