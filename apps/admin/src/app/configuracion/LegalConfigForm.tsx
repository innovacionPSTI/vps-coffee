'use client'

import { useState, useTransition } from 'react'

interface Props {
  initialTerms: string | null
  initialPrivacy: string | null
}

type Tab = 'terms' | 'privacy'

const TAB_LABELS: Record<Tab, string> = {
  terms:   'Términos y condiciones',
  privacy: 'Política de privacidad',
}

export default function LegalConfigForm({ initialTerms, initialPrivacy }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('terms')
  const [terms, setTerms] = useState(initialTerms ?? '')
  const [privacy, setPrivacy] = useState(initialPrivacy ?? '')
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
          terms_content: terms || null,
          privacy_content: privacy || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Error desconocido')
        setStatus('error')
        return
      }
      setStatus('saved')
      startTransition(() => {
        setTimeout(() => setStatus('idle'), 3000)
      })
    } catch {
      setErrorMsg('Error de red al guardar')
      setStatus('error')
    }
  }

  const currentValue = activeTab === 'terms' ? terms : privacy
  const setCurrentValue = activeTab === 'terms' ? setTerms : setPrivacy

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full font-brand text-sm transition-colors ${
              activeTab === tab
                ? 'bg-brand-primary text-brand-cream'
                : 'border border-brand-primary/30 text-brand-primary/60 hover:border-brand-primary'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="font-brand text-xs text-brand-primary/40">
        Escribe en Markdown. Usa <code className="bg-brand-primary/5 px-1 rounded">## Título</code>,{' '}
        <code className="bg-brand-primary/5 px-1 rounded">**negrita**</code>,{' '}
        <code className="bg-brand-primary/5 px-1 rounded">- lista</code>, etc.
        El contenido se renderiza en{' '}
        <a
          href={activeTab === 'terms' ? '/terminos' : '/privacidad'}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-primary"
        >
          /{activeTab === 'terms' ? 'terminos' : 'privacidad'} ↗
        </a>
      </p>

      {/* Editor */}
      <textarea
        key={activeTab}
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        rows={20}
        placeholder={`# ${TAB_LABELS[activeTab]}\n\nEscribe el contenido aquí en Markdown...`}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm text-brand-primary focus:outline-none focus:border-brand-primary resize-y leading-relaxed"
      />

      {/* Contador */}
      <p className="font-brand text-xs text-brand-primary/30 text-right">
        {currentValue.length.toLocaleString()} caracteres
      </p>

      {/* Acciones */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="bg-brand-primary text-brand-cream rounded-full px-6 py-2.5 font-brand text-sm
                     hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'saving' ? 'Guardando...' : 'Guardar contenido legal'}
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
