import { getAdminUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createServerClient } from '@vps/database'
import NavClient from './NavClient'

export const dynamic = 'force-dynamic'

export default async function NavPage() {
  try {
    await getAdminUser()
  } catch {
    redirect('/sign-in')
  }

  const supabase = createServerClient()
  const { data: navItems } = await supabase
    .from('nav_items')
    .select('*')
    .order('order_index')

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-brand-primary">Navegación</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          Configura los ítems del menú principal. Los cambios se reflejan de inmediato en el sitio.
        </p>
      </div>
      <NavClient initialItems={navItems ?? []} />
    </div>
  )
}
