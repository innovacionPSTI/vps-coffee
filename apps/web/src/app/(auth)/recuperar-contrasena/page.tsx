import { Suspense } from 'react'
import type { Metadata } from 'next'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata: Metadata = { title: 'Recuperar contraseña — VPS Coffee' }

export default function RecuperarContrasenaPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
