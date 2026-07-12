'use client'

import { useState } from 'react'
import BannerFormModal from './BannerFormModal'

interface Banner {
  id: number
  section: string
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
  heroBanners: Banner[]
}

export default function BannersClient({ heroBanners }: Props) {
  const [modal, setModal] = useState<{
    open: boolean
    banner?: Banner
    defaultSection?: string
  }>({ open: false })

  return (
    <>
      {modal.open && (
        <BannerFormModal
          banner={modal.banner}
          defaultSection={modal.defaultSection}
          onClose={() => setModal({ open: false })}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-brand-primary text-2xl">Banners</h1>
          <button
            onClick={() => setModal({ open: true, defaultSection: 'hero' })}
            className="font-brand text-sm bg-brand-primary text-brand-cream px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors"
          >
            + Agregar banner
          </button>
        </div>

        {/* Hero */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-brand font-semibold text-brand-primary">
              Hero Principal
              <span className="ml-2 text-xs text-brand-primary/40 font-normal">Carrusel</span>
            </h2>
            <button
              onClick={() => setModal({ open: true, defaultSection: 'hero' })}
              className="font-brand text-xs text-brand-primary border border-brand-primary/20 px-3 py-1.5 rounded-lg hover:bg-brand-cream transition-colors"
            >
              + Agregar slide
            </button>
          </div>

          {heroBanners.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-xl">
              <p className="font-brand text-sm text-brand-primary/30 mb-3">No hay slides en el carrusel.</p>
              <button
                onClick={() => setModal({ open: true, defaultSection: 'hero' })}
                className="font-brand text-sm text-brand-primary underline"
              >
                Agregar el primero →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {heroBanners.map((banner) => (
                <BannerCard
                  key={banner.id}
                  banner={banner}
                  onEdit={() => setModal({ open: true, banner })}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </>
  )
}

function BannerCard({ banner, onEdit }: { banner: Banner; onEdit: () => void }) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden group">
      <div
        className="h-36 relative flex items-center justify-center overflow-hidden"
        style={{ background: !banner.image_url ? (banner.bg_color ?? '#614A2A') : undefined }}
      >
        {banner.image_url ? (
          <img src={banner.image_url} alt={banner.title ?? ''} className="w-full h-full object-cover" />
        ) : (
          <p className="font-display text-brand-cream text-base text-center px-3">{banner.title}</p>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="font-brand text-xs bg-white text-brand-primary px-3 py-1.5 rounded-lg hover:bg-brand-cream"
          >
            Editar
          </button>
        </div>
      </div>
      <div className="p-3">
        <p className="font-brand text-sm font-semibold text-brand-primary truncate">{banner.title ?? '(Sin título)'}</p>
        <p className="font-brand text-xs text-brand-primary/40 truncate">{banner.subtitle ?? '—'}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            <span className={`font-brand text-xs rounded-full px-2 py-0.5 ${banner.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
              {banner.active ? 'Activo' : 'Inactivo'}
            </span>
            {banner.image_url_mobile && (
              <span className="font-brand text-xs rounded-full px-2 py-0.5 bg-blue-100 text-blue-600" title="Tiene imagen mobile">
                📱
              </span>
            )}
          </div>
          <button onClick={onEdit} className="font-brand text-xs text-brand-primary underline">
            Editar
          </button>
        </div>
      </div>
    </div>
  )
}
