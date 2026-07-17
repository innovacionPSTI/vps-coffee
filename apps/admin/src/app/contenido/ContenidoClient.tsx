'use client'

import { useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Page {
  key: string
  label: string
  slug: string
  page_type: string
  enabled: boolean
  show_in_footer: boolean
  meta_title: string | null
  meta_description: string | null
  order_index: number
}

interface NavItem {
  id: number
  label: string
  href: string | null
  page_key: string | null
  enabled: boolean
  order_index: number
  parent_id: number | null
}

interface PageSection {
  id: number
  page_key: string
  section_type: string
  title: string | null
  subtitle: string | null
  body: string | null
  image_url: string | null
  cta_label: string | null
  cta_url: string | null
  enabled: boolean
  order_index: number
  settings: unknown
}

interface SectionItem {
  id: number
  section_id: number
  item_type: string
  icon: string | null
  title: string | null
  description: string | null
  question: string | null
  answer: string | null
  image_url: string | null
  image_url_mobile: string | null
  link_url: string | null
  cta_text: string | null
  metadata: Record<string, unknown> | null
  enabled: boolean
  order_index: number
}

interface Props {
  initialPages: Page[]
  initialNavItems: NavItem[]
  initialSections: PageSection[]
  initialItems: SectionItem[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_TYPE_LABELS: Record<string, string> = {
  landing:  'Landing',
  services: 'Servicios',
  about:    'Acerca de',
  faq:      'FAQ',
  custom:   'Personalizada',
}

const SECTION_TYPE_OPTIONS = [
  { value: 'hero',              label: '🖼️ Hero (carrusel)' },
  { value: 'text',              label: '📝 Texto' },
  { value: 'cards',             label: '🃏 Tarjetas' },
  { value: 'faq',               label: '❓ FAQ' },
  { value: 'cta',               label: '📣 CTA' },
  { value: 'testimonials',      label: '⭐ Testimonios' },
  { value: 'services',          label: '🛠️ Servicios (carrusel)' },
  { value: 'featured_products', label: '🌟 Productos destacados' },
  { value: 'best_sellers',      label: '🏆 Más vendidos' },
  { value: 'historia',          label: '📖 Historia / Banner' },
  { value: 'blog_preview',      label: '📰 Blog preview' },
  { value: 'newsletter',        label: '📨 Newsletter' },
  { value: 'whatsapp',          label: '💬 WhatsApp' },
]

const SECTION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  SECTION_TYPE_OPTIONS.map((o) => [o.value, o.label])
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={onChange}
      className={`relative flex-shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        value ? 'bg-brand-primary' : 'bg-brand-primary/20'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        value ? 'translate-x-4' : 'translate-x-0.5'
      }`} />
    </button>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ContenidoClient({
  initialPages,
  initialNavItems,
  initialSections,
  initialItems,
}: Props) {
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [navItems, setNavItems] = useState<NavItem[]>(initialNavItems)
  const [sections, setSections] = useState<PageSection[]>(initialSections)
  const [items, setItems] = useState<SectionItem[]>(initialItems)

  const [selectedPageKey, setSelectedPageKey] = useState<string | null>(
    initialPages[0]?.key ?? null
  )
  const [error, setError] = useState('')

  // ── Nav editing state ──────────────────────────────────────────────────────
  const [expandedNavId, setExpandedNavId] = useState<number | null>(null)
  // Edits for the single currently-open nav editor
  const [editLabel, setEditLabel] = useState('')
  const [editHref, setEditHref] = useState('')
  const [showNewNav, setShowNewNav] = useState(false)
  const [newNavItem, setNewNavItem] = useState({
    label: '', href: '', page_key: '', parent_id: '',
  })
  const [creatingNav, setCreatingNav] = useState(false)

  // ── New page form ──────────────────────────────────────────────────────────
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPage, setNewPage] = useState({ key: '', label: '', slug: '', page_type: 'custom' })
  const [creatingPage, setCreatingPage] = useState(false)

  // ── New section form ───────────────────────────────────────────────────────
  const [showNewSection, setShowNewSection] = useState(false)
  const [newSectionType, setNewSectionType] = useState('text')
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [addingSection, setAddingSection] = useState(false)

  const [expandedSection, setExpandedSection] = useState<number | null>(null)

  // ── New item form ──────────────────────────────────────────────────────────
  const [showNewItem, setShowNewItem] = useState<number | null>(null)
  const [newItem, setNewItem] = useState<Partial<SectionItem>>({
    item_type: 'card', icon: '', title: '', description: '',
  })

  const selectedPage = pages.find((p) => p.key === selectedPageKey) ?? null
  const pageSections = sections
    .filter((s) => s.page_key === selectedPageKey)
    .sort((a, b) => a.order_index - b.order_index)

  const topLevelNav = navItems
    .filter((i) => i.parent_id === null)
    .sort((a, b) => a.order_index - b.order_index)

  // ── API helpers ────────────────────────────────────────────────────────────

  const apiPage = useCallback(async (method: string, body?: object, qs?: string) => {
    const res = await fetch(`/api/admin/cms/pages${qs ?? ''}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Error')
    return data
  }, [])

  const apiSection = useCallback(async (method: string, body?: object, qs?: string) => {
    const res = await fetch(`/api/admin/cms/sections${qs ?? ''}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Error')
    return data
  }, [])

  const apiItem = useCallback(async (method: string, body?: object, qs?: string) => {
    const res = await fetch(`/api/admin/cms/items${qs ?? ''}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Error')
    return data
  }, [])

  const apiNav = useCallback(async (method: string, body?: object, qs?: string) => {
    const res = await fetch(`/api/admin/nav${qs ?? ''}`, {
      method, headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Error')
    return data
  }, [])

  // ── Nav actions ────────────────────────────────────────────────────────────

  async function patchNav(id: number, fields: Partial<NavItem>) {
    setError('')
    try {
      const data = await apiNav('PATCH', { id, ...fields })
      setNavItems((prev) => prev.map((n) => (n.id === id ? { ...n, ...data } : n)))
      return data
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar nav')
    }
  }

  /** Vincula un nav item a una página Y sincroniza href con el slug de la página.
   *  Si el editor inline está abierto para ese nav item, actualiza editHref inmediatamente. */
  async function linkNavToPage(navId: number, pageKey: string | null) {
    const linkedPage = pageKey ? pages.find((p) => p.key === pageKey) : null
    const hrefUpdate = linkedPage ? `/${linkedPage.slug}` : undefined
    // Actualizar el input inmediatamente si el editor está abierto para este nav
    if (hrefUpdate !== undefined && expandedNavId === navId) {
      setEditHref(hrefUpdate)
    }
    setError('')
    try {
      const data = await apiNav('PATCH', {
        id: navId,
        page_key: pageKey,
        ...(hrefUpdate !== undefined ? { href: hrefUpdate } : {}),
      })
      setNavItems((prev) => prev.map((n) => (n.id === navId ? { ...n, ...data } : n)))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al vincular nav')
    }
  }

  async function saveNavEdits(id: number) {
    await patchNav(id, { label: editLabel, href: editHref || null })
    setExpandedNavId(null)
  }

  async function createNavItem() {
    if (!newNavItem.label) return
    setCreatingNav(true)
    setError('')
    try {
      const pageKey = newNavItem.page_key || null
      const linkedPage = pageKey ? pages.find((p) => p.key === pageKey) : null
      // href: explicit override > auto from page slug > null
      const href = newNavItem.href || (linkedPage ? `/${linkedPage.slug}` : null)
      const data = await apiNav('POST', {
        label: newNavItem.label,
        href,
        page_key: pageKey,
        parent_id: newNavItem.parent_id ? Number(newNavItem.parent_id) : null,
        enabled: true,
        order_index: navItems.filter((n) => !n.parent_id).length,
      })
      setNavItems((prev) => [...prev, data])
      setNewNavItem({ label: '', href: '', page_key: '', parent_id: '' })
      setShowNewNav(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear elemento de nav')
    } finally {
      setCreatingNav(false)
    }
  }

  async function deleteNav(id: number) {
    if (!confirm('¿Eliminar este elemento del menú y sus hijos?')) return
    setError('')
    try {
      await apiNav('DELETE', undefined, `?id=${id}`)
      // Remove item and any children
      setNavItems((prev) => prev.filter((n) => n.id !== id && n.parent_id !== id))
      if (expandedNavId === id) setExpandedNavId(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar nav')
    }
  }

  // ── Page actions ───────────────────────────────────────────────────────────

  async function createPage() {
    if (!newPage.key || !newPage.label || !newPage.slug) return
    setCreatingPage(true)
    setError('')
    try {
      const data = await apiPage('POST', {
        ...newPage, enabled: true, show_in_footer: false, order_index: pages.length,
      })
      setPages((prev) => [...prev, data])
      setSelectedPageKey(data.key)
      setNewPage({ key: '', label: '', slug: '', page_type: 'custom' })
      setShowNewPage(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear página')
    } finally {
      setCreatingPage(false)
    }
  }

  async function patchPage(key: string, fields: Partial<Page>) {
    setError('')
    try {
      const data = await apiPage('PATCH', { key, ...fields })
      setPages((prev) => prev.map((p) => (p.key === key ? { ...p, ...data } : p)))

      // Si cambió el slug, sincronizar href de todos los nav items vinculados
      if (fields.slug) {
        const linkedNavs = navItems.filter((n) => n.page_key === key)
        for (const nav of linkedNavs) {
          await patchNav(nav.id, { href: `/${fields.slug}` })
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    }
  }

  async function deletePage(key: string) {
    if (!confirm('¿Eliminar esta página y todas sus secciones?')) return
    setError('')
    try {
      await apiPage('DELETE', undefined, `?key=${key}`)
      setPages((prev) => prev.filter((p) => p.key !== key))
      setSections((prev) => prev.filter((s) => s.page_key !== key))
      if (selectedPageKey === key) setSelectedPageKey(pages.find((p) => p.key !== key)?.key ?? null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  // ── Section actions ────────────────────────────────────────────────────────

  async function createSection() {
    if (!selectedPageKey) return
    setAddingSection(true)
    setError('')
    try {
      const data = await apiSection('POST', {
        page_key: selectedPageKey,
        section_type: newSectionType,
        title: newSectionTitle || null,
        order_index: pageSections.length * 10,
        enabled: true,
        settings: {},
      })
      setSections((prev) => [...prev, data])
      setNewSectionType('text')
      setNewSectionTitle('')
      setShowNewSection(false)
      setExpandedSection(data.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear sección')
    } finally {
      setAddingSection(false)
    }
  }

  async function patchSection(id: number, fields: Partial<PageSection>) {
    setError('')
    try {
      const data = await apiSection('PATCH', { id, ...fields })
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar sección')
    }
  }

  async function deleteSection(id: number) {
    if (!confirm('¿Eliminar esta sección?')) return
    setError('')
    try {
      await apiSection('DELETE', undefined, `?id=${id}`)
      setSections((prev) => prev.filter((s) => s.id !== id))
      setItems((prev) => prev.filter((i) => i.section_id !== id))
      if (expandedSection === id) setExpandedSection(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar sección')
    }
  }

  // ── Section item actions ───────────────────────────────────────────────────

  async function createItem(sectionId: number, sectionType: string) {
    setError('')
    const itemType = sectionType === 'cards' ? 'card'
      : sectionType === 'hero'     ? 'slide'
      : sectionType === 'services' ? 'service'
      : sectionType === 'testimonials' ? 'testimonial'
      : 'faq'
    try {
      const data = await apiItem('POST', {
        section_id: sectionId,
        item_type: itemType,
        icon: newItem.icon ?? null,
        title: newItem.title ?? null,
        description: newItem.description ?? null,
        question: newItem.question ?? null,
        answer: newItem.answer ?? null,
        image_url: (newItem as Partial<SectionItem>).image_url ?? null,
        image_url_mobile: (newItem as Partial<SectionItem>).image_url_mobile ?? null,
        link_url: (newItem as Partial<SectionItem>).link_url ?? null,
        cta_text: (newItem as Partial<SectionItem>).cta_text ?? null,
        metadata: (newItem as Partial<SectionItem>).metadata ?? {},
        enabled: true,
        order_index: items.filter((i) => i.section_id === sectionId).length * 10,
      })
      setItems((prev) => [...prev, data])
      setNewItem({ item_type: itemType, icon: '', title: '', description: '' })
      setShowNewItem(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear ítem')
    }
  }

  async function patchItem(id: number, fields: Partial<SectionItem>) {
    setError('')
    try {
      const data = await apiItem('PATCH', { id, ...fields })
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar ítem')
    }
  }

  async function deleteItem(id: number) {
    setError('')
    try {
      await apiItem('DELETE', undefined, `?id=${id}`)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar ítem')
    }
  }

  // ── Field editor helper ────────────────────────────────────────────────────

  function FieldInput({
    label, value, onSave, multiline = false, placeholder,
  }: {
    label: string; value: string; onSave: (v: string) => void
    multiline?: boolean; placeholder?: string
  }) {
    const [local, setLocal] = useState(value)
    const changed = local !== value
    const Tag = multiline ? 'textarea' : 'input'
    return (
      <div>
        <label className="font-brand text-xs font-semibold text-brand-primary/50 block mb-1">{label}</label>
        <div className="flex gap-2">
          <Tag
            value={local}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setLocal(e.target.value)}
            placeholder={placeholder}
            rows={multiline ? 3 : undefined}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary resize-none"
          />
          {changed && (
            <button
              onClick={() => onSave(local)}
              className="font-brand text-xs bg-brand-primary text-brand-cream px-3 py-1.5 rounded-lg hover:bg-brand-dark transition-colors flex-shrink-0"
            >
              ✓
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 min-h-0">

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <aside className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col overflow-y-auto">

        {/* ── Nav section ────────────────────────────────────────────────── */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="font-brand text-xs font-semibold text-brand-primary/50 uppercase tracking-wide">
              Navegación
            </p>
            <button
              onClick={() => { setShowNewNav(true); setExpandedNavId(null) }}
              className="font-brand text-xs text-brand-primary hover:text-brand-dark transition-colors"
            >
              + Elemento
            </button>
          </div>

          <div className="space-y-1">
            {topLevelNav.map((nav) => {
              const linkedPage = nav.page_key ? pages.find((p) => p.key === nav.page_key) : null
              const isExpanded = expandedNavId === nav.id

              return (
                <div key={nav.id}>
                  {/* Nav row */}
                  <div className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${
                    isExpanded ? 'bg-brand-primary/5' : 'hover:bg-gray-50'
                  }`}>
                    <Toggle
                      value={nav.enabled}
                      onChange={() => patchNav(nav.id, { enabled: !nav.enabled })}
                    />
                    <button
                      onClick={() => linkedPage && setSelectedPageKey(linkedPage.key)}
                      className="flex-1 text-left min-w-0"
                    >
                      <span className="font-brand text-sm text-brand-primary/80 truncate block">{nav.label}</span>
                      {(linkedPage ?? nav.href) && (
                        <span className="font-brand text-xs text-brand-primary/30 truncate block">
                          {linkedPage ? `↗ /${linkedPage.slug}` : nav.href}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedNavId(null)
                        } else {
                          setExpandedNavId(nav.id)
                          setEditLabel(nav.label)
                          setEditHref(nav.href ?? '')
                        }
                      }}
                      className="font-brand text-xs text-brand-primary/30 hover:text-brand-primary transition-colors flex-shrink-0"
                      title="Editar"
                    >
                      ✏
                    </button>
                  </div>

                  {/* Nav inline editor */}
                  {isExpanded && (
                    <div className="ml-2 mr-1 mb-2 bg-gray-50 rounded-xl p-3 space-y-2.5">
                      <div>
                        <label className="font-brand text-xs font-semibold text-brand-primary/50 block mb-1">
                          Nombre en menú
                        </label>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="font-brand text-xs font-semibold text-brand-primary/50 block mb-1">
                          Ruta (href)
                          {linkedPage && (
                            <span className="ml-1 text-brand-primary/30 font-normal">
                              vinculada a /{linkedPage.slug}
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={editHref}
                          onChange={(e) => setEditHref(e.target.value)}
                          placeholder={linkedPage ? `/${linkedPage.slug}` : '/mi-ruta'}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="font-brand text-xs font-semibold text-brand-primary/50 block mb-1">
                          Página vinculada
                        </label>
                        <select
                          value={nav.page_key ?? ''}
                          onChange={(e) => {
                            const pk = e.target.value || null
                            // Actualizar href inmediatamente antes de llamar la API
                            const p = pk ? pages.find((pg) => pg.key === pk) : null
                            if (p) setEditHref(`/${p.slug}`)
                            linkNavToPage(nav.id, pk)
                          }}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none"
                        >
                          <option value="">— Libre (usa Ruta) —</option>
                          {pages.map((p) => (
                            <option key={p.key} value={p.key}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={() => saveNavEdits(nav.id)}
                          className="bg-brand-primary text-brand-cream rounded-full px-3 py-1 font-brand text-xs hover:bg-brand-dark transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => deleteNav(nav.id)}
                          className="font-brand text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Child nav items (1 nivel) */}
                  {navItems
                    .filter((c) => c.parent_id === nav.id)
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((child) => {
                      const childPage = child.page_key ? pages.find((p) => p.key === child.page_key) : null
                      const isChildExpanded = expandedNavId === child.id
                      return (
                        <div key={child.id} className="ml-5">
                          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${
                            isChildExpanded ? 'bg-brand-primary/5' : 'hover:bg-gray-50'
                          }`}>
                            <Toggle
                              value={child.enabled}
                              onChange={() => patchNav(child.id, { enabled: !child.enabled })}
                            />
                            <button
                              onClick={() => childPage && setSelectedPageKey(childPage.key)}
                              className="flex-1 text-left min-w-0"
                            >
                              <span className="font-brand text-xs text-brand-primary/70 truncate block">{child.label}</span>
                              {(childPage ?? child.href) && (
                                <span className="font-brand text-xs text-brand-primary/30 truncate block">
                                  {childPage ? `↗ /${childPage.slug}` : child.href}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                if (isChildExpanded) {
                                  setExpandedNavId(null)
                                } else {
                                  setExpandedNavId(child.id)
                                  setEditLabel(child.label)
                                  setEditHref(child.href ?? '')
                                }
                              }}
                              className="font-brand text-xs text-brand-primary/30 hover:text-brand-primary flex-shrink-0"
                            >
                              ✏
                            </button>
                          </div>
                          {isChildExpanded && (
                            <div className="ml-1 mr-1 mb-2 bg-gray-50 rounded-xl p-3 space-y-2.5">
                              <div>
                                <label className="font-brand text-xs font-semibold text-brand-primary/50 block mb-1">Nombre</label>
                                <input
                                  type="text"
                                  value={editLabel}
                                  onChange={(e) => setEditLabel(e.target.value)}
                                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none focus:border-brand-primary"
                                />
                              </div>
                              <div>
                                <label className="font-brand text-xs font-semibold text-brand-primary/50 block mb-1">
                                  Ruta
                                  {childPage && (
                                    <span className="ml-1 text-brand-primary/30 font-normal">
                                      vinculada a /{childPage.slug}
                                    </span>
                                  )}
                                </label>
                                <input
                                  type="text"
                                  value={editHref}
                                  onChange={(e) => setEditHref(e.target.value)}
                                  placeholder={childPage ? `/${childPage.slug}` : '/ruta'}
                                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none focus:border-brand-primary"
                                />
                              </div>
                              <div>
                                <label className="font-brand text-xs font-semibold text-brand-primary/50 block mb-1">Página vinculada</label>
                                <select
                                  value={child.page_key ?? ''}
                                  onChange={(e) => {
                                    const pk = e.target.value || null
                                    const p = pk ? pages.find((pg) => pg.key === pk) : null
                                    if (p) setEditHref(`/${p.slug}`)
                                    linkNavToPage(child.id, pk)
                                  }}
                                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none"
                                >
                                  <option value="">— Libre —</option>
                                  {pages.map((p) => (
                                    <option key={p.key} value={p.key}>{p.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-center justify-between pt-1">
                                <button
                                  onClick={() => saveNavEdits(child.id)}
                                  className="bg-brand-primary text-brand-cream rounded-full px-3 py-1 font-brand text-xs hover:bg-brand-dark transition-colors"
                                >
                                  Guardar
                                </button>
                                <button
                                  onClick={() => deleteNav(child.id)}
                                  className="font-brand text-xs text-red-400 hover:text-red-600 transition-colors"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              )
            })}
          </div>

          {/* New nav item form */}
          {showNewNav && (
            <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="font-brand text-xs font-semibold text-brand-primary">Nuevo elemento</p>
              <input
                type="text"
                value={newNavItem.label}
                onChange={(e) => setNewNavItem((p) => ({ ...p, label: e.target.value }))}
                placeholder="Nombre en menú"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none focus:border-brand-primary"
              />
              <input
                type="text"
                value={newNavItem.href}
                onChange={(e) => setNewNavItem((p) => ({ ...p, href: e.target.value }))}
                placeholder="Ruta (ej: /servicios) — opcional si vincula página"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none focus:border-brand-primary"
              />
              <div>
                <label className="font-brand text-xs text-brand-primary/50 block mb-1">Página vinculada</label>
                <select
                  value={newNavItem.page_key}
                  onChange={(e) => {
                    const pk = e.target.value
                    const p = pk ? pages.find((pg) => pg.key === pk) : null
                    setNewNavItem((prev) => ({
                      ...prev,
                      page_key: pk,
                      href: p ? `/${p.slug}` : prev.href,
                    }))
                  }}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none"
                >
                  <option value="">— Sin página —</option>
                  {pages.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-brand text-xs text-brand-primary/50 block mb-1">Subelemento de</label>
                <select
                  value={newNavItem.parent_id}
                  onChange={(e) => setNewNavItem((p) => ({ ...p, parent_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none"
                >
                  <option value="">— Nivel raíz —</option>
                  {topLevelNav.map((n) => (
                    <option key={n.id} value={String(n.id)}>{n.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createNavItem}
                  disabled={creatingNav || !newNavItem.label}
                  className="flex-1 bg-brand-primary text-brand-cream rounded-lg py-1.5 font-brand text-xs hover:bg-brand-dark transition-colors disabled:opacity-40"
                >
                  {creatingNav ? 'Creando…' : 'Crear'}
                </button>
                <button
                  onClick={() => setShowNewNav(false)}
                  className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Pages list ─────────────────────────────────────────────────── */}
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="font-brand text-xs font-semibold text-brand-primary/50 uppercase tracking-wide">
              Páginas
            </p>
            <button
              onClick={() => setShowNewPage(true)}
              className="font-brand text-xs text-brand-primary hover:text-brand-dark transition-colors"
            >
              + Nueva
            </button>
          </div>
          <div className="space-y-1">
            {pages.map((page) => (
              <button
                key={page.key}
                onClick={() => setSelectedPageKey(page.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors text-left ${
                  selectedPageKey === page.key
                    ? 'bg-brand-primary text-brand-cream'
                    : 'hover:bg-gray-50 text-brand-primary/70'
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${page.enabled ? 'bg-green-400' : 'bg-gray-200'}`} />
                <span className="font-brand text-sm flex-1 truncate">{page.label}</span>
                <span className={`font-brand text-xs px-1.5 py-0.5 rounded ${
                  selectedPageKey === page.key ? 'bg-brand-cream/20 text-brand-cream/70' : 'bg-gray-100 text-brand-primary/40'
                }`}>
                  {PAGE_TYPE_LABELS[page.page_type] ?? page.page_type}
                </span>
              </button>
            ))}
          </div>

          {showNewPage && (
            <div className="mt-4 bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="font-brand text-xs font-semibold text-brand-primary">Nueva página</p>
              {(['key', 'label', 'slug'] as const).map((field) => (
                <input
                  key={field}
                  type="text"
                  value={newPage[field]}
                  onChange={(e) => setNewPage((prev) => ({ ...prev, [field]: e.target.value }))}
                  placeholder={
                    field === 'key' ? 'Clave única (ej: servicios)' :
                    field === 'label' ? 'Nombre visible' : 'URL slug (ej: servicios)'
                  }
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none focus:border-brand-primary"
                />
              ))}
              <select
                value={newPage.page_type}
                onChange={(e) => setNewPage((prev) => ({ ...prev, page_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-xs focus:outline-none"
              >
                {Object.entries(PAGE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={createPage}
                  disabled={creatingPage || !newPage.key || !newPage.label || !newPage.slug}
                  className="flex-1 bg-brand-primary text-brand-cream rounded-lg py-1.5 font-brand text-xs hover:bg-brand-dark transition-colors disabled:opacity-40"
                >
                  {creatingPage ? 'Creando…' : 'Crear'}
                </button>
                <button onClick={() => setShowNewPage(false)} className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary">
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Right panel: Page editor ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2 font-brand text-sm text-red-600">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {!selectedPage ? (
          <div className="flex items-center justify-center h-full text-brand-primary/30 font-brand text-sm">
            Selecciona una página del panel izquierdo
          </div>
        ) : (
          <div className="p-6 space-y-8 max-w-3xl">

            {/* ── Page metadata ───────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg text-brand-primary">{selectedPage.label}</h2>
                  <p className="font-brand text-xs text-brand-primary/40">/{selectedPage.slug}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Toggle
                      value={selectedPage.enabled}
                      onChange={() => patchPage(selectedPage.key, { enabled: !selectedPage.enabled })}
                    />
                    <span className="font-brand text-xs text-brand-primary/50">Habilitada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Toggle
                      value={selectedPage.show_in_footer}
                      onChange={() => patchPage(selectedPage.key, { show_in_footer: !selectedPage.show_in_footer })}
                    />
                    <span className="font-brand text-xs text-brand-primary/50">Footer</span>
                  </div>
                  <button
                    onClick={() => deletePage(selectedPage.key)}
                    className="font-brand text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Eliminar página
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldInput
                  label="Etiqueta"
                  value={selectedPage.label}
                  onSave={(v) => patchPage(selectedPage.key, { label: v })}
                  placeholder="Nombre visible"
                />
                <FieldInput
                  label="Slug / URL"
                  value={selectedPage.slug}
                  onSave={(v) => patchPage(selectedPage.key, { slug: v })}
                  placeholder="mi-pagina"
                />
              </div>

              {/* Nav link info */}
              {(() => {
                const linkedNavs = navItems.filter((n) => n.page_key === selectedPage.key)
                return linkedNavs.length > 0 ? (
                  <p className="font-brand text-xs text-brand-primary/40 bg-brand-primary/5 rounded-lg px-3 py-2">
                    🔗 Nav vinculado: {linkedNavs.map((n) => `"${n.label}" → ${n.href ?? '(sin ruta)'}`).join(', ')}
                    {' · '}Cambia el slug arriba para actualizar la ruta automáticamente.
                  </p>
                ) : null
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-brand text-xs font-semibold text-brand-primary/50 block mb-1">Tipo de página</label>
                  <select
                    value={selectedPage.page_type}
                    onChange={(e) => patchPage(selectedPage.key, { page_type: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary"
                  >
                    {Object.entries(PAGE_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-brand text-xs font-semibold text-brand-primary/50 block mb-1">Vincular a nav</label>
                  <select
                    value={navItems.find((n) => n.page_key === selectedPage.key)?.id ?? ''}
                    onChange={(e) => {
                      const navId = Number(e.target.value)
                      navItems.filter((n) => n.page_key === selectedPage.key).forEach((n) => linkNavToPage(n.id, null))
                      if (navId) linkNavToPage(navId, selectedPage.key)
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">— Sin enlace nav —</option>
                    {navItems.filter((n) => n.parent_id === null).map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FieldInput
                  label="Meta título (SEO)"
                  value={selectedPage.meta_title ?? ''}
                  onSave={(v) => patchPage(selectedPage.key, { meta_title: v || null })}
                  placeholder="Título para buscadores"
                />
                <FieldInput
                  label="Meta descripción (SEO)"
                  value={selectedPage.meta_description ?? ''}
                  onSave={(v) => patchPage(selectedPage.key, { meta_description: v || null })}
                  placeholder="Descripción para buscadores"
                />
              </div>
            </div>

            {/* ── Sections ────────────────────────────────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-brand text-sm font-semibold text-brand-primary">
                  Secciones ({pageSections.length})
                </h3>
                <button
                  onClick={() => setShowNewSection(true)}
                  className="font-brand text-sm text-brand-primary hover:text-brand-dark transition-colors"
                >
                  + Agregar sección
                </button>
              </div>

              {showNewSection && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  <p className="font-brand text-sm font-semibold text-brand-primary">Nueva sección</p>
                  <div className="flex gap-3">
                    <select
                      value={newSectionType}
                      onChange={(e) => setNewSectionType(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary"
                    >
                      {SECTION_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="Título de la sección (opcional)"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 font-brand text-sm focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={createSection}
                      disabled={addingSection}
                      className="bg-brand-primary text-brand-cream rounded-full px-5 py-2 font-brand text-sm hover:bg-brand-dark transition-colors disabled:opacity-40"
                    >
                      {addingSection ? 'Creando…' : 'Crear sección'}
                    </button>
                    <button onClick={() => setShowNewSection(false)} className="font-brand text-sm text-brand-primary/40 hover:text-brand-primary">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {pageSections.length === 0 && !showNewSection && (
                <p className="font-brand text-sm text-brand-primary/30 text-center py-8">
                  Esta página no tiene secciones. Agrega una arriba.
                </p>
              )}

              {pageSections.map((section) => {
                const sectionItems = items
                  .filter((i) => i.section_id === section.id)
                  .sort((a, b) => a.order_index - b.order_index)
                const isExpanded = expandedSection === section.id
                const hasItems = ['cards', 'faq', 'hero', 'services', 'testimonials'].includes(section.section_type)

                return (
                  <div key={section.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4">
                      <Toggle
                        value={section.enabled}
                        onChange={() => patchSection(section.id, { enabled: !section.enabled })}
                      />
                      <button
                        onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        <span className="font-brand text-sm font-semibold text-brand-primary/60">
                          {SECTION_TYPE_LABELS[section.section_type] ?? section.section_type}
                        </span>
                        {section.title && (
                          <span className="font-brand text-sm text-brand-primary">{section.title}</span>
                        )}
                        <svg
                          className={`ml-auto w-4 h-4 text-brand-primary/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="text-brand-primary/20 hover:text-red-500 transition-colors text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-0 border-t border-gray-100 space-y-4">
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <FieldInput
                            label="Título"
                            value={section.title ?? ''}
                            onSave={(v) => patchSection(section.id, { title: v || null })}
                            placeholder="Título de la sección"
                          />
                          <FieldInput
                            label="Subtítulo"
                            value={section.subtitle ?? ''}
                            onSave={(v) => patchSection(section.id, { subtitle: v || null })}
                            placeholder="Subtítulo opcional"
                          />
                        </div>

                        {['hero', 'text', 'cta', 'whatsapp'].includes(section.section_type) && (
                          <FieldInput
                            label="Cuerpo de texto"
                            value={section.body ?? ''}
                            onSave={(v) => patchSection(section.id, { body: v || null })}
                            multiline
                            placeholder="Texto principal…"
                          />
                        )}

                        {['hero', 'cta', 'testimonials', 'whatsapp', 'cards', 'faq'].includes(section.section_type) && (
                          <div className="grid grid-cols-2 gap-4">
                            <FieldInput
                              label="Texto del CTA"
                              value={section.cta_label ?? ''}
                              onSave={(v) => patchSection(section.id, { cta_label: v || null })}
                              placeholder="Ver más"
                            />
                            <FieldInput
                              label="URL del CTA"
                              value={section.cta_url ?? ''}
                              onSave={(v) => patchSection(section.id, { cta_url: v || null })}
                              placeholder="/ruta"
                            />
                          </div>
                        )}

                        {['hero', 'testimonials'].includes(section.section_type) && (
                          <FieldInput
                            label="Imagen de fondo (URL)"
                            value={section.image_url ?? ''}
                            onSave={(v) => patchSection(section.id, { image_url: v || null })}
                            placeholder="https://..."
                          />
                        )}

                        {hasItems && (
                          <div className="mt-2 space-y-3">
                            <p className="font-brand text-xs font-semibold text-brand-primary/50">
                              {section.section_type === 'cards'        ? 'Tarjetas'
                               : section.section_type === 'faq'        ? 'Preguntas'
                               : section.section_type === 'hero'       ? 'Slides del carrusel'
                               : section.section_type === 'services'   ? 'Ítems de servicio'
                               : section.section_type === 'testimonials' ? 'Testimonios'
                               : 'Ítems'}
                            </p>
                            <div className="space-y-2">
                              {sectionItems.map((item) => {
                                const meta = item.metadata ?? {}
                                return (
                                <div key={item.id} className="flex gap-2 items-start bg-gray-50 rounded-xl p-3">
                                  <Toggle
                                    value={item.enabled}
                                    onChange={() => patchItem(item.id, { enabled: !item.enabled })}
                                  />
                                  <div className="flex-1 space-y-2">
                                    {section.section_type === 'cards' ? (
                                      <>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            defaultValue={item.icon ?? ''}
                                            onBlur={(e) => e.target.value !== (item.icon ?? '') && patchItem(item.id, { icon: e.target.value || null })}
                                            placeholder="🌟"
                                            className="w-16 border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm text-center focus:outline-none focus:border-brand-primary"
                                          />
                                          <input
                                            type="text"
                                            defaultValue={item.title ?? ''}
                                            onBlur={(e) => e.target.value !== (item.title ?? '') && patchItem(item.id, { title: e.target.value || null })}
                                            placeholder="Título"
                                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary"
                                          />
                                        </div>
                                        <textarea
                                          defaultValue={item.description ?? ''}
                                          onBlur={(e) => e.target.value !== (item.description ?? '') && patchItem(item.id, { description: e.target.value || null })}
                                          placeholder="Descripción…"
                                          rows={2}
                                          className="w-full border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary resize-none"
                                        />
                                      </>
                                    ) : section.section_type === 'faq' ? (
                                      <>
                                        <input
                                          type="text"
                                          defaultValue={item.question ?? ''}
                                          onBlur={(e) => e.target.value !== (item.question ?? '') && patchItem(item.id, { question: e.target.value || null })}
                                          placeholder="Pregunta"
                                          className="w-full border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary"
                                        />
                                        <textarea
                                          defaultValue={item.answer ?? ''}
                                          onBlur={(e) => e.target.value !== (item.answer ?? '') && patchItem(item.id, { answer: e.target.value || null })}
                                          placeholder="Respuesta…"
                                          rows={2}
                                          className="w-full border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary resize-none"
                                        />
                                      </>
                                    ) : section.section_type === 'testimonials' ? (
                                      <>
                                        <input
                                          type="text"
                                          defaultValue={item.title ?? ''}
                                          onBlur={(e) => e.target.value !== (item.title ?? '') && patchItem(item.id, { title: e.target.value || null })}
                                          placeholder="Nombre del autor"
                                          className="w-full border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary"
                                        />
                                        <textarea
                                          defaultValue={item.description ?? ''}
                                          onBlur={(e) => e.target.value !== (item.description ?? '') && patchItem(item.id, { description: e.target.value || null })}
                                          placeholder="Contenido del testimonio…"
                                          rows={2}
                                          className="w-full border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary resize-none"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                          <input
                                            type="text"
                                            defaultValue={String(meta.role ?? '')}
                                            onBlur={(e) => patchItem(item.id, { metadata: { ...meta, role: e.target.value || '' } })}
                                            placeholder="Rol / cargo"
                                            className="border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary"
                                          />
                                          <input
                                            type="number"
                                            min={1} max={5}
                                            defaultValue={String(meta.rating ?? 5)}
                                            onBlur={(e) => patchItem(item.id, { metadata: { ...meta, rating: Number(e.target.value) } })}
                                            placeholder="Rating (1-5)"
                                            className="border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary"
                                          />
                                        </div>
                                        <input
                                          type="text"
                                          defaultValue={item.image_url ?? ''}
                                          onBlur={(e) => e.target.value !== (item.image_url ?? '') && patchItem(item.id, { image_url: e.target.value || null })}
                                          placeholder="URL avatar (opcional)"
                                          className="w-full border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary"
                                        />
                                      </>
                                    ) : (section.section_type === 'hero' || section.section_type === 'services') ? (
                                      <>
                                        <input
                                          type="text"
                                          defaultValue={item.title ?? ''}
                                          onBlur={(e) => e.target.value !== (item.title ?? '') && patchItem(item.id, { title: e.target.value || null })}
                                          placeholder="Título"
                                          className="w-full border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary"
                                        />
                                        <textarea
                                          defaultValue={item.description ?? ''}
                                          onBlur={(e) => e.target.value !== (item.description ?? '') && patchItem(item.id, { description: e.target.value || null })}
                                          placeholder="Subtítulo / descripción…"
                                          rows={2}
                                          className="w-full border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary resize-none"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                          <input
                                            type="text"
                                            defaultValue={item.cta_text ?? ''}
                                            onBlur={(e) => e.target.value !== (item.cta_text ?? '') && patchItem(item.id, { cta_text: e.target.value || null })}
                                            placeholder="Texto del botón"
                                            className="border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary"
                                          />
                                          <input
                                            type="text"
                                            defaultValue={item.link_url ?? ''}
                                            onBlur={(e) => e.target.value !== (item.link_url ?? '') && patchItem(item.id, { link_url: e.target.value || null })}
                                            placeholder="URL del botón"
                                            className="border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary"
                                          />
                                        </div>
                                        <input
                                          type="text"
                                          defaultValue={item.image_url ?? ''}
                                          onBlur={(e) => e.target.value !== (item.image_url ?? '') && patchItem(item.id, { image_url: e.target.value || null })}
                                          placeholder="URL imagen"
                                          className="w-full border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary"
                                        />
                                        {section.section_type === 'hero' && (
                                          <input
                                            type="text"
                                            defaultValue={item.image_url_mobile ?? ''}
                                            onBlur={(e) => e.target.value !== (item.image_url_mobile ?? '') && patchItem(item.id, { image_url_mobile: e.target.value || null })}
                                            placeholder="URL imagen mobile (opcional)"
                                            className="w-full border border-gray-200 rounded-lg px-2 py-1 font-brand text-sm focus:outline-none focus:border-brand-primary"
                                          />
                                        )}
                                      </>
                                    ) : null}
                                  </div>
                                  <button
                                    onClick={() => deleteItem(item.id)}
                                    className="text-brand-primary/20 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0"
                                  >
                                    ×
                                  </button>
                                </div>
                              )})}
                            </div>

                            {showNewItem === section.id ? (
                              <div className="bg-brand-primary/5 rounded-xl p-3 space-y-2">
                                {section.section_type === 'cards' ? (
                                  <>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={newItem.icon ?? ''}
                                        onChange={(e) => setNewItem((prev) => ({ ...prev, icon: e.target.value }))}
                                        placeholder="🌟"
                                        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm text-center focus:outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={newItem.title ?? ''}
                                        onChange={(e) => setNewItem((prev) => ({ ...prev, title: e.target.value }))}
                                        placeholder="Título de la tarjeta"
                                        className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none"
                                      />
                                    </div>
                                    <textarea
                                      value={newItem.description ?? ''}
                                      onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                                      placeholder="Descripción…"
                                      rows={2}
                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none resize-none"
                                    />
                                  </>
                                ) : section.section_type === 'faq' ? (
                                  <>
                                    <input
                                      type="text"
                                      value={newItem.question ?? ''}
                                      onChange={(e) => setNewItem((prev) => ({ ...prev, question: e.target.value }))}
                                      placeholder="Pregunta"
                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none"
                                    />
                                    <textarea
                                      value={newItem.answer ?? ''}
                                      onChange={(e) => setNewItem((prev) => ({ ...prev, answer: e.target.value }))}
                                      placeholder="Respuesta…"
                                      rows={2}
                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none resize-none"
                                    />
                                  </>
                                ) : section.section_type === 'testimonials' ? (
                                  <>
                                    <input
                                      type="text"
                                      value={newItem.title ?? ''}
                                      onChange={(e) => setNewItem((prev) => ({ ...prev, title: e.target.value }))}
                                      placeholder="Nombre del autor"
                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none"
                                    />
                                    <textarea
                                      value={newItem.description ?? ''}
                                      onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                                      placeholder="Contenido del testimonio…"
                                      rows={2}
                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none resize-none"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={String((newItem as Partial<SectionItem>).metadata?.role ?? '')}
                                        onChange={(e) => setNewItem((prev) => ({ ...prev, metadata: { ...((prev as Partial<SectionItem>).metadata ?? {}), role: e.target.value } }))}
                                        placeholder="Rol / cargo"
                                        className="border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none"
                                      />
                                      <input
                                        type="number"
                                        min={1} max={5}
                                        value={String((newItem as Partial<SectionItem>).metadata?.rating ?? 5)}
                                        onChange={(e) => setNewItem((prev) => ({ ...prev, metadata: { ...((prev as Partial<SectionItem>).metadata ?? {}), rating: Number(e.target.value) } }))}
                                        placeholder="Rating"
                                        className="border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none"
                                      />
                                    </div>
                                  </>
                                ) : (section.section_type === 'hero' || section.section_type === 'services') ? (
                                  <>
                                    <input
                                      type="text"
                                      value={newItem.title ?? ''}
                                      onChange={(e) => setNewItem((prev) => ({ ...prev, title: e.target.value }))}
                                      placeholder="Título"
                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none"
                                    />
                                    <textarea
                                      value={newItem.description ?? ''}
                                      onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                                      placeholder="Subtítulo / descripción…"
                                      rows={2}
                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none resize-none"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={String((newItem as Partial<SectionItem>).cta_text ?? '')}
                                        onChange={(e) => setNewItem((prev) => ({ ...prev, cta_text: e.target.value }))}
                                        placeholder="Texto botón"
                                        className="border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={String((newItem as Partial<SectionItem>).link_url ?? '')}
                                        onChange={(e) => setNewItem((prev) => ({ ...prev, link_url: e.target.value }))}
                                        placeholder="URL botón"
                                        className="border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none"
                                      />
                                    </div>
                                    <input
                                      type="text"
                                      value={String((newItem as Partial<SectionItem>).image_url ?? '')}
                                      onChange={(e) => setNewItem((prev) => ({ ...prev, image_url: e.target.value }))}
                                      placeholder="URL imagen"
                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none"
                                    />
                                    {section.section_type === 'hero' && (
                                      <input
                                        type="text"
                                        value={String((newItem as Partial<SectionItem>).image_url_mobile ?? '')}
                                        onChange={(e) => setNewItem((prev) => ({ ...prev, image_url_mobile: e.target.value }))}
                                        placeholder="URL imagen mobile (opcional)"
                                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 font-brand text-sm focus:outline-none"
                                      />
                                    )}
                                  </>
                                ) : null}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => createItem(section.id, section.section_type)}
                                    className="bg-brand-primary text-brand-cream rounded-full px-4 py-1.5 font-brand text-xs hover:bg-brand-dark transition-colors"
                                  >
                                    Agregar
                                  </button>
                                  <button
                                    onClick={() => { setShowNewItem(null); setNewItem({ icon: '', title: '', description: '' }) }}
                                    className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setShowNewItem(section.id)
                                  setNewItem({ icon: '', title: '', description: '', question: '', answer: '' })
                                }}
                                className="font-brand text-xs text-brand-primary/50 hover:text-brand-primary transition-colors"
                              >
                                + Agregar {
                                  section.section_type === 'cards'        ? 'tarjeta'
                                  : section.section_type === 'faq'        ? 'pregunta'
                                  : section.section_type === 'hero'       ? 'slide'
                                  : section.section_type === 'services'   ? 'servicio'
                                  : section.section_type === 'testimonials' ? 'testimonio'
                                  : 'ítem'
                                }
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
