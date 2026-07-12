import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AccountSidebar from '@/components/account/AccountSidebar'
import { getStoreConfig } from '@vps/database'
import { stackServerApp } from '@/stack'

/**
 * Layout compartido para todas las rutas bajo /mi-cuenta/*.
 * — Verifica autenticación una sola vez (no es necesario hacerlo en cada página)
 * — Monta Navbar + sidebar + Footer
 * — El sidebar recibe nombre y email del usuario como props (evita useUser en cliente)
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [config, user] = await Promise.all([
    getStoreConfig().catch(() => null),
    stackServerApp.getUser(),
  ])

  if (!user) redirect('/login')

  const displayName = user.displayName ?? ''
  const email = user.primaryEmail ?? ''

  return (
    <>
      <Navbar logoUrl={config?.logo_url} />

      <div className="bg-brand-cream min-h-screen pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Mobile tab bar + Desktop grid */}
          <div className="md:grid md:grid-cols-4 md:gap-8">
            <AccountSidebar displayName={displayName} email={email} />

            {/* Contenido de la página */}
            <main className="md:col-span-3 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>

      <Footer logoUrl={config?.logo_url} whatsapp={config?.whatsapp_number} />
    </>
  )
}
