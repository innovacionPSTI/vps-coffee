import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getStoreConfig, getFooterPages, getNavTree } from '@vps/database'

// El nav y el footer usan datos configurables — siempre refrescar desde BD.
export const dynamic = 'force-dynamic'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [config, footerPages, navItems] = await Promise.all([
    getStoreConfig().catch(() => null),
    getFooterPages().catch(() => []),
    getNavTree().catch(() => []),
  ])

  return (
    <>
      <Navbar
        logoUrl={config?.logo_url}
        storeName={config?.store_name}
        navItems={navItems}
        showCart={config?.nav_show_cart ?? true}
        showAuth={config?.nav_show_auth ?? true}
      />
      <main>{children}</main>
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
