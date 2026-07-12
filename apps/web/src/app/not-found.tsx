import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'La página que buscas no existe. Explora nuestra tienda de café de especialidad.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-6 text-center">
      {/* Decorative coffee ring */}
      <div className="relative mb-8">
        <div className="w-40 h-40 rounded-full border-8 border-brand-primary/20 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border-4 border-brand-primary/40 flex items-center justify-center">
            <span className="font-display text-5xl font-light text-brand-primary select-none">404</span>
          </div>
        </div>
        {/* Coffee drop */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-6 bg-brand-primary/20 rounded-b-full" />
      </div>

      <h1 className="font-display text-3xl md:text-4xl font-light text-brand-primary mb-3">
        Esta taza está vacía
      </h1>
      <p className="font-brand text-brand-primary/60 text-base max-w-md mb-8 leading-relaxed">
        La página que buscas se perdió en el camino, igual que un buen café que se enfría.
        Pero tranquilo — hay mucho más por descubrir.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/tienda"
          className="bg-brand-primary text-brand-cream rounded-full px-8 py-3 font-brand text-sm
                     hover:bg-brand-dark transition-colors"
        >
          Explorar tienda
        </Link>
        <Link
          href="/"
          className="border border-brand-primary/30 text-brand-primary rounded-full px-8 py-3 font-brand text-sm
                     hover:border-brand-primary transition-colors"
        >
          Volver al inicio
        </Link>
      </div>

      {/* Subtle links */}
      <div className="mt-12 flex gap-6">
        {[
          { href: '/blog', label: 'Blog' },
          { href: '/maquila', label: 'Maquila' },
          { href: '/asesorias', label: 'Asesorías' },
          { href: '/nosotros', label: 'Nosotros' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-brand text-xs text-brand-primary/40 hover:text-brand-primary transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
