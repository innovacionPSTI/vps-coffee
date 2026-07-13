import { NextRequest, NextResponse } from 'next/server'
import { getShippingProvider, calculateParcel } from '@/lib/shipping'
import type { ShippingAddress, ParcelItem } from '@/lib/shipping'

export async function POST(req: NextRequest) {
  try {
    const { address, items } = await req.json()

    const shippingAddress: ShippingAddress = {
      name:         address.name,
      street1:      address.street,
      postal_code:  address.postal_code ?? '',
      area_level1:  address.department,
      area_level2:  address.city,
      country_code: 'CO',
      phone:        address.phone,
      email:        address.email,
      reference:    address.reference,
    }

    const parcel = calculateParcel(items as ParcelItem[])

    // Declared value required by Skydropx PRO — sum of (price × qty)
    const rawDeclared = items.reduce(
      (sum: number, i: { price?: number; qty: number }) => sum + (i.price ?? 0) * i.qty,
      0
    )
    parcel.declaredAmount = rawDeclared >= 1000 ? rawDeclared : 50000  // safety floor

    // Factory reads provider + credentials from shipping_config in the DB
    const provider = await getShippingProvider()
    const rates = await provider.getRates(shippingAddress, parcel)

    return NextResponse.json({
      provider: provider.name,
      rates,
    })
  } catch (err) {
    console.error('[api/shipping/rates]', err)
    return NextResponse.json({ error: 'Error calculando tarifas de envío' }, { status: 500 })
  }
}
