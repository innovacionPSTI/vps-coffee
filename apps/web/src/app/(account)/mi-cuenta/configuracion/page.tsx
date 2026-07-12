import { Suspense } from 'react'
import type { Metadata } from 'next'
import { stackServerApp } from '@/stack'
import ConfiguracionForm from '@/components/account/ConfiguracionForm'

export const metadata: Metadata = { title: 'Configuración — VPS Coffee' }

export default async function ConfiguracionPage() {
  const user = await stackServerApp.getUser()
  const displayName = user?.displayName ?? ''
  const email = user?.primaryEmail ?? ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-brand-primary text-3xl lg:text-4xl">Configuración</h1>
        <p className="font-brand text-sm text-brand-primary/50 mt-1">
          Administra tu perfil y seguridad
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      }>
        <ConfiguracionForm initialName={displayName} initialEmail={email} />
      </Suspense>
    </div>
  )
}
