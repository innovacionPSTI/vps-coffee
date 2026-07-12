import Link from 'next/link'
import { getStoreConfig } from '@vps/database'

/**
 * Layout para las páginas de autenticación (login y registro).
 * Muestra la pantalla centrada con logo de VPS Coffee.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const config = await getStoreConfig().catch(() => null)

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col">
      {/* Navbar mínima */}
      <header className="px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          {config?.logo_url ? (
            <img src={config.logo_url} alt="VPS Coffee" className="h-9 w-auto object-contain" />
          ) : (
            <>
              <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center">
                <span className="font-display text-brand-cream text-xs font-bold">VPS</span>
              </div>
              <span className="font-display text-brand-primary text-lg hidden sm:block">
                VPS Coffee
              </span>
            </>
          )}
        </Link>
        <Link href="/tienda" className="font-brand text-sm text-brand-primary/60 hover:text-brand-primary transition-colors">
          ← Volver a la tienda
        </Link>
      </header>

      {/* Contenido centrado */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer mínimo */}
      <footer className="text-center py-6">
        <p className="font-brand text-xs text-brand-primary/30">
          © {new Date().getFullYear()} VPS Coffee Roasting House
        </p>
      </footer>
    </div>
  )
}
