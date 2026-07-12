'use client'

import { useState } from 'react'

interface PaymentConfigData {
  wompi_public_key: string | null
  wompi_private_key: string | null
  wompi_integrity_secret: string | null
  wompi_events_secret: string | null
  wompi_active: boolean
  mercadopago_access_token: string | null
  mercadopago_public_key: string | null
  mercadopago_active: boolean
  has_wompi_private_key: boolean
  has_wompi_integrity_secret: boolean
  has_wompi_events_secret: boolean
  has_mercadopago_access_token: boolean
}

interface Props {
  initialConfig: PaymentConfigData | null
}

function SecretInput({
  label,
  name,
  hasExisting,
  placeholder,
  hint,
}: {
  label: string
  name: string
  hasExisting: boolean
  placeholder?: string
  hint?: string
}) {
  const [changing, setChanging] = useState(false)

  return (
    <div>
      <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">
        {label}
      </label>
      {hasExisting && !changing ? (
        <div className="flex items-center gap-3">
          <span className="flex-1 border border-brand-primary/10 rounded-xl px-4 py-2.5 font-mono text-sm text-brand-primary/40 bg-gray-50">
            ••••••••••••
          </span>
          <button
            type="button"
            onClick={() => setChanging(true)}
            className="font-brand text-xs text-brand-primary underline hover:text-brand-dark"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <input
          type="password"
          name={name}
          placeholder={placeholder ?? 'Nueva llave…'}
          autoComplete="off"
          className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary"
        />
      )}
      {hint && (
        <p className="font-brand text-xs text-brand-primary/40 mt-1">{hint}</p>
      )}
    </div>
  )
}

export default function PaymentConfigForm({ initialConfig }: Props) {
  const cfg = initialConfig
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const fd = new FormData(e.currentTarget)

    const payload: Record<string, string | boolean> = {
      wompi_active: fd.get('wompi_active') === 'on',
      mercadopago_active: fd.get('mercadopago_active') === 'on',
    }

    const stringFields = [
      'wompi_public_key',
      'wompi_private_key',
      'wompi_integrity_secret',
      'wompi_events_secret',
      'mercadopago_access_token',
      'mercadopago_public_key',
    ]
    for (const field of stringFields) {
      const val = fd.get(field)
      // Solo incluir si hay un valor nuevo (no vacío)
      if (typeof val === 'string' && val.trim()) {
        payload[field] = val.trim()
      }
    }

    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Error guardando')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Wompi ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-brand font-semibold text-brand-primary">Wompi (Bancolombia)</h3>
            <p className="font-brand text-xs text-brand-primary/40">
              Tarjeta débito/crédito, PSE, Bancolombia Button
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="font-brand text-sm text-brand-primary/60">Activo</span>
            <div className="relative">
              <input
                type="checkbox"
                name="wompi_active"
                defaultChecked={cfg?.wompi_active ?? false}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-brand-primary/20 rounded-full peer peer-checked:bg-brand-primary transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 pl-0">
          <div>
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">
              Llave pública (pub_…)
            </label>
            <input
              type="text"
              name="wompi_public_key"
              defaultValue={cfg?.wompi_public_key ?? ''}
              placeholder="pub_test_… o pub_prod_…"
              className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary"
            />
            <p className="font-brand text-xs text-brand-primary/40 mt-1">
              Visible en el frontend. Empieza con pub_test_ (sandbox) o pub_prod_ (producción).
            </p>
          </div>

          <SecretInput
            label="Llave privada (prv_…)"
            name="wompi_private_key"
            hasExisting={cfg?.has_wompi_private_key ?? false}
            placeholder="prv_test_… o prv_prod_…"
            hint="Usada internamente. Nunca se expone al cliente."
          />

          <SecretInput
            label="Llave de integridad"
            name="wompi_integrity_secret"
            hasExisting={cfg?.has_wompi_integrity_secret ?? false}
            placeholder="test_integrity_… o prod_integrity_…"
            hint="Firma SHA256 de los payment links. Panel Wompi → Desarrolladores → Integridad."
          />

          <SecretInput
            label="Llave de eventos (webhooks)"
            name="wompi_events_secret"
            hasExisting={cfg?.has_wompi_events_secret ?? false}
            placeholder="test_events_… o prod_events_…"
            hint="Verifica que el webhook venga de Wompi. Panel Wompi → Webhooks."
          />
        </div>
      </div>

      <hr className="border-brand-primary/10" />

      {/* ── MercadoPago ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-brand font-semibold text-brand-primary">MercadoPago</h3>
            <p className="font-brand text-xs text-brand-primary/40">
              Tarjeta, efectivo, Nequi, Daviplata
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="font-brand text-sm text-brand-primary/60">Activo</span>
            <div className="relative">
              <input
                type="checkbox"
                name="mercadopago_active"
                defaultChecked={cfg?.mercadopago_active ?? false}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-brand-primary/20 rounded-full peer peer-checked:bg-brand-primary transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">
              Public Key (APP_USR-… o TEST-…)
            </label>
            <input
              type="text"
              name="mercadopago_public_key"
              defaultValue={cfg?.mercadopago_public_key ?? ''}
              placeholder="TEST-abc123… o APP_USR-abc123…"
              className="w-full border border-brand-primary/20 rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none focus:border-brand-primary"
            />
            <p className="font-brand text-xs text-brand-primary/40 mt-1">
              Usada en el frontend (checkout Brick). Panel MP → Credenciales.
            </p>
          </div>

          <SecretInput
            label="Access Token (TEST-… o APP_USR-…)"
            name="mercadopago_access_token"
            hasExisting={cfg?.has_mercadopago_access_token ?? false}
            placeholder="TEST-abc123… o APP_USR-abc123…"
            hint="Credencial privada de servidor. TEST-… = sandbox, APP_USR-… = producción."
          />
        </div>
      </div>

      {/* ── Acciones ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand font-medium text-sm hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar credenciales'}
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
