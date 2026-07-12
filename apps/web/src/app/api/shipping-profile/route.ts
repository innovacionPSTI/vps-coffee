import { NextRequest, NextResponse } from 'next/server'
import { stackServerApp } from '@/stack'
import { getShippingProfile, upsertShippingProfile } from '@vps/database'

export async function GET() {
  let user = null
  try { user = await stackServerApp.getUser() } catch { /* no session */ }
  if (!user?.primaryEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getShippingProfile(user.primaryEmail).catch(() => null)
  return NextResponse.json(profile ?? null)
}

export async function PUT(request: NextRequest) {
  let user = null
  try { user = await stackServerApp.getUser() } catch { /* no session */ }
  if (!user?.primaryEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const profile = await upsertShippingProfile({
    email: user.primaryEmail,
    first_name: body.first_name ?? null,
    last_name: body.last_name ?? null,
    phone: body.phone ?? null,
    address: body.address ?? null,
    city: body.city ?? null,
    department: body.department ?? null,
    postal_code: body.postal_code ?? null,
  })

  return NextResponse.json(profile)
}
