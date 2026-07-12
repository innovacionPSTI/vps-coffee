import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** Redirige a la primera sub-sección de configuración */
export default function ConfiguracionPage() {
  redirect('/configuracion/general')
}
