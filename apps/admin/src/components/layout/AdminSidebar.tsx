'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStackApp } from '@stackframe/stack'
import type { AdminRole, AdminSection } from '@/lib/roles'
import { ROLE_CONFIG } from '@/lib/roles'

interface NavItem {
  href: string
  icon: string
  label: string
  section: AdminSection
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',     icon: '📊', label: 'Dashboard',     section: 'dashboard' },
  { href: '/productos',     icon: '☕', label: 'Productos',     section: 'productos' },
  { href: '/categorias',    icon: '📂', label: 'Categorías',    section: 'categorias' },
  { href: '/pedidos',       icon: '📦', label: 'Pedidos',       section: 'pedidos' },
  { href: '/clientes',      icon: '👥', label: 'Clientes',      section: 'clientes' },
  { href: '/banners',       icon: '🖼',  label: 'Banners',      section: 'banners' },
  { href: '/blog',          icon: '✍️', label: 'Blog',          section: 'blog' },
  { href: '/usuarios',      icon: '🔐', label: 'Usuarios',      section: 'usuarios' },
  { href: '/configuracion', icon: '⚙️', label: 'Configuración', section: 'configuracion' },
]

interface Props {
  role: AdminRole
}

export default function AdminSidebar({ role }: Props) {
  const pathname = usePathname()
  const app = useStackApp()

  const allowedSections = ROLE_CONFIG[role].sections
  const navItems = ALL_NAV_ITEMS.filter((item) => allowedSections.includes(item.section))

  async function handleSignOut() {
    await app.signOut()
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-brand-primary min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-brand-cream/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center">
            <span className="font-display text-brand-primary text-xs font-bold">VPS</span>
          </div>
          <span className="font-display text-brand-cream text-base">Admin</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-brand text-sm transition-colors ${
                active
                  ? 'bg-brand-dark text-brand-cream font-semibold'
                  : 'text-brand-cream/60 hover:text-brand-cream hover:bg-brand-cream/10'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer con rol + cerrar sesión */}
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
