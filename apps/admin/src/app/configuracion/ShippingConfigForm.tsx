'use client'

import { useState, useTransition } from 'react'
import type { ShippingConfig } from '@vps/database'

interface Props {
  initialConfig: ShippingConfig | null
}

type ProviderTab = 'fixed' | 'skydropx'

const PROVIDER_LABELS: Record<ProviderTab, string> = {
  fixed:     'Tarifa fija',
  skydropx:  'Skydropx',
}

// Future providers: add here and create the credentials UI section below.
const AVAILABLE_PROVIDERS: ProviderTab[] = ['fixed', 'skydropx']

export default function ShippingConfigForm({ initialConfig }: Props) {
  const [provider, setProvider] = useState<ProviderTab>(
    (initialConfig?.provider as ProviderTab) ?? 'fixed'
  )
  const [fixedRate, setFixedRate] = useState(
    String(initialConfig?.fixed_rate ?? 8000)
  )
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(
    initialConfig?.free_shipping_enabled ?? true
  )
  const [freeShippingMin, setFreeShippingMin] = useState(
    String(initialConfig?.free_shipping_min_amount ?? 100000)
  )
  const [clientId, setClientId] = useState(initialConfig?.skydropx_client_id ?? '')
  const [clientSecret, setClientSecret] = useState('')  // never pre-fill secret
  const [addressFromId, setAddressFromId] = useState(
    initialConfig?.skydropx_address_from_id ?? ''
  )
  const [baseUrl, setBaseUrl] = useState(
    initialConfig?.skydropx_base_url ?? 'https://api-pro.skydropx.com'
  )

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  const secretPlaceholder = initialConfig?.skydropx_client_id
    ? '••••••••(dejar vacío para no cambiar)'
    : 'Client Secret'

  async function handleSave() {
    setStatus('saving')
    setErrorMsg('')

    const body: Record<string, unknown> = {
      provider,
      fixed_rate: Number(fixedRate),
      free_shipping_enabled: freeShippingEnabled,
      free_shipping_min_amount: Number(freeShippingMin),
    }

    if (provider === 'skydropx') {
      body.skydropx_client_id = clientId || undefined
      body.skydropx_address_from_id = addressFromId || undefined
      body.skydropx_base_url = baseUrl
      // Only send secret if the user typed something
      if (clientSecret) body.skydropx_client_secret = clientSecret
    }

    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Error desconocido')
        setStatus('error')
        return
      }

      setStatus('saved')
      // Clear secret field after save
      setClientSecret('')
      // Reset to idle after 3s
      startTransition(() => {
        setTimeout(() => setStatus('idle'), 3000)
      })
    } catch {
      setErrorMsg('Error de red al guardar')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Provider selector tabs ──────────────────────────────── */}
      <div>
        <p className="font-brand text-sm font-semibold text-brand-primary mb-3">
          Proveedor activo
        </p>
        <div className="flex gap-2 flex-wrap">
          {AVAILABLE_PROVIDERS.map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`px-4 py-2 rounded-full font-brand text-sm transition-colors ${
                provider === p
                  ? 'bg-brand-primary text-brand-cream'
                  : 'border border-brand-primary/30 text-brand-primary/60 hover:border-brand-primary'
              }`}
            >
              {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>
        <p className="font-brand text-xs text-brand-primary/40 mt-2">
          {provider === 'fixed'
            ? 'Se cobra una tarifa fija sin consultar ninguna API de transporte.'
            : 'Se consultan tarifas en tiempo real a través de la API de Skydropx.'}
        </p>
      </div>

      {/* ── Fixed rate ─────────────────────────────────────────── */}
      <div>
        <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">
          Tarifa fija (COP)
        </label>
        <p className="font-brand text-xs text-brand-primary/40 mb-2">
          Se usa cuando el proveedor es "Tarifa fija" o como respaldo si Skydropx no responde.
          Pon 0 para envío gratuito.
        </p>
        <input
          type="number"
          min={0}
          step={500}
          value={fixedRate}
          onChange={(e) => setFixedRate(e.target.value)}
          className="w-48 border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
        />
      </div>

      {/* ── Envío gratis ───────────────────────────────────────── */}
      <div className="border border-brand-primary/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-brand text-sm font-semibold text-brand-primary">Envío gratis</p>
            <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
              Cuando el subtotal supera el monto mínimo, el envío es gratis automáticamente.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={freeShippingEnabled}
            onClick={() => setFreeShippingEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              freeShippingEnabled ? 'bg-brand-primary' : 'bg-brand-primary/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                freeShippingEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {freeShippingEnabled && (
          <div>
            <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
              Monto mínimo para envío gratis (COP)
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              value={freeShippingMin}
              onChange={(e) => setFreeShippingMin(e.target.value)}
              className="w-48 border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
            />
            <p className="font-brand text-xs text-brand-primary/40 mt-1">
              Pedidos de{' '}
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
                Number(freeShippingMin) || 0
              )}{' '}
              o más tendrán envío gratis.
            </p>
          </div>
        )}
      </div>

      {/* ── Skydropx credentials (visible only when selected) ────── */}
      {provider === 'skydropx' && (
        <div className="border border-brand-primary/10 rounded-2xl p-5 space-y-4 bg-brand-cream/30">
          <p className="font-brand text-sm font-semibold text-brand-primary">
            Credenciales Skydropx
          </p>

          {[
            {
              label: 'Client ID',
              value: clientId,
              onChange: setClientId,
              placeholder: 'Client ID de tu cuenta Skydropx',
              type: 'text',
            },
            {
              label: 'Client Secret',
              value: clientSecret,
              onChange: setClientSecret,
              placeholder: secretPlaceholder,
              type: 'password',
            },
            {
              label: 'Address From ID (bodega de origen)',
              value: addressFromId,
              onChange: setAddressFromId,
              placeholder: 'ID de la dirección de origen en Skydropx',
              type: 'text',
            },
            {
              label: 'Base URL (avanzado)',
              value: baseUrl,
              onChange: setBaseUrl,
              placeholder: 'https://api-pro.skydropx.com',
              type: 'text',
            },
          ].map((field) => (
            <div key={field.label}>
              <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                autoComplete="off"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>
          ))}

          <div className="pt-1 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="font-brand text-xs text-amber-700">
              <strong>Seguridad:</strong> Las credenciales se guardan en la base de datos con acceso
              restringido al rol de servicio. El Client Secret nunca se devuelve completo en la UI.
            </p>
          </div>
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={handleSave}
          disabled={status === 'saving' || isPending}
          className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand text-sm
                     hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'saving' ? 'Guardando...' : 'Guardar configuración'}
        </button>

        {status === 'saved' && (
          <span className="font-brand text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Guardado correctamente
          </span>
        )}

        {status === 'error' && (
          <span className="font-brand text-sm text-red-600">{errorMsg}</span>
        )}
      </div>
    </div>
  )
}
