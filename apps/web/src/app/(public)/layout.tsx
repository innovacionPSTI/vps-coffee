import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getStoreConfig } from '@vps/database'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const config = await getStoreConfig().catch(() => null)

  return (
    <>
      <Navbar logoUrl={config?.logo_url} storeName={config?.store_name} />
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
      />
    </>
  )
}
