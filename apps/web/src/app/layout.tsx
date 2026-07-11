import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
