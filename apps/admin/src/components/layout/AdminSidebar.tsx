'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/banners', icon: '🖼', label: 'Banners' },
  { href: '/productos', icon: '☕', label: 'Productos' },
  { href: '/categorias', icon: '📂', label: 'Categorías' },
  { href: '/pedidos', icon: '📦', label: 'Pedidos' },
  { href: '/blog', icon: '✍️', label: 'Blog' },
  { href: '/clientes', icon: '👥', label: 'Clientes' },
  { href: '/configuracion', icon: '⚙️', label: 'Configuración' },
  { href: '/usuarios', icon: '🔐', label: 'Usuarios' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

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

      {/* Footer */}
      <div className="p-4 border-t border-brand-cream/10">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-brand text-sm text-brand-cream/40 hover:text-brand-cream/60 transition-colors">
          <span>🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
