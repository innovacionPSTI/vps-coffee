'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useStackApp } from '@stackframe/stack'
import type { AdminRole, AdminSection } from '@/lib/roles'
import { ROLE_CONFIG } from '@/lib/roles'

// ── Tipos ────────────────────────────────────────────────────────────────────

/** Ítem hoja: un link directo */
interface NavLeaf {
  kind: 'leaf'
  href: string
  icon: string
  label: string
  section: AdminSection
}

/** Sub-ítem dentro de un leaf expandible (ej. sub-rutas de Configuración) */
interface NavSubLeaf {
  href: string
  label: string
  fullAccessOnly?: boolean
}

/** Ítem hoja con sub-rutas propias */
interface NavLeafWithSubs extends Omit<NavLeaf, 'kind'> {
  kind: 'leaf-group'
  children: NavSubLeaf[]
}

/** Grupo contenedor (no navega, solo agrupa) */
interface NavGroup {
  kind: 'group'
  icon: string
  label: string
  /** Sections que pertenecen al grupo — se muestra si el usuario tiene acceso a ALGUNA */
  sections: AdminSection[]
  children: (NavLeaf | NavLeafWithSubs)[]
}

type NavNode = NavLeaf | NavGroup

// ── Estructura de navegación ─────────────────────────────────────────────────

