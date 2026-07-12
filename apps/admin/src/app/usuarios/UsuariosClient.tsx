'use client'

import { useState } from 'react'
import { ASSIGNABLE_ROLES, ROLE_LABELS } from '@/lib/roles'
import type { AssignableRole } from '@/lib/roles'

interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  role: string
  created_at: string
}

interface Props {
  users: UserProfile[]
  currentUserEmail: string
}

export default function UsuariosClient({ users: initialUsers, currentUserEmail }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState({ email: '', full_name: '' })
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  async function handleInvite() {
    if (!invite.email) return
    setInviteLoading(true)
    setInviteMsg(null)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invite),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')

      setUsers((prev) => [data, ...prev.filter((u) => u.email !== data.email)])

      const emailNote = data.inviteEmailSent
        ? 'Se envió un correo para que establezca su contraseña.'
        : 'No se pudo enviar el correo. Indícale que use "¿Olvidaste tu contraseña?" en el admin.'

      setInviteMsg({
        ok: true,
        text: `Usuario ${invite.email} agregado con rol Miembro. ${emailNote} Asígnale un rol para que pueda ingresar.`,
      })
      setInvite({ email: '', full_name: '' })
      setShowInvite(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido'
      setInviteMsg({ ok: false, text: msg })
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleRoleChange(email: string, newRole: AssignableRole) {
    setChangingRole(email)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'No se pudo cambiar el rol')
        return
      }
      setUsers((prev) => prev.map((u) => (u.email === email ? { ...u, role: newRole } : u)))
    } finally {
      setChangingRole(null)
    }
  }

  async function handleRevoke(email: string) {
    if (!confirm(`¿Eliminar el acceso de ${email}? El usuario no podrá ingresar al admin.`)) return
    setRevoking(email)
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'No se pudo revocar el acceso')
        return
      }
      setUsers((prev) => prev.filter((u) => u.email !== email))
    } finally {
      setRevoking(null)
    }
  }

  const roleCount = (role: string) => users.filter((u) => u.role === role).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-brand-primary text-2xl">Usuarios del sistema</h1>
          <p className="font-brand text-sm text-brand-primary/50 mt-1">
            Gestiona quién tiene acceso al panel y qué puede hacer
          </p>
        </div>
        <button
          onClick={() => { setShowInvite(true); setInviteMsg(null) }}
          className="font-brand text-sm bg-brand-primary text-brand-cream px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-colors flex items-center gap-2"
        >
          <span>+</span> Agregar usuario
        </button>
      </div>

      {/* Mensaje global */}
      {inviteMsg && (
        <div
          className={`rounded-xl px-4 py-3 font-brand text-sm ${
            inviteMsg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {inviteMsg.text}
        </div>
      )}

      {/* Contadores por rol */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {(['miembro', 'admin', 'vendedor', 'gestor_tienda', 'super_admin'] as const).map((role) => {
          const { label, color } = ROLE_LABELS[role]
          return (
            <div key={role} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <span className={`text-xs font-brand font-semibold px-3 py-1 rounded-full ${color} whitespace-nowrap`}>
                {label}
              </span>
              <span className="font-brand font-bold text-brand-primary text-2xl">{roleCount(role)}</span>
            </div>
          )
        })}
      </div>

      {/* Modal de invitación */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-brand font-semibold text-brand-primary text-lg mb-5">
              Agregar usuario al admin
            </h2>
            <div className="space-y-4">
              <div>
                <label className="font-brand text-xs text-brand-primary/50 uppercase tracking-wide block mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={invite.email}
                  onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="font-brand text-xs text-brand-primary/50 uppercase tracking-wide block mb-1.5">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={invite.full_name}
                  onChange={(e) => setInvite({ ...invite, full_name: e.target.value })}
                  placeholder="Juan García"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>

              {/* Explicación del flujo */}
              <div className="bg-amber-50 rounded-xl p-3 space-y-1.5">
                <p className="font-brand text-xs font-semibold text-amber-800">
                  El usuario se crea con rol <span className="font-bold">Miembro</span> (sin acceso).
                </p>
                <p className="font-brand text-xs text-amber-700">
                  Recibirá un correo para establecer su contraseña. Después asígnale un rol desde la tabla.
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleInvite}
                  disabled={inviteLoading || !invite.email}
                  className="flex-1 bg-brand-primary text-brand-cream rounded-full py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-50"
                >
                  {inviteLoading ? 'Enviando invitación...' : 'Invitar usuario'}
                </button>
                <button
                  onClick={() => { setShowInvite(false); setInviteMsg(null) }}
                  className="flex-1 border border-gray-200 text-brand-primary rounded-full py-2.5 font-brand text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">
                Usuario
              </th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">
                Rol
              </th>
              <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">
                Desde
              </th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length > 0 ? (
              users.map((u) => {
                const roleStyle = ROLE_LABELS[u.role] ?? ROLE_LABELS['miembro']
                const isCurrentUser = u.email === currentUserEmail
                const isSuperAdmin = u.role === 'super_admin'
                const isPending = u.role === 'miembro'

                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-brand font-semibold text-sm text-brand-primary">
                            {u.full_name ?? '(Sin nombre)'}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-brand-primary/30 font-normal">(tú)</span>
                            )}
                          </p>
                          <p className="font-brand text-xs text-brand-primary/40">{u.email}</p>
                        </div>
                        {isPending && (
                          <span className="font-brand text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-1">
                            pendiente
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isSuperAdmin || isCurrentUser ? (
                        <span
                          className={`font-brand text-xs font-semibold px-3 py-1 rounded-full ${roleStyle.color}`}
                        >
                          {roleStyle.label}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          disabled={changingRole === u.email}
                          onChange={(e) =>
                            u.email && handleRoleChange(u.email, e.target.value as AssignableRole)
                          }
                          className={`font-brand text-xs font-semibold px-3 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary ${roleStyle.color} ${
                            changingRole === u.email ? 'opacity-50' : ''
                          }`}
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r].label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-brand text-sm text-brand-primary/40">
                        {new Date(u.created_at).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isSuperAdmin && !isCurrentUser && (
                        <button
                          onClick={() => u.email && handleRevoke(u.email)}
                          disabled={revoking === u.email}
                          className="font-brand text-xs text-red-400 hover:text-red-600 transition-colors px-3 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          {revoking === u.email ? '...' : 'Eliminar acceso'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-16 text-center font-brand text-sm text-brand-primary/30"
                >
                  No hay usuarios registrados. Agrega el primero con el botón de arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info de permisos por rol */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-brand font-semibold text-brand-primary mb-4">Permisos por rol</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {(
            [
              {
                role: 'miembro',
                sections: [],
                note: 'Rol predeterminado. Sin acceso hasta que se asigne un rol.',
              },
              {
                role: 'vendedor',
                sections: ['Dashboard', 'Productos', 'Categorías', 'Pedidos', 'Clientes'],
              },
              {
                role: 'gestor_tienda',
                sections: ['Dashboard', 'Banners', 'Blog', 'Configuración General'],
              },
              {
                role: 'admin',
                sections: ['Dashboard', 'Todo el contenido', 'Toda la configuración'],
              },
            ] as const
          ).map(({ role, sections, note }: { role: string; sections: readonly string[]; note?: string }) => {
            const { label, color } = ROLE_LABELS[role]
            return (
              <div key={role} className="border border-gray-100 rounded-xl p-4">
                <span
                  className={`text-xs font-brand font-semibold px-2.5 py-1 rounded-full ${color} inline-block mb-3`}
                >
                  {label}
                </span>
                {note ? (
                  <p className="font-brand text-xs text-brand-primary/50 italic">{note}</p>
                ) : (
                  <ul className="space-y-1">
                    {sections.map((s) => (
                      <li
                        key={s}
                        className="font-brand text-xs text-brand-primary/60 flex items-center gap-2"
                      >
                        <span className="text-green-500">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
