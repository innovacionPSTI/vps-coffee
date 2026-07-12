'use client'

import { useState } from 'react'
import { useUser } from '@stackframe/stack'

interface Props {
  initialName: string
  initialEmail: string
}

type Section = 'none' | 'name' | 'password'
type PwError = { message: string } | string

export default function ConfiguracionForm({ initialName, initialEmail }: Props) {
  const user = useUser({ or: 'redirect' })

  // ── Editar nombre ────────────────────────────────────────
  const [editSection, setEditSection] = useState<Section>('none')
  const [name, setName] = useState(initialName)
  const [nameLoading, setNameLoading] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleNameSave() {
    if (!name.trim()) return
    setNameLoading(true)
    setNameMsg(null)
    try {
      await user.update({ displayName: name.trim() })
      setNameMsg({ ok: true, text: 'Nombre actualizado correctamente.' })
      setEditSection('none')
    } catch {
      setNameMsg({ ok: false, text: 'No se pudo actualizar el nombre. Intenta de nuevo.' })
    } finally {
      setNameLoading(false)
    }
  }

  // ── Cambiar contraseña ───────────────────────────────────
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNew, setConfirmNew] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function resetPwForm() {
    setOldPassword(''); setNewPassword(''); setConfirmNew('')
    setPwMsg(null); setEditSection('none')
  }

  async function handlePasswordSave() {
    if (newPassword.length < 8) {
      setPwMsg({ ok: false, text: 'La nueva contraseña debe tener al menos 8 caracteres.' })
      return
    }
    if (newPassword !== confirmNew) {
      setPwMsg({ ok: false, text: 'Las contraseñas no coinciden.' })
      return
    }
    setPwLoading(true)
    setPwMsg(null)
    try {
      const result = await user.updatePassword({ oldPassword, newPassword })
      if (result && typeof result === 'object' && 'message' in result) {
        const msg = (result as PwError as { message: string }).message
        if (msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('wrong')) {
          setPwMsg({ ok: false, text: 'La contraseña actual es incorrecta.' })
        } else if (msg.toLowerCase().includes('requirement')) {
          setPwMsg({ ok: false, text: 'La contraseña no cumple los requisitos mínimos.' })
        } else {
          setPwMsg({ ok: false, text: msg })
        }
      } else {
        setPwMsg({ ok: true, text: 'Contraseña actualizada correctamente.' })
        setTimeout(resetPwForm, 1500)
      }
    } catch {
      setPwMsg({ ok: false, text: 'No se pudo actualizar la contraseña. Intenta de nuevo.' })
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Información personal ─────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-primary/8">
          <h2 className="font-brand font-semibold text-brand-primary">Información personal</h2>
          <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
            Tu nombre visible en la cuenta
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Email — solo lectura */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span className="font-brand text-xs text-brand-primary/40 sm:w-24 flex-shrink-0 uppercase tracking-wide">
              Email
            </span>
            <div className="flex-1">
              <span className="font-brand text-sm text-brand-primary">{initialEmail}</span>
              <span className="ml-2 font-brand text-xs text-brand-primary/30">(no modificable)</span>
            </div>
          </div>

          <div className="h-px bg-brand-primary/6" />

          {/* Nombre */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
            <span className="font-brand text-xs text-brand-primary/40 sm:w-24 flex-shrink-0 uppercase tracking-wide sm:pt-2">
              Nombre
            </span>
            <div className="flex-1">
              {editSection === 'name' ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre completo"
                    autoFocus
                    className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary transition-colors"
                  />
                  {nameMsg && (
                    <p className={`font-brand text-xs ${nameMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                      {nameMsg.text}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleNameSave}
                      disabled={nameLoading || !name.trim()}
                      className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-50"
                    >
                      {nameLoading ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => { setEditSection('none'); setName(initialName); setNameMsg(null) }}
                      className="border border-brand-primary/20 text-brand-primary rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-cream transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-brand text-sm text-brand-primary">
                    {name || <span className="text-brand-primary/30 italic">Sin nombre</span>}
                  </span>
                  <button
                    onClick={() => { setEditSection('name'); setNameMsg(null) }}
                    className="font-brand text-xs text-brand-primary/50 hover:text-brand-primary transition-colors flex items-center gap-1 flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Editar
                  </button>
                </div>
              )}
              {editSection !== 'name' && nameMsg?.ok && (
                <p className="font-brand text-xs text-green-600 mt-1">{nameMsg.text}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Seguridad ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-primary/8 flex items-center justify-between">
          <div>
            <h2 className="font-brand font-semibold text-brand-primary">Seguridad</h2>
            <p className="font-brand text-xs text-brand-primary/40 mt-0.5">Cambia tu contraseña de acceso</p>
          </div>
          {editSection !== 'password' && (
            <button
              onClick={() => { setEditSection('password'); setPwMsg(null) }}
              className="font-brand text-xs text-brand-primary/50 hover:text-brand-primary transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Cambiar
            </button>
          )}
        </div>

        <div className="px-6 py-5">
          {editSection === 'password' ? (
            <div className="space-y-3 max-w-sm">
              <div>
                <label className="font-brand text-xs text-brand-primary/50 block mb-1.5 uppercase tracking-wide">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  autoComplete="current-password"
                  className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label className="font-brand text-xs text-brand-primary/50 block mb-1.5 uppercase tracking-wide">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label className="font-brand text-xs text-brand-primary/50 block mb-1.5 uppercase tracking-wide">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={confirmNew}
                  onChange={(e) => setConfirmNew(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  autoComplete="new-password"
                  className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>

              {pwMsg && (
                <p className={`font-brand text-xs ${pwMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                  {pwMsg.text}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handlePasswordSave}
                  disabled={pwLoading || !oldPassword || !newPassword || !confirmNew}
                  className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-50"
                >
                  {pwLoading ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                  onClick={resetPwForm}
                  className="border border-brand-primary/20 text-brand-primary rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-cream transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-brand text-sm text-brand-primary/40 tracking-widest">••••••••</span>
              <span className="font-brand text-xs text-brand-primary/30">Última actualización no registrada</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Zona de peligro ──────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100">
          <h2 className="font-brand font-semibold text-red-600">Zona de peligro</h2>
          <p className="font-brand text-xs text-red-400 mt-0.5">
            Acciones irreversibles sobre tu cuenta
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-brand text-sm text-brand-primary">Eliminar cuenta</p>
              <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
                Se borrarán permanentemente todos tus datos
              </p>
            </div>
            <DeleteAccountButton />
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Subcomponente: confirmar eliminación ─────────────────────
function DeleteAccountButton() {
  const user = useUser({ or: 'redirect' })
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await user.delete()
    } catch {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-brand text-xs text-brand-primary/50">¿Seguro?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 text-white rounded-full px-4 py-2 font-brand text-xs hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="border border-brand-primary/20 text-brand-primary rounded-full px-4 py-2 font-brand text-xs hover:bg-brand-cream transition-colors"
        >
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex-shrink-0 border border-red-200 text-red-500 rounded-full px-5 py-2.5 font-brand text-sm hover:bg-red-50 transition-colors"
    >
      Eliminar cuenta
    </button>
  )
}
