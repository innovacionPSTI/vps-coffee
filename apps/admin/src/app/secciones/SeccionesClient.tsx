'use client'

import { useState, useTransition } from 'react'
import ServicioFormModal from './ServicioFormModal'
import { useRouter } from 'next/navigation'

interface SectionSetting {
  key: string
  label: string
  description: string | null
  enabled: boolean
  order_index: number
}

interface Servicio {
  id: number
  title: string | null
  subtitle: string | null
  cta_text: string | null
  cta_url: string | null
  image_url: string | null
  image_url_mobile: string | null
  bg_color: string | null
  active: boolean
  order_index: number
}

interface Props {
  sections: SectionSetting[]
  servicios: Servicio[]
}

const SECTION_ICONS: Record<string, string> = {
  hero:              '🖼️',
  featured_products: '⭐',
  services:          '🛠️',
  best_sellers:      '🏆',
  blog_preview:      '✍️',
  newsletter:        '📧',
}

export default function SeccionesClient({ sections, servicios }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [toggling, setToggling] = useState<string | null>(null)
  const [modal, setModal] = useState<{ open: boolean; servicio?: Servicio }>({ open: false })

  async function toggleSection(key: string, enabled: boolean) {
    setToggling(key)
    await fetch(`/api/admin/sections/${key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    setToggling(null)
    startTransition(() => router.refresh())
  }

  return (
    <>
      {modal.open && (
        <ServicioFormModal
          servicio={modal.servicio}
          onClose={() => setModal({ open: false })}
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="font-display text-brand-primary text-2xl">Secciones del sitio</h1>
          <p className="font-brand text-sm text-brand-primary/50 mt-1">
            Activa o desactiva cada sección de la portada. Los cambios se aplican en tiempo real.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Cabecera de sección */}
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{SECTION_ICONS[section.key] ?? '📄'}</span>
                  <div>
                    <p className="font-brand font-semibold text-brand-primary">{section.label}</p>
                    {section.description && (
                      <p className="font-brand text-xs text-brand-primary/40 mt-0.5">{section.description}</p>
                    )}
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleSection(section.key, !section.enabled)}
                  disabled={toggling === section.key}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                    section.enabled ? 'bg-brand-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                      section.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Panel expandido para "Servicios" */}
              {section.key === 'services' && (
                <div className="border-t border-gray-100 px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-brand text-xs font-semibold text-brand-primary/60 uppercase tracking-wide">
                      Paneles de servicio
                    </p>
                    <button
                      onClick={() => setModal({ open: true })}
                      className="font-brand text-xs text-brand-primary border border-brand-primary/20 px-3 py-1.5 rounded-lg hover:bg-brand-cream transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>

                  {servicios.length === 0 ? (
                    <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-xl">
                      <p className="font-brand text-sm text-brand-primary/30 mb-2">No hay servicios configurados.</p>
                      <button
                        onClick={() => setModal({ open: true })}
                        className="font-brand text-sm text-brand-primary underline"
                      >
                        Agregar el primero →
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {servicios.map((s) => (
                        <ServicioCard
                          key={s.id}
                          servicio={s}
                          onEdit={() => setModal({ open: true, servicio: s })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="font-brand text-xs text-brand-primary/30 text-center pb-4">
          Las secciones se cargan con caché de 60 segundos en el sitio público.
        </p>
      </div>
    </>
  )
}

function ServicioCard({ servicio, onEdit }: { servicio: Servicio; onEdit: () => void }) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden group">
      <div
        className="h-28 relative flex items-center justify-center"
        style={{ background: !servicio.image_url ? (servicio.bg_color ?? '#614A2A') : undefined }}
      >
        {servicio.image_url ? (
          <img src={servicio.image_url} alt={servicio.title ?? ''} className="w-full h-full object-cover" />
        ) : (
          <p className="font-display text-brand-cream text-sm text-center px-3">{servicio.title}</p>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="font-brand text-xs bg-white text-brand-primary px-3 py-1.5 rounded-lg"
          >
            Editar
          </button>
        </div>
      </div>
      <div className="p-3">
        <p className="font-brand text-sm font-semibold text-brand-primary truncate">{servicio.title ?? '(Sin título)'}</p>
        <p className="font-brand text-xs text-brand-primary/40 truncate">{servicio.subtitle ?? '—'}</p>
        <div className="flex items-center justify-between mt-2">
          <span className={`font-brand text-xs rounded-full px-2 py-0.5 ${servicio.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {servicio.active ? 'Activo' : 'Inactivo'}
          </span>
          <button onClick={onEdit} className="font-brand text-xs text-brand-primary underline">Editar</button>
        </div>
      </div>
    </div>
  )
}
