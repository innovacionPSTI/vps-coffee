import { skydropxFetch } from './auth'

export interface ShipmentParcel {
  length: number
  width: number
  height: number
  weight: number
}

export interface AddressTo {
  name: string
  street1: string
  postal_code: string
  area_level1: string
  area_level2: string
  country_code: 'CO'
  phone: string
  email: string
  reference?: string
}

export async function createQuotation(addressTo: AddressTo, parcel: ShipmentParcel) {
  const res = await skydropxFetch('/api/v1/quotations', {
    method: 'POST',
    body: JSON.stringify({
      quotation: {
        address_from_id: process.env.SKYDROPX_ADDRESS_FROM_ID,
        address_to: addressTo,
        parcel,
      },
    }),
  })
  const data = await res.json()
  return data.data
}

export async function getQuotationRates(quotationId: string) {
  for (let i = 0; i < 10; i++) {
    const res = await skydropxFetch(`/api/v1/quotations/${quotationId}`)
    const data = await res.json()
    if (data.data?.attributes?.is_completed) {
      return data.data.attributes.rates as Rate[]
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('Cotización no completada en tiempo esperado')
}

export interface Rate {
  id: string
  carrier_name: string
  service_name: string
  currency: string
  total_price: number
  days: number
  estimated_delivery: string
}

export function calculateParcel(items: { weight: string; qty: number }[]): ShipmentParcel {
  const totalWeight = items.reduce((sum, item) => {
    const weights: Record<string, number> = { '250g': 0.3, '500g': 0.6, '1kg': 1.1 }
    return sum + (weights[item.weight] ?? 0.5) * item.qty
  }, 0)

  if (totalWeight <= 0.7) return { length: 20, width: 15, height: 8, weight: totalWeight }
  if (totalWeight <= 1.5) return { length: 25, width: 20, height: 10, weight: totalWeight }
  return { length: 35, width: 25, height: 15, weight: totalWeight }
}
