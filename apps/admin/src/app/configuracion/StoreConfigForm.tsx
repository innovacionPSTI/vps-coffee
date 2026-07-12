'use client'

import { useState, useTransition } from 'react'
import type { StoreConfig } from '@vps/database'
import ImageUpload from '@/components/ImageUpload'

interface Props {
  initialConfig: StoreConfig | null
}

export default function StoreConfigForm({ initialConfig }: Props) {
  const [logoUrl, setLogoUrl]     = useState(initialConfig?.logo_url     ?? '')
  const [whatsapp, setWhatsapp]   = useState(initialConfig?.whatsapp_number ?? '')
  const [storeName, setStoreName] = useState(initialConfig?.store_name   ?? '')
  const [storeEmail, setStoreEmail] = useState(initialConfig?.store_email ?? '')

  // Redes sociales
  const [igUrl, setIgUrl]         = useState(initialConfig?.instagram_url ?? '')
  const [igEnabled, setIgEnabled] = useState(initialConfig?.instagram_enabled ?? true)
  const [fbUrl, setFbUrl]         = useState(initialConfig?.facebook_url ?? '')
  const [fbEnabled, setFbEnabled] = useState(initialConfig?.facebook_enabled ?? true)
  const [ttUrl, setTtUrl]         = useState(initialConfig?.tiktok_url ?? '')
  const [ttEnabled, setTtEnabled] = useState(initialConfig?.tiktok_enabled ?? true)

  // Operaciones
  const [maintenanceMode, setMaintenanceMode] = useState(initialConfig?.maintenance_mode ?? false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(initialConfig?.analytics_enabled ?? false)

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [, startTransition] = useTransition()

  async function handleSave() {
    setStatus('saving')
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url:           logoUrl    || null,
          whatsapp_number:    whatsapp   || null,
          store_name:         storeName  || 'Mi Tienda',
          store_email:        storeEmail || null,
          instagram_url:      igUrl      || null,
          instagram_enabled:  igEnabled,
          facebook_url:       fbUrl      || null,
          facebook_enabled:   fbEnabled,
          tiktok_url:         ttUrl      || null,
          tiktok_enabled:     ttEnabled,
          maintenance_mode:   maintenanceMode,
          analytics_enabled:  analyticsEnabled,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Error desconocido')
        setStatus('error')
        return
      }

      setStatus('saved')
      startTransition(() => { setTimeout(() => setStatus('idle'), 3000) })
    } catch {
      setErrorMsg('Error de red al guardar')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-6">

      {/* Logo */}
      <div>
        <p className="font-brand text-xs font-semibold text-brand-primary mb-1">Logo de la tienda</p>
        <p className="font-brand text-xs text-brand-primary/40 mb-3">
          Aparece en la barra de navegación y el pie de página. PNG o WebP con fondo transparente recomendado.
          Dimensiones sugeridas: <strong>400 × 400 px</strong>.
        </p>
        <div className="w-48">
          <ImageUpload
            value={logoUrl}
            onChange={setLogoUrl}
            bucket="logos"
            label=""
            sizeClass="w-48 h-48"
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5 space-y-4">
        {/* WhatsApp */}
        <div>
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
            Número de WhatsApp
          </label>
          <p className="font-brand text-xs text-brand-primary/40 mb-2">
            Formato internacional sin + ni espacios (ej. 573001234567).
          </p>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="573001234567"
            className="w-64 border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Nombre */}
        <div>
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
            Nombre de la tienda
          </label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Nombre de la tienda"
            className="w-64 border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Email */}
        <div>
          <label className="font-brand text-xs font-semibold text-brand-primary block mb-1">
            Email de contacto
          </label>
          <input
            type="email"
            value={storeEmail}
            onChange={(e) => setStoreEmail(e.target.value)}
            placeholder="contacto@mitienda.com"
            className="w-64 border border-gray-200 rounded-xl px-4 py-2.5 font-brand text-sm focus:outline-none focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Redes sociales */}
      <div className="border-t border-gray-100 pt-5 space-y-4">
        <div>
          <p className="font-brand text-xs font-semibold text-brand-primary mb-0.5">Redes sociales</p>
          <p className="font-brand text-xs text-brand-primary/40">
            Los iconos aparecen en el footer solo si están habilitados y tienen URL.
          </p>
        </div>

        {[
          {
            key: 'instagram',
            label: 'Instagram',
            placeholder: 'https://instagram.com/mitienda',
            url: igUrl, setUrl: setIgUrl,
            enabled: igEnabled, setEnabled: setIgEnabled,
          },
          {
            key: 'facebook',
            label: 'Facebook',
            placeholder: 'https://facebook.com/mitienda',
            url: fbUrl, setUrl: setFbUrl,
            enabled: fbEnabled, setEnabled: setFbEnabled,
          },
          {
            key: 'tiktok',
            label: 'TikTok',
            placeholder: 'https://tiktok.com/@mitienda',
            url: ttUrl, setUrl: setTtUrl,
            enabled: ttEnabled, setEnabled: setTtEnabled,
          },
        ].map((sn) => (
          <div key={sn.key} className="flex items-center gap-3">
            {/* Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={sn.enabled}
              onClick={() => sn.setEnabled((v: boolean) => !v)}
              className={`relative flex-shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                sn.enabled ? 'bg-brand-primary' : 'bg-brand-primary/20'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                sn.enabled ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </button>

            {/* Label */}
            <span className={`font-brand text-xs font-semibold w-20 ${sn.enabled ? 'text-brand-primary' : 'text-brand-primary/30'}`}>
              {sn.label}
            </span>

            {/* URL input */}
            <input
              type="url"
              value={sn.url}
              onChange={(e) => sn.setUrl(e.target.value)}
              placeholder={sn.placeholder}
              disabled={!sn.enabled}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary disabled:opacity-30 disabled:cursor-not-allowed"
            />
          </div>
        ))}
      </div>

      {/* Operaciones del sitio */}
      <div className="border-t border-gray-100 pt-5 space-y-4">
        <div>
          <p className="font-brand text-xs font-semibold text-brand-primary mb-0.5">Operaciones</p>
          <p className="font-brand text-xs text-brand-primary/40">
            Ajustes que afectan la disponibilidad y el comportamiento global del sitio.
          </p>
        </div>

        {/* Modo mantenimiento */}
        <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100">
          <button
            type="button"
            role="switch"
            aria-checked={maintenanceMode}
            onClick={() => setMaintenanceMode((v) => !v)}
            className={`mt-0.5 relative flex-shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              maintenanceMode ? 'bg-red-500' : 'bg-brand-primary/20'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              maintenanceMode ? 'translate-x-4' : 'translate-x-0.5'
            }`} />
          </button>
          <div>
            <p className={`font-brand text-sm font-semibold ${maintenanceMode ? 'text-red-600' : 'text-brand-primary'}`}>
              Modo mantenimiento
              {maintenanceMode && (
                <span className="ml-2 text-xs font-normal bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Activo</span>
              )}
            </p>
            <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
              Muestra una página de &quot;sitio en mantenimiento&quot; a los visitantes. Las APIs y el panel admin siguen funcionando.
            </p>
          </div>
        </div>

        {/* Analytics */}
        <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100">
          <button
            type="button"
            role="switch"
            aria-checked={analyticsEnabled}
            onClick={() => setAnalyticsEnabled((v) => !v)}
            className={`mt-0.5 relative flex-shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              analyticsEnabled ? 'bg-brand-primary' : 'bg-brand-primary/20'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
              analyticsEnabled ? 'translate-x-4' : 'translate-x-0.5'
            }`} />
          </button>
          <div>
            <p className="font-brand text-sm font-semibold text-brand-primary">Vercel Analytics</p>
            <p className="font-brand text-xs text-brand-primary/40 mt-0.5">
              Activa el seguimiento de visitas con Vercel Analytics. No requiere cookies ni afecta la privacidad del usuario.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-50"
        >
          {status === 'saving' ? 'Guardando...' : 'Guardar'}
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
