import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import { StackProvider, StackTheme } from '@stackframe/stack'
import { stackServerApp } from '../stack'
import './globals.css'

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
  title: {
    default: 'VPS Coffee Roasting House',
    template: '%s | VPS Coffee',
  },
  description:
    'Café de especialidad colombiano con trazabilidad completa. Tueste artesanal, maquila y asesorías profesionales.',
  keywords: ['café de especialidad', 'café colombiano', 'tueste artesanal', 'maquila de café', 'VPS Coffee'],
  openGraph: {
    siteName: 'VPS Coffee Roasting House',
    locale: 'es_CO',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        <StackProvider app={stackServerApp}>
          <StackTheme>
            {children}
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  )
}
