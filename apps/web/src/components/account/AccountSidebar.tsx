'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'

interface Props {
  displayName: string
  email: string
}

const navLinks = [
  {
    href: '/mi-cuenta',
    exact: true,
    label: 'Inicio',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/mi-cuenta/perfil',
    exact: false,
    label: 'Mi perfil',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: '/mi-cuenta/pedidos',
    exact: false,
    label: 'Mis pedidos',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    href: '/mi-cuenta/configuracion',
    exact: false,
    label: 'Configuración',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

function getInitials(name: string, email: string): string {
  if (name.trim()) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }
  return email[0]?.toUpperCase() ?? '?'
}

export default function AccountSidebar({ displayName, email }: Props) {
  const pathname = usePathname()

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const initials = getInitials(displayName, email)

  return (
    <>
      {/* ── Mobile: tab bar horizontal ─────────────────────────── */}
      <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-1 mb-6 -mx-4 px-4">
        {navLinks.map((link) => {
          const active = isActive(link.href, link.exact)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-brand text-sm whitespace-nowrap flex-shrink-0 transition-colors ${
                active
                  ? 'bg-brand-primary text-brand-cream'
                  : 'bg-white text-brand-primary/60 hover:text-brand-primary'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* ── Desktop: sidebar vertical ───────────────────────────── */}
      <aside className="hidden md:block md:col-span-1">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-24">
          {/* Avatar + datos del usuario */}
          <div className="px-5 py-5 border-b border-brand-primary/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
                <span className="font-brand font-bold text-brand-cream text-sm">{initials}</span>
              </div>
              <div className="min-w-0">
                {displayName && (
                  <p className="font-brand font-semibold text-brand-primary text-sm truncate">
                    {displayName}
                  </p>
                )}
                <p className="font-brand text-xs text-brand-primary/50 truncate">{email}</p>
              </div>
            </div>
          </div>

          {/* Navegación */}
          <nav className="p-2">
            {navLinks.map((link) => {
              const active = isActive(link.href, link.exact)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-brand text-sm transition-colors ${
                    active
                      ? 'bg-brand-cream text-brand-primary font-semibold'
                      : 'text-brand-primary/60 hover:text-brand-primary hover:bg-brand-cream/50'
                  }`}
                >
                  <span className={active ? 'text-brand-primary' : 'text-brand-primary/40'}>
                    {link.icon}
                  </span>
                  {link.label}
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Separador + Cerrar sesión */}
          <div className="p-2 border-t border-brand-primary/8">
            <Link
              href="/tienda"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-brand text-sm text-brand-primary/40 hover:text-brand-primary hover:bg-brand-cream/50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a la tienda
            </Link>
            <Suspense fallback={null}>
              <LogoutButton />
            </Suspense>
          </div>
        </div>
      </aside>
    </>
  )
}
