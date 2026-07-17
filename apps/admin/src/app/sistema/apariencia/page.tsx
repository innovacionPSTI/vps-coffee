import { getAdminConfig } from '@vps/database'
import AdminConfigForm from './AdminConfigForm'

export const metadata = { title: 'Apariencia del Panel' }

export default async function SistemaAparienciaPage() {
  const config = await getAdminConfig()

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-brand-text">Apariencia del Panel</h1>
        <p className="font-brand text-sm text-brand-text/50 mt-1">
          Personaliza los colores del panel de administración. Los cambios aplican a todos los usuarios.
        </p>
      </div>
      <AdminConfigForm initialConfig={config} />
    </div>
  )
}
