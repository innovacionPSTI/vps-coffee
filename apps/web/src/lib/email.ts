import type { Order } from '@vps/database'

const RESEND_API_URL = 'https://api.resend.com/emails'

export interface EmailConfig {
  apiKey: string
  fromEmail: string
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

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount)
}

function orderItemsTable(order: Order): string {
  const rows = order.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #f0e8d0;">
      <td style="padding: 10px 0; font-family: sans-serif; font-size: 14px; color: #3d2a1a;">
        <strong>${item.product_name}</strong><br/>
        <span style="color: #8a6a4a; font-size: 12px;">${item.variant_label}</span>
      </td>
      <td style="padding: 10px 0; text-align: center; font-family: sans-serif; font-size: 14px; color: #3d2a1a;">${item.qty}</td>
      <td style="padding: 10px 0; text-align: right; font-family: sans-serif; font-size: 14px; color: #3d2a1a;">${formatCOP(item.price * item.qty)}</td>
    </tr>`,
    )
    .join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr style="background: #fff8ec;">
          <th style="text-align: left; padding: 8px 0; font-family: sans-serif; font-size: 12px; color: #8a6a4a; text-transform: uppercase; letter-spacing: 0.05em;">Producto</th>
          <th style="text-align: center; padding: 8px 0; font-family: sans-serif; font-size: 12px; color: #8a6a4a; text-transform: uppercase; letter-spacing: 0.05em;">Cant.</th>
          <th style="text-align: right; padding: 8px 0; font-family: sans-serif; font-size: 12px; color: #8a6a4a; text-transform: uppercase; letter-spacing: 0.05em;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

function baseTemplate(content: string): string {
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
              <h1 style="margin: 0; color: #fff8ec; font-size: 24px; letter-spacing: 0.1em;">VPS Coffee</h1>
              <p style="margin: 4px 0 0; color: #c9a97e; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Roasting House</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">${content}</td>
          </tr>
          <tr>
            <td style="background: #fff0d1; padding: 16px 32px; text-align: center; border-top: 1px solid #f0e8d0;">
              <p style="margin: 0; font-size: 12px; color: #8a6a4a; font-family: sans-serif;">
                VPS Coffee Roasting House · Medellín, Colombia<br/>
                <a href="https://vpscoffee.com" style="color: #614a2a;">vpscoffee.com</a>
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

/** Email de confirmación de pedido — se envía cuando el pago es aprobado */
export async function sendOrderConfirmation(order: Order, config: EmailConfig): Promise<void> {
  const addr = order.shipping_addr
  const addressText = `${addr.address}, ${addr.city}, ${addr.department}`

  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Gracias por tu pedido!</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Tu pago fue confirmado y tu pedido está siendo preparado con mucho cariño.
    </p>
    <div style="background: #fff8ec; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">Número de pedido</p>
      <p style="margin: 4px 0 0; font-size: 22px; font-weight: 700; color: #614a2a; letter-spacing: 0.05em; font-family: sans-serif;">${order.order_number}</p>
    </div>
    ${orderItemsTable(order)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="font-size: 13px; color: #8a6a4a; padding: 4px 0; font-family: sans-serif;">Subtotal</td>
        <td style="text-align: right; font-size: 13px; color: #3d2a1a; padding: 4px 0; font-family: sans-serif;">${formatCOP(order.subtotal)}</td>
      </tr>
      <tr>
        <td style="font-size: 13px; color: #8a6a4a; padding: 4px 0; font-family: sans-serif;">Envío</td>
        <td style="text-align: right; font-size: 13px; color: #3d2a1a; padding: 4px 0; font-family: sans-serif;">${order.shipping_cost === 0 ? 'Gratis' : formatCOP(order.shipping_cost)}</td>
      </tr>
      <tr style="border-top: 2px solid #f0e8d0;">
        <td style="font-size: 16px; font-weight: 700; color: #614a2a; padding: 10px 0 0; font-family: sans-serif;">Total</td>
        <td style="text-align: right; font-size: 16px; font-weight: 700; color: #614a2a; padding: 10px 0 0; font-family: sans-serif;">${formatCOP(order.total)}</td>
      </tr>
    </table>
    <div style="background: #fff0d1; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #614a2a; font-family: sans-serif;">Dirección de envío</p>
      <p style="margin: 0; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">${order.customer_name}<br/>${addressText}</p>
    </div>
    <p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      Te notificaremos cuando tu pedido sea despachado con el número de tracking.
    </p>`

  await sendEmail(config, {
    from: `VPS Coffee <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: `Pedido confirmado ${order.order_number} — VPS Coffee`,
    html: baseTemplate(content),
  })
}

/** Email con número de tracking cuando el pedido es despachado */
export async function sendShippingNotification(
  order: Order & { tracking_number: string; carrier_name: string | null; label_url?: string | null },
  config: EmailConfig,
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Tu pedido está en camino!</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Tu café ${order.order_number} ha sido despachado.
    </p>
    <div style="background: #fff8ec; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0 0 4px; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">Número de tracking</p>
      <p style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #614a2a; letter-spacing: 0.05em; font-family: monospace;">${order.tracking_number}</p>
      ${order.carrier_name ? `<p style="margin: 0; font-size: 13px; color: #8a6a4a; font-family: sans-serif;">Transportadora: <strong>${order.carrier_name}</strong></p>` : ''}
    </div>
    ${
      order.label_url
        ? `<div style="text-align: center; margin-bottom: 24px;">
        <a href="${order.label_url}" style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;">
          Descargar guía de envío
        </a>
      </div>`
        : ''
    }
    <p style="margin: 0; font-size: 13px; color: #8a6a4a; text-align: center; font-family: sans-serif;">
      Pedido: <strong>${order.order_number}</strong> · ${order.customer_name}
    </p>`

  await sendEmail(config, {
    from: `VPS Coffee <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: `Tu pedido ${order.order_number} ha sido despachado — VPS Coffee`,
    html: baseTemplate(content),
  })
}

/** Email de confirmación de suscripción al newsletter */
export async function sendNewsletterConfirmation(
  to: string,
  config: EmailConfig,
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vpscoffee.com'
  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Ya eres parte de la familia VPS Coffee!</h2>
    <p style="margin: 0 0 16px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Gracias por suscribirte a nuestro boletín. Te mantendremos al tanto de nuevos
      orígenes, temporadas de cosecha y contenido exclusivo sobre café de especialidad.
    </p>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Mientras tanto, te invitamos a explorar nuestra tienda y descubrir los cafés
      que seleccionamos esta temporada.
    </p>
    <div style="text-align: center;">
      <a href="${siteUrl}/tienda" style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;">
        Ver la tienda
      </a>
    </div>
    <p style="margin: 24px 0 0; color: #8a6a4a; font-size: 12px; font-family: sans-serif; text-align: center;">
      Si no solicitaste esta suscripción, puedes ignorar este correo.
    </p>`

  await sendEmail(config, {
    from: `VPS Coffee <${config.fromEmail}>`,
    to: [to],
    subject: '¡Bienvenido al boletín de VPS Coffee! ☕',
    html: baseTemplate(content),
  })
}

/** Email de bienvenida al registrarse */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  config: EmailConfig,
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Bienvenido a VPS Coffee, ${name}!</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Tu cuenta ha sido creada exitosamente. Ya puedes explorar nuestro catálogo
      y hacer seguimiento de tus pedidos desde tu cuenta.
    </p>
    <div style="text-align: center;">
      <a href="https://vpscoffee.com/tienda" style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;">
        Explorar la tienda
      </a>
    </div>`

  await sendEmail(config, {
    from: `VPS Coffee <${config.fromEmail}>`,
    to: [to],
    subject: 'Bienvenido a VPS Coffee — Cuenta creada',
    html: baseTemplate(content),
  })
}
