import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getStoreConfig } from '@vps/database'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const config = await getStoreConfig().catch(() => null)

  return (
    <>
      <Navbar logoUrl={config?.logo_url} />
      <main>{children}</main>
      <Footer logoUrl={config?.logo_url} whatsapp={config?.whatsapp_number} />
    </>
  )
}
