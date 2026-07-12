import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getStoreConfig } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import LegalConfigForm from '../LegalConfigForm'

export const metadata: Metadata = { title: 'Legal · Configuración' }
export const dynamic = 'force-dynamic'

export default async function ConfigLegalPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role, 'configuracion')) {
    redirect('/no-autorizado')
  }

  const storeConfig = await getStoreConfig().catch(() => null)

  return (
    <div>
      <div className="mb-8">
        <p className="font-brand text-xs text-brand-primary/40 uppercase tracking-wider mb-1">Configuración</p>
        <h1 className="font-display text-brand-primary text-3xl">Legal</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          Términos y condiciones y política de privacidad del sitio web. Escribe en Markdown.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <LegalConfigForm
          initialTerms={storeConfig?.terms_content ?? null}
          initialPrivacy={storeConfig?.privacy_content ?? null}
        />
      </div>
    </div>
  )
}
