import Link from 'next/link'

const footerLinks = {
  Tienda: [
    { href: '/tienda?tueste=claro', label: 'Café Claro' },
    { href: '/tienda?tueste=medio', label: 'Café Medio' },
    { href: '/tienda?tueste=oscuro', label: 'Café Oscuro' },
  ],
  Blog: [
    { href: '/blog?categoria=origenes', label: 'Orígenes' },
    { href: '/blog?categoria=preparacion', label: 'Preparación' },
    { href: '/blog', label: 'Todos los artículos' },
  ],
  Servicios: [
    { href: '/maquila', label: 'Maquila & Tueste' },
    { href: '/asesorias', label: 'Asesorías' },
  ],
  Nosotros: [
    { href: '/nosotros', label: 'Historia' },
    { href: '/nosotros#contacto', label: 'Contacto' },
  ],
  Legal: [
    { href: '/terminos', label: 'Términos' },
    { href: '/privacidad', label: 'Privacidad' },
  ],
}

export default function Footer({
  logoUrl,
  whatsapp,
}: {
  logoUrl?: string | null
  whatsapp?: string | null
}) {
  const wa = whatsapp ?? '573XXXXXXXXX'

  return (
    <footer className="bg-brand-dark text-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center">
                  <span className="font-display text-brand-primary text-sm font-bold">VPS</span>
                </div>
              )}
            </div>
            <p className="font-brand text-xs text-brand-cream/60 leading-relaxed">
              © {new Date().getFullYear()} VPS Coffee<br />
              Todos los derechos reservados.
            </p>

            {/* Redes sociales */}
            <div className="flex gap-3 mt-4">
              {[
                { label: 'Instagram', href: 'https://instagram.com/vpscoffee', icon: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 5h-7A1.5 1.5 0 007 8.5v7A1.5 1.5 0 008.5 17h7a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0015.5 7zM12 9.5A2.5 2.5 0 1112 14.5 2.5 2.5 0 0112 9.5zm3.25-.75a.75.75 0 110 1.5.75.75 0 010-1.5z' },
              ].map((sn) => (
                <a
                  key={sn.label}
                  href={sn.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={sn.label}
                  className="p-2 rounded-full bg-brand-cream/10 hover:bg-brand-cream/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={sn.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-brand font-semibold text-sm mb-3 text-brand-cream/80">
                {section}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-brand text-xs text-brand-cream/50 hover:text-brand-cream transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* WhatsApp bar */}
        <div className="mt-12 pt-6 border-t border-brand-cream/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-brand text-sm text-brand-cream/60 hover:text-brand-cream transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp: +{wa.replace(/(\d{2})(\d{3})(\d{7})/, '$1 $2 $3')}
          </a>
        </div>
      </div>
    </footer>
  )
}
