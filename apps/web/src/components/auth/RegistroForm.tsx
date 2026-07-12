'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStackApp } from '@stackframe/stack'

export default function RegistroForm() {
  const app = useStackApp()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Por favor ingresa tu nombre.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const result = await app.signUpWithCredential({ email, password })

      if (result.status === 'error') {
        const msg = (result as { status: 'error'; error?: { message?: string } }).error?.message
        if (msg?.includes('already')) {
          setError('Ya existe una cuenta con ese email. ¿Quieres iniciar sesión?')
        } else {
          setError(msg ?? 'Error al crear la cuenta. Intenta de nuevo.')
        }
        return
      }

      // signUpWithCredential no acepta displayName — hay que persistirlo
      // explícitamente con user.update() después de crear la cuenta.
      const trimmedName = name.trim()
      const currentUser = await app.getUser()
      if (trimmedName && currentUser) {
        await currentUser.update({ displayName: trimmedName })
      }

      // Sincroniza el usuario en Supabase (customers) y envía email de bienvenida.
      // Pasamos email y stackId explícitamente para evitar race conditions donde
      // stackServerApp.getUser() aún no encuentra la sesión en el servidor.
      await fetch('/api/auth/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email,
          stackId: currentUser?.id ?? null,
        }),
      }).catch(() => {})

      router.push('/mi-cuenta')
    } catch {
      setError('Ocurrió un error inesperado. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-3xl shadow-sm p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-brand-primary text-3xl mb-2">
            Crear cuenta
          </h1>
          <p className="font-brand text-sm text-brand-primary/50">
            Únete a la familia VPS Coffee
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1.5">
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
              required
              autoComplete="name"
              className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          <div>
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          <div>
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
              className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          <div>
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1.5">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              autoComplete="new-password"
              className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="font-brand text-xs text-red-600">{error}</p>
              {error.includes('¿Quieres iniciar sesión?') && (
                <Link href="/login" className="font-brand text-xs text-brand-primary underline mt-1 block">
                  Ir a iniciar sesión →
                </Link>
              )}
            </div>
          )}

          {/* Términos */}
          <p className="font-brand text-xs text-brand-primary/40 text-center">
            Al crear tu cuenta aceptas nuestros{' '}
            <Link href="/terminos" className="underline hover:text-brand-primary transition-colors">
              términos de servicio
            </Link>
            .
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-brand-cream rounded-full py-3 font-brand font-medium text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        {/* Separador */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-brand-primary/10" />
          <span className="font-brand text-xs text-brand-primary/30">¿Ya tienes cuenta?</span>
          <div className="flex-1 h-px bg-brand-primary/10" />
        </div>

        <Link
          href="/login"
          className="block w-full text-center border border-brand-primary/20 rounded-full py-3 font-brand text-sm text-brand-primary hover:bg-brand-cream transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  )
}
