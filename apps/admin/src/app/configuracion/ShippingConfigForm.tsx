'use client'

import { useState, useTransition } from 'react'
import type { ShippingConfig } from '@vps/database'

interface Props {
  initialConfig: ShippingConfig | null
}

type ProviderTab = 'fixed' | 'skydropx'

const PROVIDER_LABELS: Record<ProviderTab, string> = {
  fixed:    'Tarifa fija',
  skydropx: 'Skydropx',
}

const AVAILABLE_PROVIDERS: ProviderTab[] = ['fixed', 'skydropx']

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-brand-primary' : 'bg-brand-primary/20'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function ShippingConfigForm({ initialConfig }: Props) {
  // ── Provider & rates ────────────────────────────────────────────────────────
  const [provider, setProvider] = useState<ProviderTab>(
    (initialConfig?.provider as ProviderTab) ?? 'fixed'
  )
  const [fixedRate, setFixedRate] = useState(String(initialConfig?.fixed_rate ?? 8000))
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(
    initialConfig?.free_shipping_enabled ?? true
  )
  const [freeShippingMin, setFreeShippingMin] = useState(
    String(initialConfig?.free_shipping_min_amount ?? 100000)
  )

  // ── Skydropx credentials ────────────────────────────────────────────────────
  const [clientId, setClientId]         = useState(initialConfig?.skydropx_client_id ?? '')
  const [clientSecret, setClientSecret] = useState('') // never pre-fill
  const [baseUrl, setBaseUrl]           = useState(
    initialConfig?.skydropx_base_url ?? 'https://app.skydropx.com'
  )

  // ── Origin address ──────────────────────────────────────────────────────────
  const [originName,         setOriginName]         = useState(initialConfig?.origin_name ?? '')
  const [originStreet,       setOriginStreet]       = useState(initialConfig?.origin_street ?? '')
  const [originNeighborhood, setOriginNeighborhood] = useState(initialConfig?.origin_neighborhood ?? '')
  const [originCity,         setOriginCity]         = useState(initialConfig?.origin_city ?? '')
  const [originDepartment,   setOriginDepartment]   = useState(initialConfig?.origin_department ?? '')
  const [originPostalCode,   setOriginPostalCode]   = useState(initialConfig?.origin_postal_code ?? '')
  const [originPhone,        setOriginPhone]        = useState(initialConfig?.origin_phone ?? '')
  const [originEmail,        setOriginEmail]        = useState(initialConfig?.origin_email ?? '')

  // ── UI state ────────────────────────────────────────────────────────────────
  const [status, setStatus]     = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [, startTransition]     = useTransition()

  const secretPlaceholder = initialConfig?.skydropx_client_id
    ? '•••••••• (dejar vacío para no cambiar)'
    : 'Client Secret'

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

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
      if (clientId)     body.skydropx_client_id  = clientId
      if (clientSecret) body.skydropx_client_secret = clientSecret
      body.skydropx_base_url = baseUrl

      body.origin_name         = originName         || null
      body.origin_street       = originStreet       || null
      body.origin_neighborhood = originNeighborhood || null
      body.origin_city         = originCity         || null
      body.origin_department   = originDepartment   || null
      body.origin_postal_code  = originPostalCode   || null
      body.origin_phone        = originPhone        || null
      body.origin_email        = originEmail        || null
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
      setClientSecret('')
      startTransition(() => { setTimeout(() => setStatus('idle'), 3000) })
    } catch {
      setErrorMsg('Error de red al guardar')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Provider selector ──────────────────────────────────────────────── */}
      <div>
        <p className="font-brand text-sm font-semibold text-brand-primary mb-3">Proveedor activo</p>
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
            : 'Tarifas en tiempo real vía API Skydropx PRO. Guías automáticas tras cada pago.'}
        </p>
      </div>

      {/* ── Tarifa fija ────────────────────────────────────────────────────── */}
      <div>
        <label className="font-brand text-sm font-semibold text-brand-primary block mb-1">
          Tarifa fija (COP)
        </label>
        <p className="font-brand text-xs text-brand-primary/40 mb-2">
          Se usa cuando el proveedor es "Tarifa fija" o como respaldo si Skydropx no responde.
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

      {/* ── Envío gratis ───────────────────────────────────────────────────── */}
      <div className="border border-brand-primary/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-brand text-sm font-semibold text-brand-primary">Envío gratis</p>
            <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
              Cuando el subtotal supera el monto mínimo, el envío es gratis automáticamente.
            </p>
          </div>
          <Toggle enabled={freeShippingEnabled} onChange={setFreeShippingEnabled} />
        </div>

        {freeShippingEnabled && (
          <div>
            <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
              Monto mínimo (COP)
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
              Pedidos de {fmt(Number(freeShippingMin) || 0)} o más tendrán envío gratis.
            </p>
          </div>
        )}
      </div>

      {/* ── Skydropx — solo cuando está seleccionado ───────────────────────── */}
      {provider === 'skydropx' && (
        <>
          {/* Credenciales */}
          <div className="border border-brand-primary/10 rounded-2xl p-5 space-y-4 bg-brand-cream/30">
            <p className="font-brand text-sm font-semibold text-brand-primary">Credenciales API</p>
            <p className="font-brand text-xs text-brand-primary/40">
              Obten Client ID y Client Secret en{' '}
              <a
                href="https://pro.skydropx.com/merchant_stores/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                pro.skydropx.com → Aplicaciones
              </a>
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: 'Client ID',     value: clientId,     onChange: setClientId,     placeholder: 'Client ID',     type: 'text'     },
                { label: 'Client Secret', value: clientSecret, onChange: setClientSecret, placeholder: secretPlaceholder, type: 'password' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    placeholder={f.placeholder}
                    autoComplete="off"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
                Base URL (avanzado)
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://app.skydropx.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="font-brand text-xs text-amber-700">
                <strong>Seguridad:</strong> El Client Secret nunca se devuelve completo en la UI.
                Deja el campo vacío si no quieres cambiarlo.
              </p>
            </div>
          </div>

          {/* Dirección de origen */}
          <div className="border border-brand-primary/10 rounded-2xl p-5 space-y-4 bg-brand-cream/30">
            <div>
              <p className="font-brand text-sm font-semibold text-brand-primary">
                Dirección de origen (bodega / remitente)
              </p>
              <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
                Aparece en las guías de envío como remitente y se usa para calcular tarifas en tiempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Nombre / Empresa *</label>
                <input
                  type="text"
                  value={originName}
                  onChange={(e) => setOriginName(e.target.value)}
                  placeholder="Nombre del remitente / empresa"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Teléfono *</label>
                <input
                  type="tel"
                  value={originPhone}
                  onChange={(e) => setOriginPhone(e.target.value)}
                  placeholder="3001234567"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div>
              <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Dirección (calle y número) *</label>
              <input
                type="text"
                value={originStreet}
                onChange={(e) => setOriginStreet(e.target.value)}
                placeholder="Calle 10 # 43-57"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Barrio</label>
                <input
                  type="text"
                  value={originNeighborhood}
                  onChange={(e) => setOriginNeighborhood(e.target.value)}
                  placeholder="Barrio / sector"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Ciudad *</label>
                <input
                  type="text"
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  placeholder="Ciudad de despacho"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Departamento *</label>
                <input
                  type="text"
                  value={originDepartment}
                  onChange={(e) => setOriginDepartment(e.target.value)}
                  placeholder="Departamento"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Código postal *</label>
                <input
                  type="text"
                  value={originPostalCode}
                  onChange={(e) => setOriginPostalCode(e.target.value)}
                  placeholder="050001"
                  maxLength={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div>
              <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">Email de contacto *</label>
              <input
                type="email"
                value={originEmail}
                onChange={(e) => setOriginEmail(e.target.value)}
                placeholder="despachos@mitienda.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>
        </>
      )}

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
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
            Guardado
          </span>
        )}

        {status === 'error' && (
          <span className="font-brand text-sm text-red-600">{errorMsg}</span>
        )}
      </div>
    </div>
  )
}
