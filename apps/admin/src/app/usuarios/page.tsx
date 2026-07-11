import { createServerClient } from '@vps/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Usuarios' }
export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
  admin:       { label: 'Admin',       color: 'bg-brand-primary/10 text-brand-primary' },
  editor:      { label: 'Editor',      color: 'bg-blue-100 text-blue-700' },
  customer:    { label: 'Cliente',     color: 'bg-gray-100 text-gray-600' },
}

export default async function UsuariosPage() {
  const supabase = createServerClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['super_admin', 'admin', 'editor'])
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-brand-primary text-2xl">Usuarios del sistema</h1>
          <p className="font-brand text-sm text-brand-primary/50 mt-1">
            Administradores y editores con acceso al panel
          </p>
        </div>
        <button className="font-brand text-sm bg-brand-primary text-brand-cream px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors">
          + Invitar usuario
        </button>
      </div>

      {/* Roles */}
      <div className="grid grid-cols-3 gap-4">
        {(['super_admin', 'admin', 'editor'] as const).map((role) => {
          const count = users?.filter((u) => u.role === role).length ?? 0
          const { label, color } = ROLE_LABELS[role]
          return (
            <div key={role} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <span className={`text-xs font-brand font-semibold px-3 py-1 rounded-full ${color}`}>
                {label}
              </span>
              <span className="font-brand font-bold text-brand-primary text-2xl">{count}</span>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">Usuario</th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">Rol</th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">Desde</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users && users.length > 0 ? (
              users.map((u) => {
                const roleStyle = ROLE_LABELS[u.role] ?? ROLE_LABELS.customer
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-brand font-semibold text-sm text-brand-primary">
                        {u.full_name ?? '(Sin nombre)'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-brand text-xs font-semibold px-3 py-1 rounded-full ${roleStyle.color}`}>
                        {roleStyle.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-brand text-sm text-brand-primary/40">
                        {new Date(u.created_at).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary transition-colors px-3 py-1 rounded-lg hover:bg-brand-cream">
                        Cambiar rol
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center font-brand text-sm text-brand-primary/30">
                  No hay usuarios administradores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
