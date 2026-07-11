import type { Metadata } from 'next'
import { getShippingConfig, getStoreConfig } from '@vps/database'
import ShippingConfigForm from './ShippingConfigForm'
import StoreConfigForm from './StoreConfigForm'

export const metadata: Metadata = { title: 'Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const [shippingConfig, storeConfig] = await Promise.all([
    getShippingConfig().catch(() => null),
    getStoreConfig().catch(() => null),
  ])

  return (
    <div>
      <h1 className="font-display text-brand-primary text-3xl mb-8">Configuración</h1>

      <div className="space-y-6">
        {/* ── Envíos ────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-brand font-semibold text-brand-primary text-lg mb-1">
            Proveedor de envíos
          </h2>
          <p className="font-brand text-xs text-brand-primary/50 mb-6">
            Elige el proveedor activo y configura sus credenciales. Los cambios se aplican
            de inmediato sin necesidad de redesplegar la aplicación.
          </p>

          <ShippingConfigForm initialConfig={shippingConfig} />
        </section>

        {/* ── Pasarelas de pago ──────────────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-brand font-semibold text-brand-primary text-lg mb-5">
            Pasarelas de pago
          </h2>
          <div className="space-y-4">
            {[
              { name: 'Wompi (Bancolombia)', key: 'WOMPI_PUBLIC_KEY', desc: 'Tarjeta débito/crédito, PSE' },
              { name: 'MercadoPago', key: 'MERCADOPAGO_ACCESS_TOKEN', desc: 'Tarjeta, efectivo, Nequi' },
            ].map((gw) => (
              <div key={gw.name} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                <div>
                  <p className="font-brand font-semibold text-brand-primary text-sm">{gw.name}</p>
                  <p className="font-brand text-xs text-brand-primary/40">{gw.desc}</p>
                  <p className="font-mono text-xs text-brand-primary/40 mt-1">
                    {gw.key} — configurar en .env.local
                  </p>
                </div>
                <span className="font-brand text-xs bg-yellow-100 text-yellow-700 rounded-full px-3 py-1">
                  Pendiente config.
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Configuración general ─────────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-brand font-semibold text-brand-primary text-lg mb-1">
            Configuración general
          </h2>
          <p className="font-brand text-xs text-brand-primary/50 mb-6">
            Datos de contacto y nombre de la tienda. Los cambios se reflejan en la web de inmediato.
          </p>
          <StoreConfigForm initialConfig={storeConfig} />
        </section>

        {/* ── Emails ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-brand font-semibold text-brand-primary text-lg mb-5">
            Emails transaccionales (Resend)
          </h2>
          <div className="p-4 bg-gray-50 rounded-xl font-brand text-sm text-brand-primary/60">
            Configurar{' '}
            <code className="font-mono text-xs bg-gray-200 px-1 rounded">RESEND_API_KEY</code> y{' '}
            <code className="font-mono text-xs bg-gray-200 px-1 rounded">RESEND_FROM_EMAIL</code>{' '}
            en el archivo .env.local.
          </div>
        </section>
      </div>
    </div>
  )
}