const NAV: NavNode[] = [
  {
    kind: 'leaf',
    href: '/dashboard',
    icon: '📊',
    label: 'Dashboard',
    section: 'dashboard',
  },
  {
    kind: 'group',
    icon: '☕',
    label: 'Catálogo',
    sections: ['productos', 'categorias'],
    children: [
      { kind: 'leaf', href: '/productos',  icon: '☕', label: 'Productos',  section: 'productos' },
      { kind: 'leaf', href: '/categorias', icon: '📂', label: 'Categorías', section: 'categorias' },
    ],
  },
  {
    kind: 'group',
    icon: '📦',
    label: 'Ventas',
    sections: ['pedidos', 'clientes', 'cupones'],
    children: [
      { kind: 'leaf', href: '/pedidos',  icon: '📦', label: 'Pedidos',  section: 'pedidos' },
      { kind: 'leaf', href: '/clientes', icon: '👥', label: 'Clientes', section: 'clientes' },
      { kind: 'leaf', href: '/cupones',  icon: '🎟️', label: 'Cupones',  section: 'cupones' },
    ],
  },
  {
    kind: 'group',
    icon: '🖼️',
    label: 'Contenido',
    sections: ['banners', 'secciones', 'blog', 'newsletter', 'testimonios'],
    children: [
      { kind: 'leaf', href: '/banners',    icon: '🖼️', label: 'Banners',    section: 'banners' },
      { kind: 'leaf', href: '/secciones',  icon: '🗂️', label: 'Secciones',  section: 'secciones' },
      { kind: 'leaf', href: '/blog',       icon: '✍️', label: 'Blog',       section: 'blog' },
      { kind: 'leaf', href: '/newsletter', icon: '📧', label: 'Newsletter',  section: 'newsletter' },
      { kind: 'leaf', href: '/testimonios',icon: '⭐', label: 'Testimonios',section: 'testimonios' },
    ],
  },
  {
    kind: 'group',
    icon: '🔧',
    label: 'Administración',
    sections: ['usuarios', 'configuracion'],
    children: [
      { kind: 'leaf', href: '/usuarios', icon: '🔐', label: 'Usuarios', section: 'usuarios' },
      {
        kind: 'leaf-group',
        href: '/configuracion',
        icon: '⚙️',
        label: 'Configuración',
        section: 'configuracion',
        children: [
          { href: '/configuracion/general', label: 'General' },
          { href: '/configuracion/temas',   label: 'Temas' },
          { href: '/configuracion/envios',  label: 'Envíos',  fullAccessOnly: true },
          { href: '/configuracion/pagos',   label: 'Pagos',   fullAccessOnly: true },
          { href: '/configuracion/emails',  label: 'Emails',  fullAccessOnly: true },
          { href: '/configuracion/legal',   label: 'Legal' },
        ],
      },
    ],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Devuelve el id de grupo si el pathname pertenece a alguno de sus hijos */
function getActiveGroupId(nodes: NavNode[], pathname: string): string | null {
  for (const node of nodes) {
    if (node.kind === 'group') {
      const hasActive = node.children.some(
        (child) => pathname === child.href || pathname.startsWith(child.href + '/')
      )
      if (hasActive) return node.label
    }
  }
  return null
}

// ── Componente principal ─────────────────────────────────────────────────────

interface Props { role: AdminRole }

export default function AdminSidebar({ role }: Props) {
  const pathname = usePathname()
  const app = useStackApp()

  const allowedSections = ROLE_CONFIG[role].sections
  const fullAccess = role === 'super_admin' || role === 'admin'

  // Grupos abiertos: se inicializan con el grupo activo actual
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const active = getActiveGroupId(NAV, pathname)
    return active ? new Set([active]) : new Set()
  })

  // Si el pathname cambia (navegación), abrir el grupo correspondiente
  useEffect(() => {
    const active = getActiveGroupId(NAV, pathname)
    if (active) setOpenGroups((prev) => new Set([...prev, active]))
  }, [pathname])

  function toggleGroup(label: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  async function handleSignOut() { await app.signOut() }

  // Filtra los nodos visibles según el rol
  const visibleNodes = NAV.filter((node) => {
    if (node.kind === 'leaf') return allowedSections.includes(node.section)
    // Grupo: visible si el usuario tiene acceso a al menos un hijo
    return node.sections.some((s) => allowedSections.includes(s))
  })

  return (
    <aside className="w-56 flex-shrink-0 bg-brand-primary min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-brand-cream/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center">
            <span className="font-display text-brand-primary text-xs font-bold">▲</span>
          </div>
          <span className="font-display text-brand-cream text-base">Admin</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleNodes.map((node) => {
          if (node.kind === 'leaf') {
            const isActive = pathname === node.href || pathname.startsWith(node.href + '/')
            return (
              <Link
                key={node.href}
                href={node.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-brand text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-dark text-brand-cream font-semibold'
                    : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-cream/10'
                }`}
              >
                <span className="text-base leading-none">{node.icon}</span>
                {node.label}
              </Link>
            )
          }

          // Grupo
          const isOpen = openGroups.has(node.label)
          const visibleChildren = node.children.filter((child) =>
            allowedSections.includes(child.section)
          )
          if (!visibleChildren.length) return null

          const groupHasActive = visibleChildren.some(
            (child) => pathname === child.href || pathname.startsWith(child.href + '/')
          )

          return (
            <div key={node.label}>
              {/* Cabecera del grupo */}
              <button
                onClick={() => toggleGroup(node.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-brand text-sm transition-colors ${
                  groupHasActive && !isOpen
                    ? 'text-brand-cream'
                    : 'text-brand-cream/50 hover:text-brand-cream hover:bg-brand-cream/10'
                }`}
              >
                <span className="text-base leading-none">{node.icon}</span>
                <span className="flex-1 text-left">{node.label}</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Hijos del grupo */}
              {isOpen && (
                <div className="mt-0.5 ml-3 pl-3 border-l border-brand-cream/15 space-y-0.5">
                  {visibleChildren.map((child) => {
                    if (child.kind === 'leaf') {
                      const isActive = pathname === child.href || pathname.startsWith(child.href + '/')
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-brand text-xs transition-colors ${
                            isActive
                              ? 'bg-brand-cream/15 text-brand-cream font-semibold'
                              : 'text-brand-cream/50 hover:text-brand-cream hover:bg-brand-cream/10'
                          }`}
                        >
                          <span className="text-sm leading-none">{child.icon}</span>
                          {child.label}
                        </Link>
                      )
                    }

                    // leaf-group (Configuración con sub-rutas)
                    const isLeafActive = pathname === child.href || pathname.startsWith(child.href + '/')
                    return (
                      <div key={child.href}>
                        <Link
                          href={child.href}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-brand text-xs transition-colors ${
                            isLeafActive
                              ? 'bg-brand-cream/15 text-brand-cream font-semibold'
                              : 'text-brand-cream/50 hover:text-brand-cream hover:bg-brand-cream/10'
                          }`}
                        >
                          <span className="text-sm leading-none">{child.icon}</span>
                          {child.label}
                          <svg
                            className={`ml-auto w-2.5 h-2.5 transition-transform ${isLeafActive ? 'rotate-90' : ''}`}
                            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>

                        {isLeafActive && (
                          <div className="mt-0.5 ml-3 pl-2.5 border-l border-brand-cream/10 space-y-0.5">
                            {child.children
                              .filter((sub) => !sub.fullAccessOnly || fullAccess)
                              .map((sub) => {
                                const subActive = pathname === sub.href
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className={`flex items-center px-2 py-1.5 rounded-md font-brand text-xs transition-colors ${
                                      subActive
                                        ? 'text-brand-cream font-semibold'
                                        : 'text-brand-cream/40 hover:text-brand-cream'
                                    }`}
                                  >
                                    {sub.label}
                                  </Link>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-brand-cream/10 space-y-3">
        <div className="px-3">
          <span className={`text-xs font-brand font-semibold px-2.5 py-1 rounded-full ${
            role === 'super_admin' ? 'bg-red-500/20 text-red-300' :
            role === 'admin'       ? 'bg-brand-cream/20 text-brand-cream/70' :
            role === 'vendedor'    ? 'bg-green-500/20 text-green-300' :
                                     'bg-blue-500/20 text-blue-300'
          }`}>
            {ROLE_CONFIG[role].label}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-brand text-sm text-brand-cream/40 hover:text-brand-cream hover:bg-brand-cream/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
