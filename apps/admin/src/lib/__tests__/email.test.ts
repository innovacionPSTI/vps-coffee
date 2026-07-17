/**
 * Unit tests — apps/admin/src/lib/email.ts
 *
 * Verifica que sendShippingNotification y sendStatusNotification
 * construyen correctamente el payload para la API de Resend.
 */

// Mock global fetch antes de importar el módulo
const mockFetch = jest.fn()
global.fetch = mockFetch

import { sendShippingNotification, sendStatusNotification } from '../email'

const config = {
  apiKey:    're_test_key',
  fromEmail: 'pedidos@vpscoffee.com',
  storeName: 'VPS Coffee',
}

const baseOrder = {
  order_number:   'VPS-0042',
  customer_email: 'cliente@example.com',
  customer_name:  'Ana García',
}

beforeEach(() => {
  mockFetch.mockResolvedValue({ ok: true } as Response)
  jest.clearAllMocks()
})

// ─────────────────────────────────────────────
// sendShippingNotification
// ─────────────────────────────────────────────
describe('sendShippingNotification', () => {
  it('llama a la API de Resend con los headers correctos', async () => {
    await sendShippingNotification({ ...baseOrder, tracking_number: 'TRK123' }, config)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_test_key',
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('el asunto menciona el número de pedido', async () => {
    await sendShippingNotification({ ...baseOrder, tracking_number: 'TRK123' }, config)

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.subject).toContain('VPS-0042')
  })

  it('el destinatario es el email del cliente', async () => {
    await sendShippingNotification({ ...baseOrder, tracking_number: 'TRK123' }, config)

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.to).toContain('cliente@example.com')
  })

  it('incluye el tracking_number en el HTML cuando está disponible', async () => {
    await sendShippingNotification(
      { ...baseOrder, tracking_number: 'TRK-ABC-999', carrier_name: 'Servientrega' },
      config,
    )

    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.html).toContain('TRK-ABC-999')
    expect(body.html).toContain('Servientrega')
  })

  it('funciona sin tracking_number (envío sin guía)', async () => {
    await expect(
      sendShippingNotification({ ...baseOrder, tracking_number: null }, config),
    ).resolves.not.toThrow()
  })

  it('lanza error si Resend devuelve status no-OK', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 422, text: async () => 'Invalid payload' } as Response)

    await expect(
      sendShippingNotification({ ...baseOrder, tracking_number: 'X' }, config),
    ).rejects.toThrow(/Resend error 422/)
  })
})

// ─────────────────────────────────────────────
// sendStatusNotification
// ─────────────────────────────────────────────
describe('sendStatusNotification', () => {
  it('usa asunto diferente para "delivered" y "cancelled"', async () => {
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
    expect(subjectDelivered).toContain('VPS-0042')
    expect(subjectCancelled).toContain('VPS-0042')
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

  it('envía al email correcto del cliente', async () => {
    await sendStatusNotification(baseOrder, 'delivered', config)
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.to).toContain('cliente@example.com')
  })

  it('usa el storeName en el remitente', async () => {
    await sendStatusNotification(baseOrder, 'delivered', config)
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string)
    expect(body.from).toContain('VPS Coffee')
  })
})
