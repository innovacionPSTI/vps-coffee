import { Suspense } from 'react'
import RegistroForm from '@/components/auth/RegistroForm'

export const metadata = {
  title: 'Crear cuenta',
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  )
}
