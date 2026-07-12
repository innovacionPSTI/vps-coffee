'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useStackApp } from '@stackframe/stack'

export default function ForgotPasswordForm() {
  const app = useStackApp()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError(null)

    try {
      // callbackUrl explícito con el origen actual → el link del email apunta
      // al handler correcto sin depender de lo que Stack Auth infiera.
      const callbackUrl = `${window.location.origin}/handler/password-reset`
      const result = await app.sendForgotPasswordEmail(email, { callbackUrl })

      if (result && 'status' in result && (result as { status: string }).status === 'error') {
        setError('No encontramos una cuenta con ese email.')
      } else {
        setSent(true)
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
        {sent ? (
          /* Estado enviado */
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="font-display text-brand-primary text-2xl mb-2">Revisa tu correo</h1>
            <p className="font-brand text-sm text-brand-primary/50 mb-1">
              Enviamos un enlace de recuperación a
            </p>
            <p className="font-brand text-sm font-semibold text-brand-primary mb-6">{email}</p>
            <p className="font-brand text-xs text-brand-primary/40 mb-8">
              El enlace expira en 1 hora. Si no lo ves, revisa tu carpeta de spam.
            </p>
            <Link
              href="/login"
              className="font-brand text-sm text-brand-primary/60 hover:text-brand-primary transition-colors"
            >
              ← Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          /* Formulario */
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-brand-cream flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <h1 className="font-display text-brand-primary text-3xl mb-2">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="font-brand text-sm text-brand-primary/50">
                Ingresa tu email y te enviaremos un enlace para recuperarla
              </p>
            </div>

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
                  autoFocus
                  autoComplete="email"
                  className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="font-brand text-xs text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-brand-primary text-brand-cream rounded-full py-3 font-brand font-medium text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="font-brand text-sm text-brand-primary/50 hover:text-brand-primary transition-colors"
              >
                ← Volver a iniciar sesión
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
