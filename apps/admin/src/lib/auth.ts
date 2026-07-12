/**
 * Helper de autenticación para el panel admin.
 *
 * Combina Stack Auth (identidad) con Supabase profiles (rol).
 * Stack Auth provee email; Supabase profiles provee el rol de admin.
 */

import { stackServerApp } from '@/stack'
import { createServerClient } from '@vps/database'
import type { AdminRole } from './roles'
import { isAdminRole } from './roles'

export interface AdminUser {
  /** Email verificado en Stack Auth */
  email: string
  /** Nombre para mostrar (Stack Auth displayName o full_name en profiles) */
  displayName: string
  /** Rol asignado en Supabase profiles */
  role: AdminRole
}

/**
 * Obtiene el usuario admin autenticado.
 * Devuelve null si:
 *  - No hay sesión Stack Auth
 *  - El email no tiene profile en Supabase
 *  - El rol no es un rol de admin (es 'customer' u otro)
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const user = await stackServerApp.getUser()
  if (!user?.primaryEmail) return null

  const supabase = createServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('email', user.primaryEmail)
    .maybeSingle()

  if (!profile || !isAdminRole(profile.role)) return null

  return {
    email: user.primaryEmail,
    displayName: user.displayName ?? profile.full_name ?? user.primaryEmail,
    role: profile.role,
  }
}
