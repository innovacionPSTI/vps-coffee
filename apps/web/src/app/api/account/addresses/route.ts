import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { createServerClient } from '@vps/database'

/**
 * GET /api/account/addresses
 * Devuelve las direcciones guardadas del cliente logueado.
 * Usada por el checkout para pre-llenar el formulario de envío.
 *
 * POST /api/account/addresses
 * Guarda una nueva dirección para el cliente logueado.
 * Body: { label?, full_name, phone?, address, city, department?, postal_code?, is_default? }
 */

async function getCustomerId(supabase: ReturnType<typeof createServerClient>, stackUserId: string, email: string) {
  // Buscar por stack_id primero; si no existe, buscar por email (guest que creó cuenta)
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('stack_id', stackUserId)
    .maybeSingle()

  if (data?.id) return data.id

  // Fallback: buscar por email (por si el upsert en /welcome no se ejecutó aún)
  const { data: byEmail } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  return byEmail?.id ?? null
}

export async function GET() {
  try {
    const user = await stackServerApp.getUser()
    if (!user?.primaryEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient()
    const customerId = await getCustomerId(supabase, user.id, user.primaryEmail)
    if (!customerId) {
      return NextResponse.json({ addresses: [] })
    }

    const { data: addresses, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ addresses: addresses ?? [] })
  } catch (err) {
    console.error('[account/addresses GET]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user?.primaryEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      label?: string
      full_name: string
      phone?: string
      address: string
      city: string
      department?: string
      postal_code?: string
      is_default?: boolean
    }

    if (!body.full_name || !body.address || !body.city) {
      return NextResponse.json(
        { error: 'full_name, address y city son requeridos' },
        { status: 400 },
      )
    }

    const supabase = createServerClient()
    const customerId = await getCustomerId(supabase, user.id, user.primaryEmail)
    if (!customerId) {
      return NextResponse.json(
        { error: 'Cliente no encontrado. Intenta recargar la página.' },
        { status: 404 },
      )
    }

    // Si la nueva dirección es default, quitar el default anterior
    if (body.is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId)
        .eq('is_default', true)
    }

    const { data: address, error } = await supabase
      .from('customer_addresses')
      .insert({
        customer_id: customerId,
        label: body.label ?? null,
        full_name: body.full_name,
        phone: body.phone ?? null,
        address: body.address,
        city: body.city,
        department: body.department ?? null,
        postal_code: body.postal_code ?? null,
        is_default: body.is_default ?? false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ address })
  } catch (err) {
    console.error('[account/addresses POST]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
