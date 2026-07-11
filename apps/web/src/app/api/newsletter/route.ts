import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@vps/database'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const supabase = createServerClient()
    const { error } = await supabase
      .from('newsletter_subscribers')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ email, active: true } as any, { onConflict: 'email' })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
