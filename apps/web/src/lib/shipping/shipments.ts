/**
 * createShipmentForOrder
 *
 * Called after a payment is confirmed (Wompi/MercadoPago webhook).
 * Looks up the order and shipping config, generates a Skydropx label,
 * and saves tracking_number + label_url + skydropx_shipment_id to the order.
 *
 * This function NEVER throws — any failure is logged and returns null
 * so the webhook can still respond 200 and avoid retries.
 */

import { createServerClient, getShippingConfig } from '@vps/database'
import { SkydropxProvider } from './providers/skydropx'
import { calculateParcel } from './types'
import type { ShippingAddress } from './types'
import type { OrderItem, ShippingAddress as DBShippingAddress } from '@vps/database'

interface ShipmentOutcome {
  shipmentId: string
  trackingNumber: string
  labelUrl: string
  carrierName: string
  total: number
}

export async function createShipmentForOrder(
  orderNumber: string
): Promise<ShipmentOutcome | null> {
  try {
    const supabase = createServerClient()

    // 1. Load the order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()

    if (orderErr || !order) {
      console.error('[shipments] Orden no encontrada:', orderNumber)
      return null
    }

    // Skip if shipment already exists
    if (order.skydropx_shipment_id) {
      console.info('[shipments] Shipment ya existe para:', orderNumber)
      return null
    }

    // 2. Load shipping config
    const config = await getShippingConfig()

    if (config.provider !== 'skydropx') {
      // Fixed rate — no label to generate
      return null
    }

    const {
      skydropx_client_id,
      skydropx_client_secret,
      skydropx_base_url,
      origin_name,
      origin_street,
      origin_neighborhood,
      origin_city,
      origin_department,
      origin_postal_code,
      origin_phone,
      origin_email,
    } = config

    if (
      !skydropx_client_id || !skydropx_client_secret ||
      !origin_name || !origin_street || !origin_city ||
      !origin_department || !origin_postal_code || !origin_phone || !origin_email
    ) {
      console.warn('[shipments] Skydropx no configurado completamente, omitiendo creación de guía')
      return null
    }

    // 3. Build destination address from the order
    const shippingAddr = order.shipping_addr as unknown as DBShippingAddress
    const destination: ShippingAddress = {
      name:        order.customer_name,
      street1:     shippingAddr.address,
      postal_code: shippingAddr.postal_code ?? '000000',
      area_level1: shippingAddr.department ?? shippingAddr.city,
      area_level2: shippingAddr.city,
      country_code: 'CO',
      phone:       order.customer_phone ?? origin_phone,
      email:       order.customer_email,
    }

    // 4. Build parcel from order items
    const items = order.items as unknown as OrderItem[]
    const parcel = calculateParcel(
      items.map((i) => ({
        weight: i.variant_label ?? '500g',
        qty: i.qty,
      }))
    )

    // 5. Create the shipment via Skydropx
    const provider = new SkydropxProvider({
      clientId: skydropx_client_id,
      clientSecret: skydropx_client_secret,
      baseUrl: skydropx_base_url ?? 'https://app.skydropx.com',
      origin: {
        name: origin_name,
        street: origin_street,
        neighborhood: origin_neighborhood ?? '',
        city: origin_city,
        department: origin_department,
        postalCode: origin_postal_code,
        phone: origin_phone,
        email: origin_email,
      },
    })

    const result = await provider.createShipment(destination, parcel)

    // 6. Persist the shipment data in the order
    const { error: updateErr } = await supabase
      .from('orders')
      .update({
        skydropx_shipment_id: result.shipmentId,
        tracking_number:      result.trackingNumber,
        label_url:            result.labelUrl,
        carrier_name:         result.carrierName,
        shipping_cost_final:  result.total,
        status:               'processing',
        updated_at:           new Date().toISOString(),
      })
      .eq('order_number', orderNumber)

    if (updateErr) {
      console.error('[shipments] Error guardando shipment en orden:', updateErr)
    } else {
      console.info('[shipments] Guía creada:', result.trackingNumber, 'para orden:', orderNumber)
    }

    return result
  } catch (err) {
    console.error('[shipments] Error creando shipment para orden', orderNumber, ':', err)
    return null
  }
}
