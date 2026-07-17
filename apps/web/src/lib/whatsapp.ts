import { getStoreConfig } from '@vps/database'

/**
 * Mensajes predeterminados por tipo de servicio.
 * Los seeds del sitio concreto pueden usar cualquier clave string;
 * si no existe aquí se usa el mensaje genérico.
 */
const DEFAULT_MESSAGES: Record<string, string> = {
  maquila:  'Hola, quiero información sobre los servicios de maquila.',
  asesoria: 'Hola, quiero información sobre las asesorías disponibles.',
  general:  'Hola, quisiera más información.',
}

export async function getWhatsAppNumber(): Promise<string> {
  const config = await getStoreConfig().catch(() => null)
  return config?.whatsapp_number ?? '573XXXXXXXXX'
}

export async function getWhatsAppURL(messageType = 'general'): Promise<string> {
  const number = await getWhatsAppNumber()
  const text = DEFAULT_MESSAGES[messageType] ?? DEFAULT_MESSAGES.general
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}
