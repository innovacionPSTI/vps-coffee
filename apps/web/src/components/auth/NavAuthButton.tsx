'use client'

import Link from 'next/link'
import { useUser } from '@stackframe/stack'

/**
 * Botón de autenticación en el Navbar.
 * Separado en su propio componente para poder envolverlo en <Suspense>
 * y evitar el error "NoSuspenseBoundaryError" de Stack Auth en el root layout.
 */
export default function NavAuthButton() {
  const user = useUser({ or: 'return-null' })

  if (user) {
    return (
      <Link
        href="/mi-cuenta"
        className="p-2 text-brand-primary hover:text-brand-dark transition-colors"
        aria-label="Mi cuenta"
        title={user.displayName ?? 'Mi cuenta'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </Link>
    )
  }

  return (
    <Link
      href="/login"
      className="hidden sm:flex items-center gap-1.5 font-brand text-sm text-brand-primary border border-brand-primary/20 rounded-full px-4 py-1.5 hover:bg-brand-primary hover:text-brand-cream transition-colors"
    >
      Iniciar sesión
    </Link>
  )
}
