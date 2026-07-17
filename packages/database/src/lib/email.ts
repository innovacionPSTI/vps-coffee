/**
 * Utilidades de email transaccional compartidas entre apps/web y apps/admin.
 * Usa la API REST de Resend directamente (sin SDK) — sin dependencias externas.
 *
 * Las funciones específicas de cada app (sendOrderConfirmation, sendWelcomeEmail,
 * sendNewsletterConfirmation, buildEmailConfig) permanecen en cada app.
 */

const RESEND_API_URL = 'https://api.resend.com/emails'

export interface EmailConfig {
  apiKey: string
  fromEmail: string
  /** Nombre de la tienda — desde store_config.store_name */
  storeName?: string
  /** URL base del sitio */
  siteUrl?: string
}

interface EmailPayload {
  from: string
  to: string[]
  subject: string
  html: string
}

async function sendEmail(config: EmailConfig, payload: EmailPayload): Promise<void> {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }
}

function baseTemplate(content: string, config: EmailConfig): string {
  const name = config.storeName ?? 'Mi Tienda'
  const url  = (config.siteUrl ?? '').replace(/\/$/, '')

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
              <h1 style="margin: 0; color: #fff8ec; font-size: 24px; letter-spacing: 0.1em;">${name}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">${content}</td>
          </tr>
          <tr>
            <td style="background: #fff0d1; padding: 16px 32px; text-align: center; border-top: 1px solid #f0e8d0;">
              <p style="margin: 0; font-size: 12px; color: #8a6a4a; font-family: sans-serif;">
                ${name}${url ? ` · <a href="${url}" style="color: #614a2a;">${url.replace(/^https?:\/\//, '')}</a>` : ''}
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

/** Notificación al cliente cuando el pedido cambia a "shipped" */
export async function sendShippingNotification(
  order: {
    order_number: string
    customer_email: string
    customer_name: string
    tracking_number?: string | null
    carrier_name?: string | null
    label_url?: string | null
  },
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'

  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Tu pedido está en camino!</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Tu pedido <strong>${order.order_number}</strong> ha sido despachado.
    </p>
    ${order.tracking_number ? `
    <div style="background: #fff8ec; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 4px; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">Número de tracking</p>
      <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #614a2a; letter-spacing: 0.05em; font-family: monospace;">${order.tracking_number}</p>
      ${order.carrier_name ? `<p style="margin: 0; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">Transportadora: <strong>${order.carrier_name}</strong></p>` : ''}
    </div>
    ${order.label_url ? `
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${order.label_url}" style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;">
        Descargar guía de envío
      </a>
    </div>` : ''}` : ''}
    <p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      Pedido: <strong>${order.order_number}</strong> · ${order.customer_name}
    </p>`

  await sendEmail(config, {
    from: `${name} <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: `Tu pedido ${order.order_number} ha sido despachado — ${name}`,
    html: baseTemplate(content, config),
  })
}

/** Notificación genérica de cambio de estado — para "delivered" y "cancelled" */
export async function sendStatusNotification(
  order: {
    order_number: string
    customer_email: string
    customer_name: string
  },
  status: 'delivered' | 'cancelled',
  config: EmailConfig,
): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'

  const isDelivered = status === 'delivered'
  const heading = isDelivered ? '¡Tu pedido fue entregado!' : 'Tu pedido ha sido cancelado'
  const body = isDelivered
    ? `Tu pedido <strong>${order.order_number}</strong> fue marcado como entregado. Esperamos que disfrutes tu compra.`
    : `Tu pedido <strong>${order.order_number}</strong> ha sido cancelado. Si tienes dudas, contáctanos.`

  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">${heading}</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">${body}</p>
    <p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      Pedido: <strong>${order.order_number}</strong> · ${order.customer_name}
    </p>`

  const subjects: Record<typeof status, string> = {
    delivered: `Pedido ${order.order_number} entregado — ${name}`,
    cancelled:  `Pedido ${order.order_number} cancelado — ${name}`,
  }

  await sendEmail(config, {
    from: `${name} <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: subjects[status],
    html: baseTemplate(content, config),
  })
}
