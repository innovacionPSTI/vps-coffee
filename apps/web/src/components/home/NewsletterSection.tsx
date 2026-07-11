'use client'

import { useState } from 'react'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="bg-brand-primary py-20">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="font-display text-brand-cream leading-none mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
          Suscríbete a nuestro boletín
        </h2>
        <p className="font-brand text-brand-cream/60 mb-8">
          Recibe recetas, orígenes y novedades de VPS Coffee directamente en tu correo.
        </p>

        {status === 'success' ? (
          <p className="font-brand text-brand-cream bg-brand-cream/10 rounded-full py-3 px-6">
            ¡Gracias! Pronto tendrás noticias de VPS. ☕
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              className="flex-1 rounded-full px-6 py-3 font-brand bg-brand-cream/10 border border-brand-cream/20 text-brand-cream placeholder-brand-cream/40 focus:outline-none focus:border-brand-cream/60 transition-colors"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rounded-full bg-brand-cream text-brand-primary px-8 py-3 font-brand font-medium hover:bg-brand-yellow transition-colors disabled:opacity-60"
            >
              {status === 'loading' ? 'Enviando...' : 'Suscribirse'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="font-brand text-red-300 text-sm mt-3">
            Ocurrió un error. Intenta de nuevo.
          </p>
        )}
      </div>
    </section>
  )
}
