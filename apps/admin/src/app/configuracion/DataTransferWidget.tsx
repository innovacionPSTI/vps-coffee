'use client'

import { useRef, useState } from 'react'

type ImportResult = {
  success: boolean
  results: Record<string, string>
}

export default function DataTransferWidget() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleImport(file: File | null | undefined) {
    if (!file) return
    setImporting(true)
    setResult(null)
    setError(null)

    try {
      const text = await file.text()
      const snapshot = JSON.parse(text)
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      })
      const json: ImportResult = await res.json()
      if (res.ok || res.status === 207) {
        setResult(json)
      } else {
        setError((json as { error?: string }).error ?? 'Error al importar')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Archivo inválido o error al procesar')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {/* Export */}
        <a
          href="/api/admin/export"
          download
          className="px-4 py-2 rounded-xl bg-brand-primary text-brand-cream text-sm font-brand font-semibold hover:bg-brand-dark transition-colors"
        >
          ↓ Exportar contenido
        </a>

        {/* Import */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-brand font-semibold text-brand-primary hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {importing ? 'Importando…' : '↑ Importar contenido'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => handleImport(e.target.files?.[0])}
        />
      </div>

      <p className="font-brand text-xs text-brand-primary/40">
        Exporta un snapshot JSON de páginas, secciones, nav, banners y configuración. Importa para restaurar idempotentemente.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-brand text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className={`rounded-xl border px-4 py-3 space-y-1 ${result.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <p className={`font-brand text-sm font-semibold ${result.success ? 'text-green-700' : 'text-yellow-700'}`}>
            {result.success ? '✓ Importación completada' : '⚠ Importación parcial'}
          </p>
          <ul className="space-y-0.5">
            {Object.entries(result.results).map(([key, val]) => (
              <li key={key} className="font-brand text-xs text-brand-primary/60">
                <span className="font-semibold">{key}:</span> {val}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
