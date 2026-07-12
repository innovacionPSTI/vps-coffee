/**
 * Definición de roles y permisos del panel de administración VPS Coffee.
 *
 * Roles con acceso al panel:
 *  - super_admin   : Acceso total + gestión de usuarios y asignación de roles
 *  - admin         : Acceso total (sin gestión de usuarios)
 *  - vendedor      : Productos, Categorías, Pedidos, Clientes
 *  - gestor_tienda : Banners, Blog, Configuración General
 *
 * Roles sin acceso al panel:
 *  - miembro       : Sin permisos. Rol predeterminado al crear un usuario.
 *                    Un admin debe asignar un rol real para que pueda ingresar.
 *  - customer      : Usuario del sitio web (apps/web). No aplica al admin.
 */

/** Roles que tienen acceso efectivo al panel de administración */
export type AdminRole = 'super_admin' | 'admin' | 'vendedor' | 'gestor_tienda'

/**
 * Todos los roles que pueden existir en la columna profiles.role
 * para usuarios del panel de administración.
 * 'miembro' = usuario invitado pero sin permisos asignados aún.
 */
export type AssignableRole = AdminRole | 'miembro'

export type AdminSection =
  | 'dashboard'
  | 'productos'
  | 'categorias'
  | 'pedidos'
  | 'clientes'
  | 'banners'
  | 'blog'
  | 'configuracion'
  | 'usuarios'

interface RoleConfig {
  label: string
  color: string        // Tailwind classes para badge
  sections: AdminSection[]
  canManageUsers: boolean
  canAccessFullConfig: boolean
}

export const ROLE_CONFIG: Record<AdminRole, RoleConfig> = {
  super_admin: {
    label: 'Super Admin',
    color: 'bg-red-100 text-red-700',
    sections: ['dashboard', 'productos', 'categorias', 'pedidos', 'clientes', 'banners', 'blog', 'configuracion', 'usuarios'],
    canManageUsers: true,
    canAccessFullConfig: true,
  },
  admin: {
    label: 'Admin',
    color: 'bg-brand-primary/10 text-brand-primary',
    sections: ['dashboard', 'productos', 'categorias', 'pedidos', 'clientes', 'banners', 'blog', 'configuracion'],
    canManageUsers: false,
    canAccessFullConfig: true,
  },
  vendedor: {
    label: 'Vendedor',
    color: 'bg-green-100 text-green-700',
    sections: ['dashboard', 'productos', 'categorias', 'pedidos', 'clientes'],
    canManageUsers: false,
    canAccessFullConfig: false,
  },
  gestor_tienda: {
    label: 'Gestor de Tienda',
    color: 'bg-blue-100 text-blue-700',
    sections: ['dashboard', 'banners', 'blog', 'configuracion'],
    canManageUsers: false,
    canAccessFullConfig: false,
  },
}

/** Roles con acceso real al panel (exluye 'miembro') */
export const ADMIN_ROLES: AdminRole[] = ['super_admin', 'admin', 'vendedor', 'gestor_tienda']

/** Verifica si un string es un AdminRole con acceso real al panel */
export function isAdminRole(role: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole)
}

/** Verifica si el rol tiene acceso a una sección */
export function canAccess(role: AdminRole, section: AdminSection): boolean {
  return ROLE_CONFIG[role].sections.includes(section)
}

/**
 * Roles que se pueden asignar a un usuario desde /usuarios.
 * 'miembro' está incluido para poder "revocar" privilegios sin eliminar la cuenta.
 * 'super_admin' nunca es asignable (para evitar escalada de privilegios).
 */
export const ASSIGNABLE_ROLES: AssignableRole[] = ['admin', 'vendedor', 'gestor_tienda', 'miembro']

export const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin:   { label: 'Super Admin',      color: 'bg-red-100 text-red-700' },
  admin:         { label: 'Admin',             color: 'bg-brand-primary/10 text-brand-primary' },
  vendedor:      { label: 'Vendedor',          color: 'bg-green-100 text-green-700' },
  gestor_tienda: { label: 'Gestor de Tienda', color: 'bg-blue-100 text-blue-700' },
  miembro:       { label: 'Miembro',           color: 'bg-amber-100 text-amber-700' },
  customer:      { label: 'Cliente',           color: 'bg-gray-100 text-gray-500' },
}
