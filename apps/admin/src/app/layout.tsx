import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import './globals.css'
import { StackProvider, StackTheme } from '@stackframe/stack'
import { stackServerApp } from '../stack'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { getAdminUser } from '@/lib/auth'
import { getAdminConfig } from '@vps/database'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-ahsing',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-geeeki',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Panel de Administración', template: '%s | Admin' },
  robots: { index: false, follow: false },
}

/** Convierte hex #RRGGBB a canales RGB separados por espacios para Tailwind */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

/** Oscurece un hex multiplicando sus canales por factor (0–1) */
function darkenHex(hex: string, factor = 0.85): string {
  const h = hex.replace('#', '')
  const r = Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * factor))
  const g = Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * factor))
  const b = Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * factor))
  return `${r} ${g} ${b}`
}

/** Rutas que NO requieren verificación de rol de admin */
const PUBLIC_PATHS = ['/handler', '/no-autorizado']

function isPublicPath(pathname: string): boolean {
  // pathname vacío = build-time (no hay request headers); tratar como público
  // para que Next.js pueda pre-renderizar /_not-found sin sesión de usuario.
  if (!pathname) return true
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))
}

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  // ── Configuración visual del panel ─────────────────────────────────────────
  const adminConfig = await getAdminConfig().catch(() => null)
  const adminCSS = adminConfig
    ? `:root {
  --brand-primary: ${hexToRgb(adminConfig.accent_color)};
  --brand-dark:    ${darkenHex(adminConfig.accent_color, 0.85)};
  --brand-sidebar: ${hexToRgb(adminConfig.sidebar_color)};
}`
    : null

  // ── Verificación de rol ────────────────────────────────────────────────────
  // Solo en rutas protegidas (no handler/* ni /no-autorizado)
  let adminUser = null
  if (!isPublicPath(pathname)) {
    adminUser = await getAdminUser()
    if (!adminUser) {
      redirect('/no-autorizado')
    }
  }

  // Datos del topbar
  const displayName = adminUser?.displayName ?? ''
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('')

  const isProtectedRoute = !isPublicPath(pathname)

  return (
    <html lang="es" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        {/* Tema del panel: sobreescribe los defaults de globals.css con valores de admin_config */}
        {adminCSS && <style dangerouslySetInnerHTML={{ __html: adminCSS }} />}
      </head>
      <body className="bg-gray-50">
        <StackProvider app={stackServerApp}>
          <StackTheme>
            {isProtectedRoute && adminUser ? (
              <div className="flex min-h-screen">
                <AdminSidebar role={adminUser.role} />
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Topbar */}
                  <header className="bg-white border-b border-gray-100 pl-14 pr-6 md:px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                      <input
                        type="search"
                        placeholder="Buscar..."
                        className="font-brand text-sm border border-gray-200 rounded-full px-4 py-2 w-64 focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 font-brand text-sm text-brand-primary">
                        <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-xs font-semibold text-brand-primary">
                          {initials || '👤'}
                        </div>
                        <div className="hidden sm:block text-right">
                          <p className="text-sm font-medium truncate max-w-[140px]">{displayName}</p>
                          <p className="text-xs text-brand-primary/40">{adminUser.role.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>
                  </header>
                  <main className="flex-1 p-6">{children}</main>
                </div>
              </div>
            ) : (
              /* Rutas públicas: handler/*, no-autorizado */
              <>{children}</>
            )}
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  )
}
