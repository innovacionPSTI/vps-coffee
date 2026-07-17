'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import CartDrawer from '@/components/cart/CartDrawer'
import NavAuthButton from '@/components/auth/NavAuthButton'
import type { NavItemWithChildren } from '@vps/database'

interface NavbarProps {
  logoUrl?: string | null
  storeName?: string | null
  navItems?: NavItemWithChildren[]
  showCart?: boolean
  showAuth?: boolean
}

// ── Dropdown (desktop) ────────────────────────────────────────────────────────

function NavDropdown({ item }: { item: NavItemWithChildren }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 font-brand text-sm text-brand-primary hover:text-brand-dark transition-colors group"
      >
        {item.label}
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-primary transition-all group-hover:w-full" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[160px] bg-white rounded-2xl shadow-lg border border-brand-primary/10 py-2 z-50">
          {/* Si el grupo también tiene href propio, mostrarlo primero */}
          {item.href && (
            <Link
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 font-brand text-sm text-brand-primary hover:bg-brand-cream transition-colors font-medium"
            >
              {item.label}
            </Link>
          )}
          {item.children.map((child) => (
            <Link
              key={child.id}
              href={child.href ?? '#'}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 font-brand text-sm text-brand-primary/80 hover:bg-brand-cream hover:text-brand-primary transition-colors"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Navbar({
  logoUrl,
  storeName,
  navItems = [],
  showCart = true,
  showAuth = true,
}: NavbarProps) {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [cartOpen, setCartOpen]   = useState(false)
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

            {/* Logo — siempre lleva a / */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center">
                    <span className="font-display text-brand-cream text-sm font-bold">▲</span>
                  </div>
                  <span className="font-display text-brand-primary text-xl hidden sm:block">
                    {storeName ?? 'Mi Tienda'}
                  </span>
                </>
              )}
            </Link>

            {/* Links desktop */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item) =>
                item.children.length > 0 ? (
                  <NavDropdown key={item.id} item={item} />
                ) : (
                  <Link
                    key={item.id}
                    href={item.href ?? '#'}
                    className="font-brand text-sm text-brand-primary hover:text-brand-dark transition-colors relative group"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-primary transition-all group-hover:w-full" />
                  </Link>
                )
              )}
            </nav>

            {/* Íconos */}
            <div className="flex items-center gap-3">
              {showAuth && (
                <Suspense fallback={<div className="w-8 h-8" />}>
                  <NavAuthButton />
                </Suspense>
              )}

              {showCart && (
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
              )}

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
            {navItems.map((item) => (
              <div key={item.id}>
                {/* Ítem top-level */}
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 font-brand text-brand-primary border-b border-brand-primary/10"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <div className="py-3 font-brand font-semibold text-brand-primary/60 text-xs uppercase tracking-wide border-b border-brand-primary/10">
                    {item.label}
                  </div>
                )}

                {/* Hijos indentados */}
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.href ?? '#'}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2.5 pl-4 font-brand text-brand-primary/80 border-b border-brand-primary/5 last:border-0 text-sm"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </header>

      {showCart && <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />}
    </>
  )
}
