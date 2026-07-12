import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getStoreConfig } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import StoreConfigForm from '../StoreConfigForm'

export const metadata: Metadata = { title: 'General · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigGeneralPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const storeConfig = await getStoreConfig().catch(() => null)

  return (
    <div>
      <div className="mb-8">
        <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wider mb-1">Configuración</p>
        <h1 className="font-display text-brand-primary text-3xl">General</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          Datos de contacto y nombre de la tienda.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <StoreConfigForm initialConfig={storeConfig} />
      </div>
    </div>
  )
}
