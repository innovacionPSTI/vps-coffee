'use client'

import { useState, useTransition } from 'react'

interface Props {
  initialName:  string
  initialPhone: string
  email:        string
}

export default function ProfileForm({ initialName, initialPhone, email }: Props) {
  const [name,  setName]  = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [, startTransition] = useTransition()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')

    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
    })

    if (res.ok) {
      setStatus('saved')
      startTransition(() => { setTimeout(() => setStatus('idle'), 3000) })
    } else {
      setStatus('error')
    }
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="font-display text-brand-primary text-xl mb-5">Datos personales</h2>
      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        {/* Email — read only */}
        <div>
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 font-brand text-sm text-brand-primary/50 cursor-not-allowed"
          />
          <p className="font-brand text-xs text-brand-primary/30 mt-1">
            El correo no se puede cambiar desde aquí.
          </p>
        </div>

        <div>
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
            Nombre completo
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm
                       focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
            Teléfono (opcional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="3001234567"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm
                       focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={status === 'saving'}
            className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand text-sm
                       hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {status === 'saving' ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {status === 'saved' && (
            <span className="font-brand text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardado
            </span>
          )}
          {status === 'error' && (
            <span className="font-brand text-sm text-red-600">Error al guardar</span>
          )}
        </div>
      </form>
    </section>
  )
}
