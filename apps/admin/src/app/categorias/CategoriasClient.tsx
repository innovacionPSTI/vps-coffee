'use client'

import { useState, useRef } from 'react'
import CategoryFormModal, { type SavedCategory } from './CategoryFormModal'

type Category = SavedCategory

export default function CategoriasClient({ categories: initial }: { categories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(
    [...initial].sort((a, b) => a.order_index - b.order_index)
  )
  const [modal, setModal] = useState<{ open: boolean; category?: Category }>({ open: false })

  // ── Drag-to-reorder ────────────────────────────────────────────────────────
  const dragIndex = useRef<number | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  function handleDragStart(idx: number, id: number) {
    dragIndex.current = idx
    setDraggingId(id)
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    setOverIndex(idx)
  }

  async function handleDrop(e: React.DragEvent, toIdx: number) {
    e.preventDefault()
    const fromIdx = dragIndex.current
    if (fromIdx === null || fromIdx === toIdx) {
      resetDrag()
      return
    }

    const reordered = [...categories]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    // Assign new order_index values
    const updated = reordered.map((c, i) => ({ ...c, order_index: i }))
    setCategories(updated)
    resetDrag()

    // Persist: only update rows whose order_index actually changed
    const changed = updated.filter((c) => {
      const orig = initial.find((o) => o.id === c.id)
      return !orig || c.order_index !== orig.order_index
    })
    await Promise.all(
      changed.map((c) =>
        fetch(`/api/admin/categories/${c.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: c.order_index }),
        })
      )
    )
  }

  function resetDrag() {
    dragIndex.current = null
    setDraggingId(null)
    setOverIndex(null)
  }

  // ── Refresh after modal save ───────────────────────────────────────────────
  function handleModalClose(updated?: SavedCategory) {
    if (updated) {
      setCategories((prev) => {
        const exists = prev.find((c) => c.id === updated.id)
        if (exists) return prev.map((c) => (c.id === updated.id ? updated : c))
        return [...prev, updated].sort((a, b) => a.order_index - b.order_index)
      })
    }
    setModal({ open: false })
  }

  function handleDeleted(id: number) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
    setModal({ open: false })
  }

  return (
    <>
      {modal.open && (
        <CategoryFormModal
          category={modal.category}
          onClose={handleModalClose}
          onDelete={handleDeleted}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-brand-primary text-2xl">Categorías</h1>
            <p className="font-brand text-sm text-brand-primary/50 mt-1">
              {categories.length} categorías · Arrastra para reordenar
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
          {categories.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-brand text-sm text-brand-primary/30 mb-3">No hay categorías.</p>
              <button
                onClick={() => setModal({ open: true })}
                className="font-brand text-sm text-brand-primary underline"
              >
                Crear la primera →
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-8 px-4 py-4" />
                  <th className="font-brand text-xs text-brand-primary/40 text-left px-4 py-4 uppercase tracking-wide">Imagen</th>
                  <th className="font-brand text-xs text-brand-primary/40 text-left px-4 py-4 uppercase tracking-wide">Nombre</th>
                  <th className="font-brand text-xs text-brand-primary/40 text-left px-4 py-4 uppercase tracking-wide hidden sm:table-cell">Slug</th>
                  <th className="font-brand text-xs text-brand-primary/40 text-left px-4 py-4 uppercase tracking-wide hidden md:table-cell">Descripción</th>
                  <th className="font-brand text-xs text-brand-primary/40 text-left px-4 py-4 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categories.map((cat, idx) => (
                  <tr
                    key={cat.id}
                    draggable
                    onDragStart={() => handleDragStart(idx, cat.id)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={resetDrag}
                    className={`transition-colors ${
                      draggingId === cat.id
                        ? 'opacity-40'
                        : overIndex === idx && draggingId !== cat.id
                          ? 'bg-brand-cream/60'
                          : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Drag handle */}
                    <td className="px-4 py-3 cursor-grab active:cursor-grabbing">
                      <svg className="w-4 h-4 text-brand-primary/20" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 6zm0 6a2 2 0 10.001 4.001A2 2 0 007 12zM13 2a2 2 0 10.001 4.001A2 2 0 0013 2zm0 6a2 2 0 10.001 4.001A2 2 0 0013 6zm0 6a2 2 0 10.001 4.001A2 2 0 0013 12z" />
                      </svg>
                    </td>

                    {/* Imagen */}
                    <td className="px-4 py-3">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-brand-cream flex items-center justify-center border border-gray-100">
                          <span className="font-display text-brand-primary/20 text-lg">▲</span>
                        </div>
                      )}
                    </td>

                    {/* Nombre */}
                    <td className="px-4 py-3">
                      <span className="font-brand font-semibold text-sm text-brand-primary">{cat.name}</span>
                    </td>

                    {/* Slug */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <code className="font-brand text-xs bg-brand-cream text-brand-primary/60 px-2 py-1 rounded-lg">
                        {cat.slug}
                      </code>
                    </td>

                    {/* Descripción */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-brand text-sm text-brand-primary/50 line-clamp-1">
                        {cat.description ?? '—'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <span className={`font-brand text-xs font-semibold px-2 py-1 rounded-full ${cat.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {cat.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    {/* Editar */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setModal({ open: true, category: cat })}
                        className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary transition-colors px-3 py-1 rounded-lg hover:bg-brand-cream"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
