'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import CartDrawer from '@/components/cart/CartDrawer'
import NavAuthButton from '@/components/auth/NavAuthButton'

const navLinks = [
  { href: '/', label: 'Café' },
  { href: '/tienda', label: 'Tienda' },
  { href: '/maquila', label: 'Maquila' },
  { href: '/asesorias', label: 'Asesorías' },
  { href: '/blog', label: 'Blog' },
]

export default function Navbar({ logoUrl }: { logoUrl?: string | null }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const itemCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.qty, 0))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-brand-cream shadow-md' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center">
                    <span className="font-display text-brand-cream text-sm font-bold">VPS</span>
                  </div>
                  <span className="font-display text-brand-primary text-xl hidden sm:block">
                    VPS Coffee
                  </span>
                </>
              )}
            </Link>

            {/* Links desktop */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-brand text-sm text-brand-primary hover:text-brand-dark transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-primary transition-all group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Íconos */}
            <div className="flex items-center gap-3">
              {/* useUser() vive en NavAuthButton, envuelto en Suspense para evitar
                  NoSuspenseBoundaryError en el root layout */}
              <Suspense fallback={<div className="w-8 h-8" />}>
                <NavAuthButton />
              </Suspense>

              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-brand-primary hover:text-brand-dark transition-colors"
                aria-label="Carrito"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-primary text-brand-cream text-[10px] font-bold flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </button>

              {/* Hamburger mobile */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 text-brand-primary"
                aria-label="Menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="lg:hidden bg-brand-cream border-t border-brand-primary/10 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 font-brand text-brand-primary border-b border-brand-primary/10 last:border-0"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
