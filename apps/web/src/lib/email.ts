/**
 * Utilidades de email para apps/web.
 *
 * Las funciones compartidas (sendShippingNotification, sendStatusNotification,
 * EmailConfig) provienen de @vps/database y se re-exportan aquí para que los
 * callers internos no cambien su ruta de importación.
 *
 * Este archivo define únicamente las funciones exclusivas de la tienda web:
 * buildEmailConfig, sendOrderConfirmation, sendNewsletterConfirmation, sendWelcomeEmail.
 */

import type { Order } from '@vps/database'

export type { EmailConfig } from '@vps/database'
export { sendShippingNotification, sendStatusNotification } from '@vps/database'

import type { EmailConfig } from '@vps/database'

// ── sendEmail helper (privado — solo para funciones web-only) ────────────────

const RESEND_API_URL = 'https://api.resend.com/emails'

async function sendEmail(
  config: EmailConfig,
  payload: { from: string; to: string[]; subject: string; html: string },
): Promise<void> {
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

// ── Helpers de plantilla (privados — solo usados en funciones web-only) ──────

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

function baseTemplate(content: string, config: EmailConfig): string {
  const name = config.storeName ?? 'Mi Tienda'
  const url  = (config.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

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

// ── Funciones exclusivas de la tienda web ────────────────────────────────────

/** Construye un EmailConfig con siteUrl desde NEXT_PUBLIC_SITE_URL */
export function buildEmailConfig(
  apiKey: string,
  fromEmail: string,
  storeName?: string | null,
): EmailConfig {
  return {
    apiKey,
    fromEmail,
    storeName: storeName ?? undefined,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  }
}

/** Email de confirmación de pedido — se envía cuando el pago es aprobado */
export async function sendOrderConfirmation(order: Order, config: EmailConfig): Promise<void> {
  const name = config.storeName ?? 'Mi Tienda'
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
    from: `${name} <${config.fromEmail}>`,
    to: [order.customer_email],
    subject: `Pedido confirmado ${order.order_number} — ${name}`,
    html: baseTemplate(content, config),
  })
}

/** Email de confirmación de suscripción al newsletter */
export async function sendNewsletterConfirmation(
  to: string,
  config: EmailConfig,
): Promise<void> {
  const name    = config.storeName ?? 'Mi Tienda'
  const siteUrl = (config.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Ya eres parte de la familia ${name}!</h2>
    <p style="margin: 0 0 16px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Gracias por suscribirte a nuestro boletín. Te mantendremos al tanto de
      novedades, promociones y contenido exclusivo.
    </p>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Mientras tanto, te invitamos a explorar nuestra tienda y descubrir los productos
      que seleccionamos esta temporada.
    </p>
    ${siteUrl ? `
    <div style="text-align: center;">
      <a href="${siteUrl}/tienda" style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;">
        Ver la tienda
      </a>
    </div>` : ''}
    <p style="margin: 24px 0 0; color: #8a6a4a; font-size: 12px; font-family: sans-serif; text-align: center;">
      Si no solicitaste esta suscripción, puedes ignorar este correo.
    </p>`

  await sendEmail(config, {
    from: `${name} <${config.fromEmail}>`,
    to: [to],
    subject: `¡Bienvenido al boletín de ${name}! ☕`,
    html: baseTemplate(content, config),
  })
}

/** Email de bienvenida al registrarse */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  config: EmailConfig,
): Promise<void> {
  const storeName = config.storeName ?? 'Mi Tienda'
  const siteUrl   = (config.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')

  const content = `
    <h2 style="margin: 0 0 8px; color: #614a2a; font-size: 20px; font-family: sans-serif;">¡Bienvenido a ${storeName}, ${name}!</h2>
    <p style="margin: 0 0 24px; color: #8a6a4a; font-size: 14px; font-family: sans-serif;">
      Tu cuenta ha sido creada exitosamente. Ya puedes explorar nuestro catálogo
      y hacer seguimiento de tus pedidos desde tu cuenta.
    </p>
    ${siteUrl ? `
    <div style="text-align: center;">
      <a href="${siteUrl}/tienda" style="display: inline-block; background: #614a2a; color: #fff8ec; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-size: 14px; font-weight: 600; font-family: sans-serif;">
        Explorar la tienda
      </a>
    </div>` : ''}`

  await sendEmail(config, {
    from: `${storeName} <${config.fromEmail}>`,
    to: [to],
    subject: `Bienvenido a ${storeName} — Cuenta creada`,
    html: baseTemplate(content, config),
  })
}
