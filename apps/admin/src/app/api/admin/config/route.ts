import { NextRequest, NextResponse } from 'next/server'
import { getStoreConfig, updateStoreConfig } from '@vps/database'
import type { UpdateStoreConfigInput } from '@vps/database'

function maskSecret(value: string | null): string | null {
  if (!value) return null
  if (value.length <= 4) return '••••'
  return `••••${value.slice(-4)}`
}

export async function GET() {
  try {
    const config = await getStoreConfig()
    // Enmascarar la API key de Resend antes de enviarla al cliente
    return NextResponse.json({
      ...config,
      resend_api_key: maskSecret(config.resend_api_key),
      has_resend_api_key: !!config.resend_api_key,
    })
  } catch (err) {
    console.error('[admin/config GET]', err)
    return NextResponse.json({ error: 'Error cargando configuración' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as UpdateStoreConfigInput & { resend_api_key?: string }

    // Sanitize whatsapp_number: strip non-digits, must be 10-15 digits if provided
    if (body.whatsapp_number !== undefined && body.whatsapp_number !== null) {
      const digits = body.whatsapp_number.replace(/\D/g, '')
      if (digits.length < 10 || digits.length > 15) {
        return NextResponse.json(
          { error: 'El número de WhatsApp debe tener entre 10 y 15 dígitos (ej. 573001234567)' },
          { status: 400 },
        )
      }
      body.whatsapp_number = digits
    }

    const updated = await updateStoreConfig(body)
    return NextResponse.json({
      ...updated,
      resend_api_key: maskSecret(updated.resend_api_key),
      has_resend_api_key: !!updated.resend_api_key,
    })
  } catch (err) {
    console.error('[admin/config PATCH]', err)
    return NextResponse.json({ error: 'Error guardando configuración' }, { status: 500 })
  }
}
