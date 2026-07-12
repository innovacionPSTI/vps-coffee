'use client'

import { useState, useMemo } from 'react'

export type ClientType = 'con_cuenta' | 'sin_cuenta'

export interface ClientRow {
  email: string
  name: string | null
  phone: string | null
  type: ClientType
  signedUpAt: string | null   // ISO — fecha de registro en Stack Auth
  totalOrders: number
  totalSpent: number          // en centavos (COP)
  lastOrderAt: string | null  // ISO
}

interface Props {
  clients: ClientRow[]
}

export default function ClientesClient({ clients }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | ClientType>('todos')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return clients.filter((c) => {
      if (filter !== 'todos' && c.type !== filter) return false
      if (!q) return true
      return (
        c.email.toLowerCase().includes(q) ||
        (c.name ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q)
      )
    })
  }, [clients, search, filter])

  const total = clients.length
  const conCuenta = clients.filter((c) => c.type === 'con_cuenta').length
  const sinCuenta = clients.filter((c) => c.type === 'sin_cuenta').length

  function formatCOP(cents: number) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(cents)
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-brand-primary text-2xl">Clientes</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          {total} clientes en total
        </p>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wide mb-1">Total</p>
          <p className="font-brand font-bold text-brand-primary text-3xl">{total}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wide">Con cuenta</p>
          </div>
          <p className="font-brand font-bold text-brand-primary text-3xl">{conCuenta}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wide">Sin cuenta</p>
          </div>
          <p className="font-brand font-bold text-brand-primary text-3xl">{sinCuenta}</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
        />
        <div className="flex gap-2">
          {(['todos', 'con_cuenta', 'sin_cuenta'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-brand text-xs px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap ${
                filter === f
                  ? 'bg-brand-primary text-brand-cream'
                  : 'bg-white text-brand-primary/60 border border-gray-200 hover:border-brand-primary/30'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'con_cuenta' ? 'Con cuenta' : 'Sin cuenta'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">
                Cliente
              </th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">
                Tipo
              </th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">
                Pedidos
              </th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">
                Total gastado
              </th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">
                Último pedido
              </th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">
                Registrado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <tr key={c.email} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-brand font-semibold text-sm text-brand-primary">
                      {c.name ?? '(Sin nombre)'}
                    </p>
                    <p className="font-brand text-xs text-brand-primary/40">{c.email}</p>
                    {c.phone && (
                      <p className="font-brand text-xs text-brand-primary/30">{c.phone}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {c.type === 'con_cuenta' ? (
                      <span className="inline-flex items-center gap-1.5 font-brand text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Con cuenta
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-brand text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        Sin cuenta
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-brand text-sm text-brand-primary">
                      {c.totalOrders > 0 ? c.totalOrders : <span className="text-brand-primary/30">—</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-brand text-sm text-brand-primary">
                      {c.totalSpent > 0 ? formatCOP(c.totalSpent) : <span className="text-brand-primary/30">—</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-brand text-sm text-brand-primary/50">
                      {formatDate(c.lastOrderAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-brand text-sm text-brand-primary/50">
                      {c.type === 'con_cuenta' ? formatDate(c.signedUpAt) : <span className="text-brand-primary/30">—</span>}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center font-brand text-sm text-brand-primary/30"
                >
                  {search || filter !== 'todos'
                    ? 'No hay clientes que coincidan con el filtro.'
                    : 'Aún no hay clientes registrados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="font-brand text-xs text-brand-primary/30 text-right">
          Mostrando {filtered.length} de {total} clientes
        </p>
      )}
    </div>
  )
}
