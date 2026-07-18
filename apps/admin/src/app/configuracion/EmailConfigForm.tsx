'use client'

import { useState } from 'react'

const EMAIL_PROVIDERS = [
  { value: 'resend', label: 'Resend', description: 'resend.com — API REST, dominio propio' },
  // Future providers added here + in migration CHECK constraint + getEmailProvider() factory
]

interface EmailConfigData {
  resend_from_email: string | null
  has_resend_api_key: boolean
  email_provider: string
}

interface Props {
  initialConfig: EmailConfigData | null
}

export default function EmailConfigForm({ initialConfig }: Props) {
  const [changingKey, setChangingKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState(initialConfig?.email_provider ?? 'resend')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const fd = new FormData(e.currentTarget)
    const payload: Record<string, string> = {
      email_provider: provider,
    }

    const apiKey = fd.get('resend_api_key')
    if (typeof apiKey === 'string' && apiKey.trim()) {
      payload.resend_api_key = apiKey.trim()
    }
    const fromEmail = fd.get('resend_from_email')
    if (typeof fromEmail === 'string' && fromEmail.trim()) {
      payload.resend_from_email = fromEmail.trim()
    }

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error guardando')
      }
      setSaved(true)
      setChangingKey(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Proveedor activo ─────────────────────────────────────── */}
      <div>
        <p className="font-brand text-sm font-semibold text-brand-primary mb-3">
          Proveedor de email activo
        </p>
        <div className="space-y-2">
          {EMAIL_PROVIDERS.map((p) => (
            <label key={p.value} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="email_provider_radio"
                value={p.value}
                checked={provider === p.value}
                onChange={() => setProvider(p.value)}
                className="accent-brand-primary"
              />
              <span className="font-brand text-sm text-brand-primary font-medium">{p.label}</span>
              <span className="font-brand text-xs text-brand-primary/40">{p.description}</span>
            </label>
          ))}
        </div>
        <p className="font-brand text-xs text-brand-primary/30 mt-2">
          Solo puede haber un proveedor activo a la vez. El cambio se aplica al próximo email enviado.
        </p>
      </div>

      <hr className="border-brand-primary/10" />

      {/* ── Credenciales Resend ──────────────────────────────────── */}
      {provider === 'resend' && (
        <div className="space-y-4">
          <h3 className="font-brand font-semibold text-brand-primary text-sm">Credenciales Resend</h3>

          <div>
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">
              Resend API Key (re_…)
            </label>
            {initialConfig?.has_resend_api_key && !changingKey ? (
              <div className="flex items-center gap-3">
                <span className="flex-1 border border-brand-primary/10 rounded-xl px-4 py-2.5 font-mono text-sm text-brand-primary/40 bg-gray-50">
                  ••••••••••••
                </span>
                <button
                  type="button"
                  onClick={() => setChangingKey(true)}
                  className="font-brand text-xs text-brand-primary underline hover:text-brand-dark"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <input
                type="password"
                name="resend_api_key"
                placeholder="re_…"
                autoComplete="off"
                className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary"
              />
            )}
            <p className="font-brand text-xs text-brand-primary/40 mt-1">
              Obtén tu llave en{' '}
              <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                resend.com/api-keys
              </a>
              . Empieza con re_…
            </p>
          </div>

          <div>
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">
              Email remitente
            </label>
            <input
              type="email"
              name="resend_from_email"
              defaultValue={initialConfig?.resend_from_email ?? ''}
              placeholder="pedidos@mitienda.com"
              className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
            />
            <p className="font-brand text-xs text-brand-primary/40 mt-1">
              El dominio debe estar verificado en Resend. Aparece como "De:" en los emails.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand font-medium text-sm hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
        {saved && (
          <span className="font-brand text-sm text-green-600">✓ Guardado correctamente</span>
        )}
        {error && (
          <span className="font-brand text-sm text-red-600">{error}</span>
        )}
      </div>
    </form>
  )
}
