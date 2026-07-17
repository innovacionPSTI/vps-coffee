/**
 * POST /api/admin/import
 *
 * Restaura un snapshot JSON exportado por /api/admin/export.
 * Idempotente: usa upsert con las claves estables de cada tabla.
 *
 * Claves estables:
 *   - store_config   → id (siempre 1)
 *   - admin_config   → id (siempre 1, singleton)
 *   - themes         → id (serial)
 *   - nav_items      → nav_key (string estable)
 *   - pages          → key  (string estable)
 *   - page_sections  → section_key (UUID estable)
 *   - section_items  → id (serial)
 *
 * Versiones soportadas:
 *   v1 — section_settings y banners (tablas eliminadas en migración 19; ignoradas silenciosamente)
 *   v2 — CMS unificado
 *   v3 — agrega admin_config y themes
 *
 * Solo accesible por super_admin y admin.
 * Body: JSON del snapshot (Content-Type: application/json)
 */
import { createServerClient } from '@vps/database'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (user.role !== 'super_admin' && user.role !== 'admin') {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  let snapshot: Record<string, unknown>
  try {
    snapshot = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (typeof snapshot !== 'object' || snapshot === null) {
    return NextResponse.json({ error: 'Formato de snapshot inválido' }, { status: 400 })
  }

  const db = createServerClient()
  const results: Record<string, string> = {}

  try {
    // ── 1. store_config ──────────────────────────────────────────────────────
    if (snapshot.store_config && typeof snapshot.store_config === 'object') {
      const { error: e } = await db
        .from('store_config')
        .upsert(snapshot.store_config as Record<string, unknown>, { onConflict: 'id' })
      results.store_config = e ? `error: ${e.message}` : 'ok'
    }

    // ── 2. admin_config (singleton — id siempre 1) ───────────────────────────
    if (snapshot.admin_config && typeof snapshot.admin_config === 'object') {
      const { error: e } = await db
        .from('admin_config')
        .upsert(snapshot.admin_config as Record<string, unknown>, { onConflict: 'id' })
      results.admin_config = e ? `error: ${e.message}` : 'ok'
    }

    // ── 3. themes ────────────────────────────────────────────────────────────
    if (Array.isArray(snapshot.themes) && snapshot.themes.length > 0) {
      const { error: e } = await db
        .from('themes')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(snapshot.themes as any[], { onConflict: 'id' })
      results.themes = e ? `error: ${e.message}` : `ok (${snapshot.themes.length})`
    }

    // ── 4. nav_items (upsert por nav_key) ────────────────────────────────────
    if (Array.isArray(snapshot.nav_items) && snapshot.nav_items.length > 0) {
      const navWithKey = (snapshot.nav_items as Record<string, unknown>[]).filter((n) => n.nav_key)
      if (navWithKey.length > 0) {
        const { error: e } = await db
          .from('nav_items')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .upsert(navWithKey as any[], { onConflict: 'nav_key', ignoreDuplicates: false })
        results.nav_items = e ? `error: ${e.message}` : `ok (${navWithKey.length})`
      }
    }

    // ── 5. pages (upsert por key) ────────────────────────────────────────────
    if (Array.isArray(snapshot.pages) && snapshot.pages.length > 0) {
      const { error: e } = await db
        .from('pages')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(snapshot.pages as any[], { onConflict: 'key' })
      results.pages = e ? `error: ${e.message}` : `ok (${snapshot.pages.length})`
    }

    // ── 6. page_sections (upsert por section_key) ────────────────────────────
    if (Array.isArray(snapshot.page_sections) && snapshot.page_sections.length > 0) {
      const sectionsWithKey = (snapshot.page_sections as Record<string, unknown>[]).filter(
        (s) => s.section_key
      )
      if (sectionsWithKey.length > 0) {
        const { error: e } = await db
          .from('page_sections')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .upsert(sectionsWithKey as any[], { onConflict: 'section_key' })
        results.page_sections = e ? `error: ${e.message}` : `ok (${sectionsWithKey.length})`
      }
    }

    // ── 7. section_items (upsert por id) ─────────────────────────────────────
    if (Array.isArray(snapshot.section_items) && snapshot.section_items.length > 0) {
      const { error: e } = await db
        .from('section_items')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(snapshot.section_items as any[], { onConflict: 'id' })
      results.section_items = e ? `error: ${e.message}` : `ok (${snapshot.section_items.length})`
    }

    // Claves de snapshots legacy (v1) — ignoradas silenciosamente
    // section_settings, banners: eliminadas en migración 19 (CMS unificado)

    const hasErrors = Object.values(results).some((v) => v.startsWith('error'))
    return NextResponse.json(
      { success: !hasErrors, version: snapshot.version ?? 'unknown', results },
      { status: hasErrors ? 207 : 200 }
    )
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al importar' },
      { status: 500 }
    )
  }
}
