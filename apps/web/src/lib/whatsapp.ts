import { getStoreConfig } from '@vps/database'

const MESSAGES = {
  maquila: 'Hola, quiero cotizar el servicio de maquila y tueste de café.',
  asesoria: 'Hola, quiero información sobre las asesorías profesionales de café.',
}

export async function getWhatsAppNumber(): Promise<string> {
  const config = await getStoreConfig().catch(() => null)
  return config?.whatsapp_number ?? '573XXXXXXXXX'
}

export async function getWhatsAppURL(service: 'maquila' | 'asesoria'): Promise<string> {
  const number = await getWhatsAppNumber()
  return `https://wa.me/${number}?text=${encodeURIComponent(MESSAGES[service])}`
}
