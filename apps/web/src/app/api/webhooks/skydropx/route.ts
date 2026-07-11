import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@vps/database'

const STATUS_MAP: Record<string, string> = {
  'shipment.in_transit':       'shipped',
  'shipment.out_for_delivery': 'shipped',
  'shipment.delivered':        'delivered',
  'shipment.exception':        'exception',
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const newStatus = STATUS_MAP[payload.event]
    if (!newStatus) return NextResponse.json({ ok: true })

    const supabase = createServerClient()
    await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('tracking_number', payload.data?.tracking_number)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook/skydropx]', err)
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
