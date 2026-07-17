import { NextRequest, NextResponse } from 'next/server'
import { updateAdminConfig } from '@vps/database'
import { getAdminUser } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const user = await getAdminUser()
  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const { accent_color, sidebar_color } = body as Record<string, string>

  const updated = await updateAdminConfig({
    ...(accent_color && { accent_color }),
    ...(sidebar_color && { sidebar_color }),
  })

  return NextResponse.json(updated)
}
