import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sin acceso' }

export default function NoAutorizadoPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="font-display text-brand-primary text-2xl mb-2">Sin acceso</h1>
        <p className="font-brand text-sm text-brand-primary/50 mb-6">
          Tu cuenta no tiene permisos para acceder al panel de administración.
          Contacta al super administrador para solicitar acceso.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/handler/sign-out"
            className="w-full bg-brand-primary text-brand-cream rounded-full py-2.5 font-brand text-sm font-medium hover:bg-brand-dark transition-colors"
          >
            Cerrar sesión
          </Link>
          <Link
            href="/handler/sign-in"
            className="w-full border border-brand-primary/20 text-brand-primary rounded-full py-2.5 font-brand text-sm hover:bg-brand-primary/5 transition-colors"
          >
            Iniciar sesión con otra cuenta
          </Link>
        </div>
      </div>
    </div>
  )
}
