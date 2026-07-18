import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getPaymentConfig } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import PaymentConfigForm from '../PaymentConfigForm'

export const metadata: Metadata = { title: 'Pagos · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigPagosPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'
  if (!fullAccess) redirect('/configuracion/general')

  const paymentConfig = await getPaymentConfig().catch(() => null)

  const paymentConfigData = paymentConfig
    ? {
        ...paymentConfig,
        wompi_private_key: null,
        wompi_integrity_secret: null,
        wompi_events_secret: null,
        mercadopago_access_token: null,
        tucompra_secret_key: null,
        has_wompi_private_key: !!paymentConfig.wompi_private_key,
        has_wompi_integrity_secret: !!paymentConfig.wompi_integrity_secret,
        has_wompi_events_secret: !!paymentConfig.wompi_events_secret,
        has_mercadopago_access_token: !!paymentConfig.mercadopago_access_token,
        has_tucompra_secret_key: !!paymentConfig.tucompra_secret_key,
      }
    : null

  return (
    <div>
      <div className="mb-8">
        <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wider mb-1">Configuración</p>
        <h1 className="font-display text-brand-primary text-3xl">Pagos</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          Credenciales de Wompi, MercadoPago y Tu Compra. Los secrets nunca se exponen al cliente.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <PaymentConfigForm initialConfig={paymentConfigData} />
      </div>
    </div>
  )
}
