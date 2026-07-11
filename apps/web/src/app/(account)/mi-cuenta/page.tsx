import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi Cuenta' }

// Esta página requiere auth — el middleware redirigirá si no hay sesión
export default async function MiCuentaPage() {
  // TODO: Obtener datos del usuario desde Stack Auth
  // const user = await stackServerApp.getUser()
  // if (!user) redirect('/login')

  return (
    <div className="bg-brand-cream min-h-screen pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <nav className="bg-white rounded-2xl shadow-sm p-4 space-y-1">
              <Link
                href="/tienda"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-brand text-sm text-brand-primary/60 hover:text-brand-primary hover:bg-brand-cream transition-colors"
              >
                <span>←</span>
                Volver a la tienda
              </Link>
              <hr className="border-brand-primary/10 my-2" />
              {[
                { href: '/mi-cuenta', icon: '👤', label: 'Mi perfil' },
                { href: '/mi-cuenta/pedidos', icon: '📦', label: 'Mis pedidos' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-brand text-sm text-brand-primary hover:bg-brand-cream transition-colors"
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <hr className="border-brand-primary/10 my-2" />
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-brand text-sm text-red-500 hover:bg-red-50 transition-colors">
                <span>🚪</span>
                Cerrar sesión
              </button>
            </nav>
          </aside>

          {/* Content */}
          <main className="md:col-span-3 space-y-6">
            <h1 className="font-display text-brand-primary text-section">
              Bienvenido
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="font-brand text-sm text-brand-primary/50 mb-1">Pedidos activos</p>
                <p className="font-brand font-bold text-brand-primary text-3xl">0</p>
                <Link href="/mi-cuenta/pedidos" className="font-brand text-xs text-brand-primary underline mt-2 block">
                  Ver pedidos →
                </Link>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <p className="font-brand text-sm text-brand-primary/50 mb-1">Último pedido</p>
                <p className="font-brand text-brand-primary/40 text-sm mt-2">Sin pedidos aún</p>
              </div>
            </div>

            {/* Perfil */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-brand font-semibold text-brand-primary text-lg">Mis datos</h2>
                <button className="font-brand text-sm text-brand-primary border border-brand-primary/20 rounded-full px-4 py-1.5 hover:bg-brand-cream transition-colors">
                  Editar
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Nombre', value: '—' },
                  { label: 'Email', value: '—' },
                  { label: 'Teléfono', value: '—' },
                ].map((field) => (
                  <div key={field.label} className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="font-brand text-xs text-brand-primary/40 sm:w-24 flex-shrink-0">{field.label}</span>
                    <span className="font-brand text-sm text-brand-primary">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
