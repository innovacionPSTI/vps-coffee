import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from './stack'

/**
 * Middleware de autenticación para VPS Coffee Web.
 *
 * Protege las rutas de /mi-cuenta/*:
 *   - Si el usuario no está autenticado → redirige a /login con returnTo param
 *   - Si está autenticado → continúa
 *
 * Las rutas de /handler/* son de Stack Auth y nunca se protegen.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas de Stack Auth handler: nunca proteger
  if (pathname.startsWith('/handler')) {
    return NextResponse.next()
  }

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
  matcher: [
    '/mi-cuenta/:path*',
    '/handler/:path*',
  ],
}
