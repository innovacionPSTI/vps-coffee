import type { Metadata } from 'next'
import './globals.css'
import AdminSidebar from '@/components/layout/AdminSidebar'

export const metadata: Metadata = {
  title: { default: 'Admin — VPS Coffee', template: '%s | Admin VPS' },
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50">
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {/* Topbar */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <input
                  type="search"
                  placeholder="Buscar..."
                  className="font-brand text-sm border border-gray-200 rounded-full px-4 py-2 w-64 focus:outline-none focus:border-brand-primary"
                />
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 text-brand-primary/50 hover:text-brand-primary transition-colors">
                  🔔
                </button>
                <div className="flex items-center gap-2 font-brand text-sm text-brand-primary">
                  <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center">
                    <span className="text-xs">👤</span>
                  </div>
                  Admin
                </div>
              </div>
            </header>
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
