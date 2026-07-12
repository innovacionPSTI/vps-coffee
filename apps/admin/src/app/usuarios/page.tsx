import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import UsuariosClient from './UsuariosClient'

export const metadata: Metadata = { title: 'Usuarios' }
export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  // Solo super_admin puede gestionar usuarios
  const adminUser = await getAdminUser()
  if (!adminUser || adminUser.role !== 'super_admin') {
    redirect('/no-autorizado')
  }

  const supabase = createServerClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .in('role', ['super_admin', 'admin', 'vendedor', 'gestor_tienda'])
    .order('created_at', { ascending: false })

  return (
    <UsuariosClient
      users={users ?? []}
      currentUserEmail={adminUser.email}
    />
  )
}
