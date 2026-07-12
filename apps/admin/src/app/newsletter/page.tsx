import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getAdminUser } from '@/lib/auth'
import { createServerClient } from '@vps/database'
import type { NewsletterSubscriber } from '@vps/database'
import NewsletterClient from './NewsletterClient'

export const metadata: Metadata = { title: 'Newsletter' }
export const dynamic = 'force-dynamic'

export default async function NewsletterPage() {
  const adminUser = await getAdminUser()
  if (
    !adminUser ||
    (adminUser.role !== 'super_admin' &&
      adminUser.role !== 'admin' &&
      adminUser.role !== 'gestor_tienda')
  ) {
    redirect('/no-autorizado')
  }

  const supabase = createServerClient()
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })

  const subscribers: NewsletterSubscriber[] = data ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-brand-primary text-3xl">Newsletter</h1>
        <p className="font-brand text-brand-primary/50 text-sm mt-1">
          Gestiona suscriptores y envía campañas de correo a tu audiencia
        </p>
      </div>
      <NewsletterClient initialSubscribers={subscribers} />
    </div>
  )
}
