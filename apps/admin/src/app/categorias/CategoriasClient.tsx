'use client'

import { useState } from 'react'
import CategoryFormModal from './CategoryFormModal'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  active: boolean
  order_index: number
}

export default function CategoriasClient({ categories }: { categories: Category[] }) {
  const [modal, setModal] = useState<{ open: boolean; category?: Category }>({ open: false })

  return (
    <>
      {modal.open && (
        <CategoryFormModal
          category={modal.category}
          onClose={() => setModal({ open: false })}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-brand-primary text-2xl">Categorías</h1>
            <p className="font-brand text-sm text-brand-primary/50 mt-1">
              {categories.length} categorías registradas
            </p>
          </div>
          <button
            onClick={() => setModal({ open: true })}
            className="font-brand text-sm bg-brand-primary text-brand-cream px-4 py-2 rounded-xl hover:bg-brand-dark transition-colors"
          >
            + Nueva categoría
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">Nombre</th>
                <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">Slug</th>
                <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">Descripción</th>
                <th className="font-brand text-xs text-brand-primary/40 text-left px-6 py-4 uppercase tracking-wide">Estado</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-brand font-semibold text-sm text-brand-primary">{cat.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="font-brand text-xs bg-brand-cream text-brand-primary/60 px-2 py-1 rounded-lg">
                        {cat.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-brand text-sm text-brand-primary/50 line-clamp-1">
                        {cat.description ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-brand text-xs font-semibold px-2 py-1 rounded-full ${cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {cat.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setModal({ open: true, category: cat })}
                        className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary transition-colors px-3 py-1 rounded-lg hover:bg-brand-cream"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <p className="font-brand text-sm text-brand-primary/30 mb-3">No hay categorías.</p>
                    <button
                      onClick={() => setModal({ open: true })}
                      className="font-brand text-sm text-brand-primary underline"
                    >
                      Crear la primera →
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
