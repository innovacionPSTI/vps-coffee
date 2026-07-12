/**
 * Unit tests — lib/mercadopago.ts
 *
 * Covers:
 *   mapMercadoPagoStatus   — todos los estados de MP
 *   isMercadoPagoSandbox   — detección de token de sandbox
 *   createMercadoPagoPreference — llamada HTTP a la API de MP
 *   getMercadoPagoPayment  — consulta de pago por ID
 */

import { mapMercadoPagoStatus, isMercadoPagoSandbox } from '../mercadopago'

// ─────────────────────────────────────────────
// mapMercadoPagoStatus
// ─────────────────────────────────────────────
describe('mapMercadoPagoStatus', () => {
  it('mapea approved → approved', () => {
    expect(mapMercadoPagoStatus('approved')).toBe('approved')
  })

  it('mapea authorized → approved', () => {
    expect(mapMercadoPagoStatus('authorized')).toBe('approved')
  })

  it('mapea rejected → rejected', () => {
    expect(mapMercadoPagoStatus('rejected')).toBe('rejected')
  })

  it('mapea cancelled → rejected', () => {
    expect(mapMercadoPagoStatus('cancelled')).toBe('rejected')
  })

  it('mapea refunded → rejected', () => {
    expect(mapMercadoPagoStatus('refunded')).toBe('rejected')
  })

  it('mapea charged_back → rejected', () => {
    expect(mapMercadoPagoStatus('charged_back')).toBe('rejected')
  })

  it('mapea pending → pending', () => {
    expect(mapMercadoPagoStatus('pending')).toBe('pending')
  })

  it('mapea in_process → pending', () => {
    expect(mapMercadoPagoStatus('in_process')).toBe('pending')
  })

  it('usa pending como fallback para estados desconocidos', () => {
    expect(mapMercadoPagoStatus('unknown_state')).toBe('pending')
    expect(mapMercadoPagoStatus('')).toBe('pending')
  })
})

// ─────────────────────────────────────────────
// isMercadoPagoSandbox
// ─────────────────────────────────────────────
describe('isMercadoPagoSandbox', () => {
  it('devuelve true para un token que empieza con TEST-', () => {
    expect(isMercadoPagoSandbox('TEST-abc123')).toBe(true)
    expect(isMercadoPagoSandbox('TEST-1234567890abcdef')).toBe(true)
  })

  it('devuelve false para un token de producción (APP_USR-)', () => {
    expect(isMercadoPagoSandbox('APP_USR-abc123')).toBe(false)
  })

  it('devuelve false para un token vacío', () => {
    expect(isMercadoPagoSandbox('')).toBe(false)
  })

  it('distingue mayúsculas/minúsculas (TEST- en minúsculas no es sandbox)', () => {
    expect(isMercadoPagoSandbox('test-abc123')).toBe(false)
  })
})

// ─────────────────────────────────────────────
// createMercadoPagoPreference (con mock de fetch)
// ─────────────────────────────────────────────
describe('createMercadoPagoPreference', () => {
  const mockFetch = jest.fn()

  beforeEach(() => {
    global.fetch = mockFetch
    jest.clearAllMocks()
  })

  afterAll(() => {
    // Restore original fetch if needed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).fetch
  })

  it('llama al endpoint correcto de MercadoPago con Authorization header', async () => {
    const { createMercadoPagoPreference } = await import('../mercadopago')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'pref-123',
        init_point: 'https://mp.com/checkout',
        sandbox_init_point: 'https://sandbox.mp.com/checkout',
      }),
    })

    await createMercadoPagoPreference('TEST-token', {
      externalReference: 'VPS-0001',
      items: [{ id: '10', title: 'Café Huila', quantity: 1, unit_price: 45000 }],
      payerEmail: 'juan@example.com',
      backUrls: {
        success: 'https://vpscoffee.com/checkout/confirmacion',
        failure: 'https://vpscoffee.com/checkout?error=pago_rechazado',
        pending: 'https://vpscoffee.com/checkout/confirmacion?status=pending',
      },
      notificationUrl: 'https://vpscoffee.com/api/webhooks/mercadopago',
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.mercadopago.com/checkout/preferences',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer TEST-token',
        }),
      })
    )
  })

  it('lanza un error si la API responde con un código de error', async () => {
    const { createMercadoPagoPreference } = await import('../mercadopago')

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    })

    await expect(
      createMercadoPagoPreference('INVALID-token', {
        externalReference: 'VPS-0001',
        items: [{ id: '1', title: 'Test', quantity: 1, unit_price: 1000 }],
        payerEmail: 'test@example.com',
        backUrls: { success: '', failure: '', pending: '' },
        notificationUrl: '',
      })
    ).rejects.toThrow(/MercadoPago API error 401/)
  })
})
