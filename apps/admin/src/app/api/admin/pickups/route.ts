/**
 * Admin API — Pickups (recolecciones Skydropx)
 *
 * POST /api/admin/pickups → crea una recolección para un conjunto de guías
 * GET  /api/admin/pickups → lista recolecciones (opcional, paginado)
 *
 * Body (POST):
 * {
 *   shipment_ids: string[]   — UUIDs de shipments en Skydropx
 *   pickup_date: string      — "YYYY-MM-DD"
 *   pickup_time_from: string — "HH:MM"
 *   pickup_time_to: string   — "HH:MM"
 *   instructions?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getShippingConfig } from '@vps/database'
import { skydropxFetch } from '@/lib/shipping/providers/skydropx/auth'

// ─── POST: crear pickup ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      shipment_ids: string[]
      pickup_date: string
      pickup_time_from: string
      pickup_time_to: string
      instructions?: string
    }

    const { shipment_ids, pickup_date, pickup_time_from, pickup_time_to, instructions } = body

    if (!shipment_ids?.length) {
      return NextResponse.json({ error: 'Se requiere al menos un shipment_id' }, { status: 400 })
    }
    if (!pickup_date || !pickup_time_from || !pickup_time_to) {
      return NextResponse.json({ error: 'pickup_date, pickup_time_from y pickup_time_to son requeridos' }, { status: 400 })
    }

    const config = await getShippingConfig()
    if (!config.skydropx_client_id || !config.skydropx_client_secret) {
      return NextResponse.json({ error: 'Skydropx no está configurado' }, { status: 503 })
    }

    const creds = {
      clientId: config.skydropx_client_id,
      clientSecret: config.skydropx_client_secret,
      baseUrl: config.skydropx_base_url ?? 'https://app.skydropx.com',
    }

    const pickupBody = {
      pickup: {
        address: {
          name: config.origin_name,
          street1: config.origin_street,
          zip: config.origin_postal_code,
          country_code: 'CO',
          phone: config.origin_phone,
          email: config.origin_email,
        },
        pickup_date,
        pickup_time_from,
        pickup_time_to,
        shipment_ids,
        ...(instructions ? { instructions } : {}),
      },
    }

    const res = await skydropxFetch('/api/v1/pickups', creds, {
      method: 'POST',
      body: JSON.stringify(pickupBody),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('[admin/pickups POST] Skydropx error:', data)
      return NextResponse.json(
        { error: 'Error creando recolección en Skydropx', details: data },
        { status: res.status }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[admin/pickups POST]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ─── GET: listar pickups ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page    = searchParams.get('page') ?? '1'
    const perPage = searchParams.get('per_page') ?? '20'

    const config = await getShippingConfig()
    if (!config.skydropx_client_id || !config.skydropx_client_secret) {
      return NextResponse.json({ error: 'Skydropx no está configurado' }, { status: 503 })
    }

    const creds = {
      clientId: config.skydropx_client_id,
      clientSecret: config.skydropx_client_secret,
      baseUrl: config.skydropx_base_url ?? 'https://app.skydropx.com',
    }

    const res = await skydropxFetch(
      `/api/v1/pickups?page=${page}&per_page=${perPage}`,
      creds
    )
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: 'Error listando recolecciones', details: data }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[admin/pickups GET]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
