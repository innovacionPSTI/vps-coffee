import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { createServerClient } from '@vps/database'

async function getCustomerId(
  supabase: ReturnType<typeof createServerClient>,
  stackUserId: string,
  email: string,
) {
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('stack_id', stackUserId)
    .maybeSingle()
  if (data?.id) return data.id
  const { data: byEmail } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  return byEmail?.id ?? null
}

/** PATCH /api/account/addresses/[id] — editar una dirección guardada */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    let user = null
    try { user = await stackServerApp.getUser() } catch {}
    if (!user?.primaryEmail)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as {
      label?: string
      full_name?: string
      phone?: string
      address?: string
      city?: string
      department?: string
      postal_code?: string
      is_default?: boolean
    }

    const supabase = createServerClient()
    const customerId = await getCustomerId(supabase, user.id, user.primaryEmail)
    if (!customerId)
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

    // Verify address belongs to this customer
    const { data: existing } = await supabase
      .from('customer_addresses')
      .select('id')
      .eq('id', id)
      .eq('customer_id', customerId)
      .maybeSingle()

    if (!existing)
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 })

    // If setting as default, clear other defaults first
    if (body.is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId)
        .eq('is_default', true)
    }

    const { data: updated, error } = await supabase
      .from('customer_addresses')
      .update({
        ...(body.label !== undefined     ? { label: body.label || null }             : {}),
        ...(body.full_name               ? { full_name: body.full_name }              : {}),
        ...(body.phone !== undefined     ? { phone: body.phone || null }             : {}),
        ...(body.address                 ? { address: body.address }                 : {}),
        ...(body.city                    ? { city: body.city }                       : {}),
        ...(body.department !== undefined ? { department: body.department || null }  : {}),
        ...(body.postal_code !== undefined ? { postal_code: body.postal_code || null } : {}),
        ...(body.is_default !== undefined ? { is_default: body.is_default }          : {}),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ address: updated })
  } catch (err) {
    console.error('[account/addresses PATCH]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

/** DELETE /api/account/addresses/[id] — eliminar una dirección guardada */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    let user = null
    try { user = await stackServerApp.getUser() } catch {}
    if (!user?.primaryEmail)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServerClient()
    const customerId = await getCustomerId(supabase, user.id, user.primaryEmail)
    if (!customerId)
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', id)
      .eq('customer_id', customerId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[account/addresses DELETE]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
