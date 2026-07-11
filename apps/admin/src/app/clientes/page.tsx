import { createServerClient } from '@vps/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Clientes' }
export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const supabase = createServerClient()
  const { data: customers } = await supabase
    .from('profiles')
    .select('*, orders(count)')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-brand-primary text-2xl">Clientes</h1>
          <p className="font-brand text-sm text-brand-primary/50 mt-1">
            {customers?.length ?? 0} clientes registrados
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">Cliente</th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">Teléfono</th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">Pedidos</th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">Registrado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {customers && customers.length > 0 ? (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-brand font-semibold text-sm text-brand-primary">
                        {c.full_name ?? '(Sin nombre)'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-brand text-sm text-brand-primary/60">
                      {c.phone ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-brand text-sm text-brand-primary/60">
                      {(c.orders as any)?.[0]?.count ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-brand text-sm text-brand-primary/40">
                      {new Date(c.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center font-brand text-sm text-brand-primary/30">
                  Aún no hay clientes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
