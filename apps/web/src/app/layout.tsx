import type { Metadata, ResolvingMetadata } from 'next'
import { Suspense } from 'react'
import { Cormorant_Garamond, DM_Sans, Playfair_Display, Inter } from 'next/font/google'
import { StackProvider, StackTheme } from '@stackframe/stack'
import { Analytics } from '@vercel/analytics/react'
import { stackServerApp } from '../stack'
import { getStoreConfig, getActiveTheme } from '@vps/database'
import type { Theme } from '@vps/database'
import CartSyncOnLogin from '@/components/auth/CartSyncOnLogin'
import './globals.css'

// ── Fuentes (next/font: build-time, self-hosted) ──────────────────────────────

// Display opción 1: Cormorant Garamond (por defecto)
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-ahsing',
  display: 'swap',
})

// Display opción 2: Playfair Display
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

// Body opción 1: DM Sans (por defecto)
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-geeeki',
  display: 'swap',
})

// Body opción 2: Inter
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convierte hex #RRGGBB a canales RGB separados por espacios para CSS vars */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

/** Mapeo de identificador de fuente → valor de CSS var */
const FONT_DISPLAY_MAP: Record<string, string> = {
  cormorant: 'var(--font-ahsing), Georgia, serif',
  playfair:  'var(--font-playfair), Georgia, serif',
}
const FONT_BODY_MAP: Record<string, string> = {
  'dm-sans': 'var(--font-geeeki), system-ui, sans-serif',
  inter:     'var(--font-inter), system-ui, sans-serif',
}

/**
 * Genera el bloque CSS que sobreescribe las CSS vars del tema activo.
 * Se inyecta como <style> inline en el <head> del documento.
 * Los defaults en globals.css actúan como fallback si este bloque no existe.
 */
function buildThemeCSS(theme: Theme): string {
  const fontDisplay = FONT_DISPLAY_MAP[theme.font_display] ?? FONT_DISPLAY_MAP.cormorant
  const fontBody    = FONT_BODY_MAP[theme.font_body]       ?? FONT_BODY_MAP['dm-sans']

  return `:root {
  --brand-primary:     ${hexToRgb(theme.color_primary)};
  --brand-dark:        ${hexToRgb(theme.color_dark)};
  --brand-cream:       ${hexToRgb(theme.color_cream)};
  --brand-cream-warm:  ${hexToRgb(theme.color_cream_warm)};
  --brand-yellow:      ${hexToRgb(theme.color_yellow)};
  --brand-yellow-pale: ${hexToRgb(theme.color_yellow_pale)};
  --brand-text:        ${hexToRgb(theme.color_text)};
  --font-display:      ${fontDisplay};
  --font-body:         ${fontBody};
}`
}

// ── Metadata ──────────────────────────────────────────────────────────────────

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata(_props: object, _parent: ResolvingMetadata): Promise<Metadata> {
  const config = await getStoreConfig().catch(() => null)

  const storeName   = config?.store_name   ?? 'Tienda en línea'
  const description = config?.store_description ?? 'Bienvenido a nuestra tienda en línea. Explora nuestros productos y realiza tu pedido de forma segura.'
  const keywords    = config?.seo_keywords
    ? config.seo_keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : ['tienda online', 'ecommerce', 'compras en línea']

  return {
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description,
    keywords,
    metadataBase: BASE_URL ? new URL(BASE_URL) : undefined,
    openGraph: {
      locale: 'es_CO',
      type: 'website',
      siteName: storeName,
      ...(BASE_URL && { url: BASE_URL }),
      images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: storeName }],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-default.jpg'],
    },
    robots: { index: true, follow: true },
    icons: config?.favicon_url
      ? { icon: config.favicon_url, shortcut: config.favicon_url }
      : undefined,
  }
}

// ── Root Layout ───────────────────────────────────────────────────────────────

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [config, theme] = await Promise.all([
    getStoreConfig().catch(() => null),
    getActiveTheme().catch(() => null),
  ])

  const analyticsEnabled = config?.analytics_enabled ?? false
  const themeCSS = theme ? buildThemeCSS(theme) : null

  // Variables CSS de todas las fuentes pre-cargadas
  const fontVars = [
    cormorant.variable,
    playfair.variable,
    dmSans.variable,
    inter.variable,
  ].join(' ')

  return (
    <html lang="es" className={fontVars}>
      <head>
        {/* Favicon dinámico desde store_config */}
        {config?.favicon_url && (
          <link rel="icon" href={config.favicon_url} />
        )}
        {/* Tema activo: sobreescribe las CSS vars definidas en globals.css */}
        {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}
      </head>
      <body>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <Suspense fallback={null}><CartSyncOnLogin /></Suspense>
            {children}
          </StackTheme>
        </StackProvider>
        {analyticsEnabled && <Analytics />}
      </body>
    </html>
  )
}
