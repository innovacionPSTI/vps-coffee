import type { Metadata } from 'next'
import { stackServerApp } from '@/stack'
import { redirect } from 'next/navigation'
import { createServerClient } from '@vps/database'
import ProfileForm from '@/components/account/ProfileForm'
import AddressesForm from '@/components/account/AddressesForm'

export const metadata: Metadata = { title: 'Mi perfil' }
export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const user = await stackServerApp.getUser()
  if (!user) redirect('/login')

  // Load customer data server-side for initial render
  const supabase = createServerClient()
  const { data: customer } = await supabase
    .from('customers')
    .select('name, phone')
    .or(`stack_id.eq.${user.id},email.eq.${user.primaryEmail ?? ''}`)
    .maybeSingle()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-brand-primary text-3xl lg:text-4xl">Mi perfil</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          Actualiza tus datos personales y direcciones de envío guardadas.
        </p>
      </div>

      <ProfileForm
        initialName={customer?.name ?? user.displayName ?? ''}
        initialPhone={customer?.phone ?? ''}
        email={user.primaryEmail ?? ''}
      />

      <AddressesForm />
    </div>
  )
}
