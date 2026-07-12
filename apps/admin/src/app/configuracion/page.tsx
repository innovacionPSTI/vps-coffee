import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getShippingConfig, getStoreConfig, getPaymentConfig } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import ShippingConfigForm from './ShippingConfigForm'
import StoreConfigForm from './StoreConfigForm'
import PaymentConfigForm from './PaymentConfigForm'
import EmailConfigForm from './EmailConfigForm'

export const metadata: Metadata = { title: 'Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'

  const [shippingConfig, storeConfig, paymentConfig] = await Promise.all([
    fullAccess ? getShippingConfig().catch(() => null) : Promise.resolve(null),
    getStoreConfig().catch(() => null),
    fullAccess ? getPaymentConfig().catch(() => null) : Promise.resolve(null),
  ])

  const paymentConfigData = paymentConfig
    ? {
        ...paymentConfig,
        wompi_private_key: null,
        wompi_integrity_secret: null,
        wompi_events_secret: null,
        mercadopago_access_token: null,
        has_wompi_private_key: !!paymentConfig.wompi_private_key,
        has_wompi_integrity_secret: !!paymentConfig.wompi_integrity_secret,
        has_wompi_events_secret: !!paymentConfig.wompi_events_secret,
        has_mercadopago_access_token: !!paymentConfig.mercadopago_access_token,
      }
    : null

  const emailConfigData = storeConfig
    ? {
        resend_from_email: storeConfig.resend_from_email,
        has_resend_api_key: !!storeConfig.resend_api_key,
      }
    : null

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-brand-primary text-3xl">Configuración</h1>
        {!fullAccess && (
          <span className="font-brand text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
            Vista limitada · Solo configuración general
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* ── Configuración general — visible para todos con acceso ── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-brand font-semibold text-brand-primary text-lg mb-1">
            Configuración general
          </h2>
          <p className="font-brand text-xs text-brand-primary/50 mb-6">
            Datos de contacto y nombre de la tienda. Los cambios se reflejan en la web de inmediato.
          </p>
          <StoreConfigForm initialConfig={storeConfig} />
        </section>

        {/* ── Secciones solo para admin y super_admin ── */}
        {fullAccess && (
          <>
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-brand font-semibold text-brand-primary text-lg mb-1">
                Proveedor de envíos
              </h2>
              <p className="font-brand text-xs text-brand-primary/50 mb-6">
                Elige el proveedor activo y configura sus credenciales.
              </p>
              <ShippingConfigForm initialConfig={shippingConfig} />
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-brand font-semibold text-brand-primary text-lg mb-1">
                Pasarelas de pago
              </h2>
              <p className="font-brand text-xs text-brand-primary/50 mb-6">
                Configura las credenciales de Wompi y MercadoPago. Los secrets nunca se exponen al cliente.
              </p>
              <PaymentConfigForm initialConfig={paymentConfigData} />
            </section>

            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-brand font-semibold text-brand-primary text-lg mb-1">
                Emails transaccionales (Resend)
              </h2>
              <p className="font-brand text-xs text-brand-primary/50 mb-6">
                Configura Resend para enviar confirmaciones de pedido y notificaciones.
              </p>
              <EmailConfigForm initialConfig={emailConfigData} />
            </section>
          </>
        )}
      </div>
    </div>
  )
}
