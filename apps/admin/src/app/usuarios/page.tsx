import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@vps/database'
import { getAdminUser } from '@/lib/auth'
import { ROLE_CONFIG } from '@/lib/roles'
import type { AdminRole } from '@/lib/roles'
import UsuariosClient from './UsuariosClient'

export const metadata: Metadata = { title: 'Usuarios' }
export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  // super_admin y admin pueden gestionar usuarios
  const adminUser = await getAdminUser()
  const canManage = adminUser && ROLE_CONFIG[adminUser.role as AdminRole]?.canManageUsers
  if (!canManage) {
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
