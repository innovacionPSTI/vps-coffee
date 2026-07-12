import Link from 'next/link'
import type { Metadata } from 'next'
import { stackServerApp } from '@/stack'
import { getShippingProfile } from '@vps/database'
import ShippingProfileForm from '@/components/account/ShippingProfileForm'

export const metadata: Metadata = { title: 'Mi perfil — VPS Coffee' }

export default async function MiCuentaPage() {
  const user = await stackServerApp.getUser()

  const displayName = user?.displayName ?? ''
  const email = user?.primaryEmail ?? ''
  const firstName = displayName.split(' ')[0] || 'Bienvenido'
  const shippingProfile = email
    ? await getShippingProfile(email).catch(() => null)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-brand-primary text-3xl lg:text-4xl">
          Hola, {firstName}
        </h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          Aquí puedes gestionar tu cuenta y revisar tus pedidos
        </p>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/mi-cuenta/pedidos"
          className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="font-brand font-semibold text-brand-primary">Mis pedidos</p>
              <p className="font-brand text-xs text-brand-primary/50 mt-0.5">
                Historial y estado de tus compras
              </p>
            </div>
            <svg className="w-4 h-4 text-brand-primary/30 group-hover:text-brand-primary transition-colors mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link
          href="/mi-cuenta/configuracion"
          className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-cream flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-brand-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="font-brand font-semibold text-brand-primary">Seguridad</p>
              <p className="font-brand text-xs text-brand-primary/50 mt-0.5">
                Cambia tu contraseña y datos de acceso
              </p>
            </div>
            <svg className="w-4 h-4 text-brand-primary/30 group-hover:text-brand-primary transition-colors mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Datos del perfil */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-primary/8">
          <h2 className="font-brand font-semibold text-brand-primary">Mis datos</h2>
          <Link
            href="/mi-cuenta/configuracion"
            className="font-brand text-sm text-brand-primary/60 hover:text-brand-primary transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar
          </Link>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span className="font-brand text-xs text-brand-primary/40 sm:w-20 flex-shrink-0 uppercase tracking-wide">
              Nombre
            </span>
            <span className="font-brand text-sm text-brand-primary">
              {displayName || <span className="text-brand-primary/30 italic">Sin nombre</span>}
            </span>
          </div>
          <div className="h-px bg-brand-primary/6" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span className="font-brand text-xs text-brand-primary/40 sm:w-20 flex-shrink-0 uppercase tracking-wide">
              Email
            </span>
            <span className="font-brand text-sm text-brand-primary">{email}</span>
          </div>
        </div>
      </div>

      {/* Datos de envío */}
      <ShippingProfileForm initial={shippingProfile} />
    </div>
  )
}
