import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from './stack'

/**
 * Middleware del panel admin VPS Coffee.
 *
 * Responsabilidades:
 * 1. Inyectar header x-pathname para que el layout pueda leer la ruta actual
 * 2. Bloquear /handler/sign-up (signup deshabilitado en admin)
 * 3. Redirigir usuarios no autenticados a /handler/sign-in
 *
 * La verificación de ROL ocurre en el layout (Server Component),
 * no aquí, para evitar limitaciones del runtime de edge con Supabase.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Inyectar pathname en headers para que el layout lo lea
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // ── Bloquear sign-up ─────────────────────────────────────────────────────
  // El admin no permite auto-registro. Los usuarios solo puede crearlos el super_admin.
  if (pathname === '/handler/sign-up' || pathname.startsWith('/handler/sign-up/')) {
    return NextResponse.redirect(new URL('/handler/sign-in', request.url))
  }

  // ── Rutas públicas del handler (sign-in, sign-out, password-reset, etc.) ─
  if (pathname.startsWith('/handler')) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ── Página de no-autorizado: permitir siempre ─────────────────────────────
  if (pathname === '/no-autorizado') {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // ── Verificar sesión Stack Auth ───────────────────────────────────────────
  const user = await stackServerApp.getUser()
  if (!user) {
    const signInUrl = new URL('/handler/sign-in', request.url)
    signInUrl.searchParams.set('after_auth_return_to', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
