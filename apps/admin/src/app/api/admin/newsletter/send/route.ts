import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'
import { createServerClient } from '@vps/database'

const RESEND_API_URL = 'https://api.resend.com/emails'

function baseTemplate(content: string, storeName: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #fff8ec;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; max-width: 600px;">
          <tr>
            <td style="background: #614a2a; padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #fff8ec; font-size: 24px; letter-spacing: 0.1em;">${storeName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; font-family: sans-serif; font-size: 15px; color: #3d2a1a; line-height: 1.7;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background: #fff0d1; padding: 16px 32px; text-align: center; border-top: 1px solid #f0e8d0;">
              <p style="margin: 0; font-size: 12px; color: #8a6a4a; font-family: sans-serif;">
                ${storeName} · Medellín, Colombia<br/>
                <a href="https://vpscoffee.com" style="color: #614a2a;">vpscoffee.com</a>
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #b08a5a; font-family: sans-serif;">
                Recibiste este correo porque te suscribiste al boletín de ${storeName}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Convierte Markdown básico a HTML para el cuerpo del email */
function markdownToEmailHtml(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 style="margin: 20px 0 8px; color: #614a2a; font-size: 16px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin: 24px 0 10px; color: #614a2a; font-size: 18px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin: 0 0 16px; color: #614a2a; font-size: 22px;">$1</h1>')
    .replace(/^[-*] (.+)$/gm, '<li style="margin: 4px 0;">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="padding-left: 20px; margin: 12px 0;">${m}</ul>`)
    .replace(/\n\n/g, '</p><p style="margin: 0 0 12px;">')
    .replace(/^(?!<[hul])/gm, '')
    .trim()
}

async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  if (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'gestor_tienda') {
    return { user: null, error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) }
  }
  return { user, error: null }
}

/**
 * POST /api/admin/newsletter/send
 * Body: { subject: string, body: string }
 * Sends broadcast email to all active subscribers via Resend.
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { subject, body: emailBody } = body as { subject?: string; body?: string }

  if (!subject?.trim()) {
    return NextResponse.json({ error: 'El asunto es requerido' }, { status: 400 })
  }
  if (!emailBody?.trim()) {
    return NextResponse.json({ error: 'El cuerpo del correo es requerido' }, { status: 400 })
  }

  // Fetch store config for API key, fromEmail and store name
  const supabase = createServerClient()
  const { data: config } = await supabase
    .from('store_config')
    .select('resend_api_key, resend_from_email, store_name')
    .single()

  if (!config?.resend_api_key || !config?.resend_from_email) {
    return NextResponse.json(
      { error: 'Resend no está configurado. Ve a Configuración → Emails.' },
      { status: 422 },
    )
  }

  // Fetch active subscribers
  const { data: subscribers, error: dbError } = await supabase
    .from('newsletter_subscribers')
    .select('email')
    .eq('active', true)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  if (!subscribers?.length) {
    return NextResponse.json({ error: 'No hay suscriptores activos' }, { status: 422 })
  }

  const storeName = config.store_name ?? 'VPS Coffee'
  const htmlContent = markdownToEmailHtml(emailBody)
  const html = baseTemplate(htmlContent, storeName)
  const emails = subscribers.map((s) => s.email)

  // Send in batches of 50 (Resend free tier limit per request)
  const BATCH_SIZE = 50
  const batches: string[][] = []
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    batches.push(emails.slice(i, i + BATCH_SIZE))
  }

  let sent = 0
  let failed = 0

  for (const batch of batches) {
    try {
      const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.resend_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${storeName} <${config.resend_from_email}>`,
          to: batch,
          subject,
          html,
        }),
      })

      if (res.ok) {
        sent += batch.length
      } else {
        failed += batch.length
      }
    } catch {
      failed += batch.length
    }
  }

  return NextResponse.json({
    ok: true,
    total: emails.length,
    sent,
    failed,
  })
}
