/**
 * GET /api/admin/export
 *
 * Genera un snapshot JSON (v3) del contenido y configuración gestionable:
 *   - store_config   (fila única, incluye favicon_url)
 *   - admin_config   (fila única — colores del panel de administración)
 *   - themes         (temas visuales del sitio web)
 *   - nav_items      (con nav_key estable)
 *   - pages          (con page_key estable)
 *   - page_sections  (con section_key estable)
 *   - section_items
 *
 * Versiones anteriores:
 *   v1 — incluía section_settings y banners (tablas eliminadas en migración 19)
 *   v2 — modelo CMS unificado sin section_settings ni banners
 *   v3 — agrega admin_config y themes
 *
 * Solo accesible por super_admin y admin.
 */
import { createServerClient } from '@vps/database'
import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (user.role !== 'super_admin' && user.role !== 'admin') {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const db = createServerClient()

  const [
    storeConfig,
    adminConfig,
    themes,
    navItems,
    pages,
    sections,
    sectionItems,
  ] = await Promise.all([
    db.from('store_config').select('*').eq('id', 1).maybeSingle(),
    db.from('admin_config').select('*').eq('id', 1).maybeSingle(),
    db.from('themes').select('*').order('id'),
    db.from('nav_items').select('*').order('order_index'),
    db.from('pages').select('*').order('order_index'),
    db.from('page_sections').select('*').order('order_index'),
    db.from('section_items').select('*').order('order_index'),
  ])

  const snapshot = {
    version: 3,
    exported_at: new Date().toISOString(),
    store_config:  storeConfig.data  ?? null,
    admin_config:  adminConfig.data  ?? null,
    themes:        themes.data       ?? [],
    nav_items:     navItems.data     ?? [],
    pages:         pages.data        ?? [],
    page_sections: sections.data     ?? [],
    section_items: sectionItems.data ?? [],
  }

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="vps-content-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
