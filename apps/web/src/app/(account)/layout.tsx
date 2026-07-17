import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AccountSidebar from '@/components/account/AccountSidebar'
import { getStoreConfig, getFooterPages, getNavTree } from '@vps/database'
import { stackServerApp } from '@/stack'

export const dynamic = 'force-dynamic'

/**
 * Layout compartido para todas las rutas bajo /mi-cuenta/*.
 * — Verifica autenticación una sola vez (no es necesario hacerlo en cada página)
 * — Monta Navbar + sidebar + Footer con props completos
 * — El sidebar recibe nombre y email del usuario como props (evita useUser en cliente)
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [config, footerPages, navItems, user] = await Promise.all([
    getStoreConfig().catch(() => null),
    getFooterPages().catch(() => []),
    getNavTree().catch(() => []),
    stackServerApp.getUser(),
  ])

  if (!user) redirect('/login')

  const displayName = user.displayName ?? ''
  const email       = user.primaryEmail ?? ''

  return (
    <>
      <Navbar
        logoUrl={config?.logo_url}
        storeName={config?.store_name}
        navItems={navItems}
        showCart={config?.nav_show_cart ?? true}
        showAuth={config?.nav_show_auth ?? true}
      />

      <div className="bg-brand-cream min-h-screen pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="md:grid md:grid-cols-4 md:gap-8">
            <AccountSidebar displayName={displayName} email={email} />
            <main className="md:col-span-3 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>

      <Footer
        logoUrl={config?.logo_url}
        storeName={config?.store_name}
        whatsapp={config?.whatsapp_number}
        social={{
          instagramUrl:     config?.instagram_url,
          instagramEnabled: config?.instagram_enabled,
          facebookUrl:      config?.facebook_url,
          facebookEnabled:  config?.facebook_enabled,
          tiktokUrl:        config?.tiktok_url,
          tiktokEnabled:    config?.tiktok_enabled,
        }}
        pages={footerPages}
        footerFlags={{
          showStore: config?.footer_show_store ?? true,
          showBlog:  config?.footer_show_blog  ?? true,
          showLegal: config?.footer_show_legal ?? true,
        }}
      />
    </>
  )
}
