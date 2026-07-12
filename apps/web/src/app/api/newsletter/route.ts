import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getStoreConfig } from '@vps/database'
import { sendNewsletterConfirmation, buildEmailConfig } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !String(email).includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if already subscribed to avoid duplicate confirmation emails
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('active')
      .eq('email', email)
      .maybeSingle()

    const wasAlreadyActive = existing?.active === true

    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({ email, active: true }, { onConflict: 'email' })

    if (error) throw error

    // Send confirmation email only on first subscription
    if (!wasAlreadyActive) {
      try {
        const storeConfig = await getStoreConfig()
        if (storeConfig?.resend_api_key && storeConfig?.resend_from_email) {
          await sendNewsletterConfirmation(
            email,
            buildEmailConfig(storeConfig.resend_api_key, storeConfig.resend_from_email, storeConfig.store_name),
          )
        }
      } catch (emailErr) {
        // Non-critical — subscription saved regardless of email failure
        console.error('[newsletter] Error enviando confirmación:', emailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[newsletter]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
