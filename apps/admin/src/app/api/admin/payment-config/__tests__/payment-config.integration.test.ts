/**
 * Integration tests — GET + PATCH /api/admin/payment-config
 *
 * Escenarios cubiertos:
 *   GET  → sin config en BD: devuelve estructura vacía con has_* = false
 *   GET  → con config: devuelve secrets enmascarados (••••last4) + flags has_*
 *   GET  → wompi_public_key no se enmascara (es público)
 *   PATCH → valida prefijo pub_ en wompi_public_key
 *   PATCH → secrets vacíos no sobreescriben existentes (delegado a updatePaymentConfig)
 *   PATCH → actualiza wompi_active y mercadopago_active
 *   PATCH → devuelve respuesta enmascarada igual que el GET
 *   PATCH → error de BD → 500
 *   GET  → error de BD → 500
 *
 * Mocks: @vps/database (getPaymentConfig, updatePaymentConfig)
 */

import { NextRequest } from 'next/server'

jest.mock('@vps/database', () => ({
  getPaymentConfig: jest.fn(),
  updatePaymentConfig: jest.fn(),
}))

import { getPaymentConfig, updatePaymentConfig } from '@vps/database'
import { GET, PATCH } from '../route'

const mockGet = getPaymentConfig as jest.MockedFunction<typeof getPaymentConfig>
const mockUpdate = updatePaymentConfig as jest.MockedFunction<typeof updatePaymentConfig>

// ── Fixtures ──────────────────────────────────
const fullConfig = {
  id: 1,
  wompi_public_key: 'pub_test_abc123',
  wompi_private_key: 'prv_test_abc1234',      // last 4: 1234
  wompi_integrity_secret: 'test_int_secret56', // last 4: et56
  wompi_events_secret: 'test_events_secret78', // last 4: et78
  wompi_active: true,
  mercadopago_access_token: 'TEST-mp-token-99', // last 4: t-99
  mercadopago_public_key: 'TEST-pub-mp-key',
  mercadopago_active: false,
  updated_at: new Date().toISOString(),
}

function makePatchRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/admin/payment-config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────
describe('GET /api/admin/payment-config', () => {
  it('devuelve estructura vacía con has_* = false cuando no hay config en BD', async () => {
    mockGet.mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()

    expect(data.wompi_public_key).toBeNull()
    expect(data.wompi_active).toBe(false)
    expect(data.has_wompi_private_key).toBe(false)
    expect(data.has_wompi_integrity_secret).toBe(false)
    expect(data.has_wompi_events_secret).toBe(false)
    expect(data.has_mercadopago_access_token).toBe(false)
  })

  it('enmascara wompi_private_key con ••••last4', async () => {
    mockGet.mockResolvedValueOnce(fullConfig as never)
    const res = await GET()
    const data = await res.json()

    // La clave privada tiene "1234" al final → debe aparecer ••••1234
    expect(data.wompi_private_key).toBe('••••1234')
  })

  it('enmascara wompi_integrity_secret correctamente', async () => {
    mockGet.mockResolvedValueOnce(fullConfig as never)
    const res = await GET()
    const data = await res.json()

    expect(data.wompi_integrity_secret).toMatch(/^••••/)
    expect(data.wompi_integrity_secret).not.toBe(fullConfig.wompi_integrity_secret)
  })

  it('devuelve wompi_public_key en texto plano (es una clave pública)', async () => {
    mockGet.mockResolvedValueOnce(fullConfig as never)
    const res = await GET()
    const data = await res.json()

    expect(data.wompi_public_key).toBe('pub_test_abc123')
  })

  it('devuelve has_wompi_private_key = true cuando existe', async () => {
    mockGet.mockResolvedValueOnce(fullConfig as never)
    const res = await GET()
    const data = await res.json()

    expect(data.has_wompi_private_key).toBe(true)
    expect(data.has_wompi_integrity_secret).toBe(true)
    expect(data.has_wompi_events_secret).toBe(true)
    expect(data.has_mercadopago_access_token).toBe(true)
  })

  it('devuelve has_* = false cuando los secrets son null', async () => {
    mockGet.mockResolvedValueOnce({
      ...fullConfig,
      wompi_private_key: null,
      wompi_integrity_secret: null,
      wompi_events_secret: null,
      mercadopago_access_token: null,
    } as never)
    const res = await GET()
    const data = await res.json()

    expect(data.has_wompi_private_key).toBe(false)
    expect(data.has_wompi_integrity_secret).toBe(false)
    expect(data.has_wompi_events_secret).toBe(false)
    expect(data.has_mercadopago_access_token).toBe(false)
  })

  it('retorna 500 si getPaymentConfig lanza', async () => {
    mockGet.mockRejectedValueOnce(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// ─────────────────────────────────────────────
// PATCH
// ─────────────────────────────────────────────
describe('PATCH /api/admin/payment-config — validación', () => {
  it('retorna 400 si wompi_public_key no empieza con pub_', async () => {
    const req = makePatchRequest({ wompi_public_key: 'prv_test_xxx' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/pub_/)
  })

  it('acepta wompi_public_key que empieza con pub_test_', async () => {
    mockUpdate.mockResolvedValueOnce(fullConfig as never)
    const req = makePatchRequest({ wompi_public_key: 'pub_test_newkey' })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
  })

  it('acepta wompi_public_key que empieza con pub_prod_', async () => {
    mockUpdate.mockResolvedValueOnce({ ...fullConfig, wompi_public_key: 'pub_prod_xxx' } as never)
    const req = makePatchRequest({ wompi_public_key: 'pub_prod_xxx' })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/admin/payment-config — happy path', () => {
  it('actualiza wompi_active y mercadopago_active', async () => {
    mockUpdate.mockResolvedValueOnce({ ...fullConfig, wompi_active: false } as never)
    const req = makePatchRequest({ wompi_active: false, mercadopago_active: false })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ wompi_active: false, mercadopago_active: false })
    )
  })

  it('la respuesta PATCH también enmascara los secrets', async () => {
    mockUpdate.mockResolvedValueOnce(fullConfig as never)
    const req = makePatchRequest({ wompi_active: true })
    const res = await PATCH(req)
    const data = await res.json()

    expect(data.wompi_private_key).toMatch(/^••••/)
    expect(data.wompi_private_key).not.toBe(fullConfig.wompi_private_key)
    expect(data.has_wompi_private_key).toBe(true)
  })

  it('retorna 500 si updatePaymentConfig lanza', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB error'))
    const req = makePatchRequest({ wompi_active: true })
    const res = await PATCH(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })
})
