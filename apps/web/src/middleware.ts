import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from './stack'

/**
 * Middleware de VPS Coffee Web.
 *
 * 1. Modo mantenimiento: si está activo redirige todo a /maintenance
 *    (excepto la propia página, APIs y rutas de auth).
 *    El estado se cachea 60 s en memoria para no golpear la BD en cada request.
 *
 * 2. Auth guard: protege /mi-cuenta/* y redirige al login si no hay sesión.
 */

let maintenanceCache: { value: boolean; expiresAt: number } | null = null
const MAINTENANCE_TTL_MS = 60_000

async function checkMaintenanceMode(baseUrl: string): Promise<boolean> {
  const now = Date.now()
  if (maintenanceCache && maintenanceCache.expiresAt > now) return maintenanceCache.value
  try {
    const res = await fetch(`${baseUrl}/api/maintenance-status`, { cache: 'no-store' })
    if (res.ok) {
      const { maintenance_mode } = await res.json()
      maintenanceCache = { value: !!maintenance_mode, expiresAt: now + MAINTENANCE_TTL_MS }
      return !!maintenance_mode
    }
  } catch {
    // No bloquear la navegación si la API falla
  }
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas inmunes al modo mantenimiento
  const bypassMaintenance =
    pathname === '/maintenance' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/handler') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  if (!bypassMaintenance) {
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    if (await checkMaintenanceMode(baseUrl)) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  // Stack Auth handler: nunca proteger
  if (pathname.startsWith('/handler')) return NextResponse.next()

  // Rutas protegidas: /mi-cuenta/*
  if (pathname.startsWith('/mi-cuenta')) {
    const user = await stackServerApp.getUser()
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
