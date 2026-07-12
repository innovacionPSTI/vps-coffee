import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth'
import { canAccess } from '@/lib/roles'
import { getThemes } from '@vps/database'
import TemasClient from './TemasClient'

export const metadata = { title: 'Temas' }

export default async function TemasPage() {
  const adminUser = await getAdminUser()
  if (!adminUser) redirect('/sign-in')
  if (!canAccess(adminUser.role, 'configuracion')) redirect('/dashboard')

  const themes = await getThemes().catch(() => [])

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Temas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personaliza la paleta de colores y tipografía del sitio web. El tema activo se aplica
          de forma inmediata en la próxima carga de página.
        </p>
      </div>
      <TemasClient initialThemes={themes} />
    </div>
  )
}
