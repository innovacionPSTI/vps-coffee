import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getStoreConfig } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import EmailConfigForm from '../EmailConfigForm'

export const metadata: Metadata = { title: 'Emails · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigEmailsPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const fullAccess = adminUser.role === 'super_admin' || adminUser.role === 'admin'
  if (!fullAccess) redirect('/configuracion/general')

  const storeConfig = await getStoreConfig().catch(() => null)

  const emailConfigData = storeConfig
    ? {
        resend_from_email: storeConfig.resend_from_email,
        has_resend_api_key: !!storeConfig.resend_api_key,
        email_provider: storeConfig.email_provider ?? 'resend',
      }
    : null

  return (
    <div>
      <div className="mb-8">
        <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wider mb-1">Configuración</p>
        <h1 className="font-display text-brand-primary text-3xl">Emails</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          Resend para confirmaciones de pedido, newsletters y notificaciones transaccionales.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <EmailConfigForm initialConfig={emailConfigData} />
      </div>
    </div>
  )
}
