/**
 * Unit tests — packages/database/src/lib/email.ts
 *
 * Verifica que sendShippingNotification y sendStatusNotification
 * (funciones compartidas entre web y admin) construyen correctamente
 * el payload para la API de Resend.
 */

const mockFetch = jest.fn()
global.fetch = mockFetch

import { sendShippingNotification, sendStatusNotification } from '../email'
import type { EmailConfig } from '../email'

const config: EmailConfig = {
  apiKey:    're_test_shared_key',
  fromEmail: 'pedidos@tienda.com',
  storeName: 'Mi Tienda Test',
  siteUrl:   'https://tienda.com',
}

const baseOrder = {
  order_number:   'ORD-0001',
  customer_email: 'cliente@example.com',
  customer_name:  'María López',
}

beforeEach(() => {
  mockFetch.mockResolvedValue({ ok: true } as Response)
  jest.clearAllMocks()
})

// ─────────────────────────────────────────────
// sendShippingNotification
// ─────────────────────────────────────────────
describe('sendShippingNotification (shared)', () => {
  it('llama a https://api.resend.com/emails con método POST', async () => {
    await sendShippingNotification({ ...baseOrder, tracking_number: 'TRK-001' }, config)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('incluye Authorization header con la API key', async () => {
    await sendShippingNotification({ ...baseOrder, tracking_number: 'TRK-001' }, config)
    const [, options] = mockFetch.mock.calls[0]
    expect((options as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer re_test_shared_key',
    })
  })

  it('el asunto incluye el número de pedido y el nombre de la tienda', async () => {
    await sendShippingNotification({ ...baseOrder, tracking_number: 'TRK-001' }, config)
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.subject).toContain('ORD-0001')
    expect(body.subject).toContain('Mi Tienda Test')
  })

  it('envía al email del cliente', async () => {
    await sendShippingNotification({ ...baseOrder, tracking_number: 'TRK-001' }, config)
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.to).toContain('cliente@example.com')
  })

  it('el from incluye el nombre de la tienda y el fromEmail', async () => {
    await sendShippingNotification({ ...baseOrder, tracking_number: 'TRK-001' }, config)
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.from).toContain('Mi Tienda Test')
    expect(body.from).toContain('pedidos@tienda.com')
  })

  it('el HTML incluye el tracking_number cuando está disponible', async () => {
    await sendShippingNotification(
      { ...baseOrder, tracking_number: 'TRK-ABC-999', carrier_name: 'Servientrega' },
      config,
    )
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.html).toContain('TRK-ABC-999')
    expect(body.html).toContain('Servientrega')
  })

  it('incluye enlace a label_url cuando se provee', async () => {
    await sendShippingNotification(
      { ...baseOrder, tracking_number: 'TRK-X', label_url: 'https://label.pdf' },
      config,
    )
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.html).toContain('https://label.pdf')
  })

  it('funciona sin tracking_number (envío sin guía aún)', async () => {
    await expect(
      sendShippingNotification({ ...baseOrder, tracking_number: null }, config),
    ).resolves.not.toThrow()
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.html).toContain('ORD-0001')
  })

  it('usa "Mi Tienda" como fallback si storeName no está definido', async () => {
    const configSinNombre: EmailConfig = { apiKey: 'k', fromEmail: 'x@x.com' }
    await sendShippingNotification({ ...baseOrder, tracking_number: 'T' }, configSinNombre)
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.from).toContain('Mi Tienda')
  })

  it('lanza error si Resend devuelve status no-OK', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => 'Invalid',
    } as Response)
    await expect(
      sendShippingNotification({ ...baseOrder, tracking_number: 'X' }, config),
    ).rejects.toThrow(/Resend error 422/)
  })
})

// ─────────────────────────────────────────────
// sendStatusNotification
// ─────────────────────────────────────────────
describe('sendStatusNotification (shared)', () => {
  it('genera asunto diferente para "delivered" y "cancelled"', async () => {
    await sendStatusNotification(baseOrder, 'delivered', config)
    const subjectDelivered = JSON.parse(
      (mockFetch.mock.calls[0][1] as RequestInit).body as string,
    ).subject
    mockFetch.mockClear()

    await sendStatusNotification(baseOrder, 'cancelled', config)
    const subjectCancelled = JSON.parse(
      (mockFetch.mock.calls[0][1] as RequestInit).body as string,
    ).subject

    expect(subjectDelivered).not.toBe(subjectCancelled)
    expect(subjectDelivered).toContain('ORD-0001')
    expect(subjectCancelled).toContain('ORD-0001')
  })

  it('el HTML de "delivered" menciona entrega', async () => {
    await sendStatusNotification(baseOrder, 'delivered', config)
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.html.toLowerCase()).toMatch(/entregado|entrega/)
  })

  it('el HTML de "cancelled" menciona cancelación', async () => {
    await sendStatusNotification(baseOrder, 'cancelled', config)
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.html.toLowerCase()).toMatch(/cancelad/)
  })

  it('envía al email del cliente', async () => {
    await sendStatusNotification(baseOrder, 'delivered', config)
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.to).toContain('cliente@example.com')
  })

  it('el remitente incluye el nombre de la tienda', async () => {
    await sendStatusNotification(baseOrder, 'cancelled', config)
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.from).toContain('Mi Tienda Test')
  })

  it('el nombre del cliente aparece en el HTML', async () => {
    await sendStatusNotification(baseOrder, 'delivered', config)
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.html).toContain('María López')
  })

  it('lanza error si Resend devuelve status no-OK', async () => {
    mockFetch.mockResolvedValue({
      ok: false, status: 500, text: async () => 'Server error',
    } as Response)
    await expect(
      sendStatusNotification(baseOrder, 'delivered', config),
    ).rejects.toThrow(/Resend error 500/)
  })
})
