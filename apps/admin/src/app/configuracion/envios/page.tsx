import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getShippingConfig } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import ShippingConfigForm from '../ShippingConfigForm'

export const metadata: Metadata = { title: 'Envíos · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigEnviosPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'
  if (!fullAccess) redirect('/configuracion/general')

  const shippingConfig = await getShippingConfig().catch(() => null)

  return (
    <div>
      <div className="mb-8">
        <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wider mb-1">Configuración</p>
        <h1 className="font-display text-brand-primary text-3xl">Envíos</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          Proveedor activo, credenciales y dirección de origen para despachos.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <ShippingConfigForm initialConfig={shippingConfig} />
      </div>
    </div>
  )
}
