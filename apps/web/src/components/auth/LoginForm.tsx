'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStackApp } from '@stackframe/stack'

export default function LoginForm() {
  const app = useStackApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') ?? '/mi-cuenta'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email || !password) {
      setError('Por favor ingresa tu email y contraseña.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const result = await app.signInWithCredential({ email, password })
      if (result.status === 'error') {
        setError('Email o contraseña incorrectos. Verifica tus datos e intenta de nuevo.')
      } else {
        router.push(returnTo)
      }
    } catch {
      setError('Ocurrió un error. Por favor intenta de nuevo.')
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
            Iniciar sesión
          </h1>
          <p className="font-brand text-sm text-brand-primary/50">
            Accede a tu cuenta VPS Coffee
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-brand text-sm font-semibold text-brand-primary">
                Contraseña
              </label>
              <Link
                href="/recuperar-contrasena"
                className="font-brand text-xs text-brand-primary/50 hover:text-brand-primary transition-colors"
              >
                ¿La olvidaste?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="font-brand text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-brand-cream rounded-full py-3 font-brand font-medium text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Separador */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-brand-primary/10" />
          <span className="font-brand text-xs text-brand-primary/30">¿No tienes cuenta?</span>
          <div className="flex-1 h-px bg-brand-primary/10" />
        </div>

        <Link
          href="/registro"
          className="block w-full text-center border border-brand-primary/20 rounded-full py-3 font-brand text-sm text-brand-primary hover:bg-brand-cream transition-colors"
        >
          Crear cuenta nueva
        </Link>
      </div>
    </div>
  )
}
