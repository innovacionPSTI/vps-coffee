/**
 * Integration tests — GET + PATCH /api/admin/config
 *
 * Tests:
 *   GET  → devuelve store_config completo
 *   PATCH → valida whatsapp_number, normaliza dígitos, guarda logo_url
 *   PATCH → errores de validación y errores de BD
 */

import { NextRequest } from 'next/server'

jest.mock('@vps/database', () => ({
  getStoreConfig: jest.fn(),
  updateStoreConfig: jest.fn(),
}))

import { getStoreConfig, updateStoreConfig } from '@vps/database'
import { GET, PATCH } from '../route'

const mockGet = getStoreConfig as jest.MockedFunction<typeof getStoreConfig>
const mockUpdate = updateStoreConfig as jest.MockedFunction<typeof updateStoreConfig>

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
const baseConfig = {
  id: 1,
  whatsapp_number: '573001234567',
  store_name: 'VPS Coffee',
  store_email: null,
  logo_url: null,
  updated_at: new Date().toISOString(),
}

function makePatchRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/admin/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────
describe('GET /api/admin/config', () => {
  it('devuelve la configuración actual', async () => {
    mockGet.mockResolvedValueOnce(baseConfig)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.store_name).toBe('VPS Coffee')
    expect(data.whatsapp_number).toBe('573001234567')
  })

  it('retorna 500 si getStoreConfig lanza', async () => {
    mockGet.mockRejectedValueOnce(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })
})

// ─────────────────────────────────────────────
// PATCH — validación
// ─────────────────────────────────────────────
describe('PATCH /api/admin/config — validación', () => {
  it('retorna 400 si whatsapp_number tiene menos de 10 dígitos', async () => {
    const req = makePatchRequest({ whatsapp_number: '12345' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/10.*15|dígitos/i)
  })

  it('retorna 400 si whatsapp_number tiene más de 15 dígitos', async () => {
    const req = makePatchRequest({ whatsapp_number: '1234567890123456' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  it('elimina caracteres no numéricos del número de WhatsApp', async () => {
    const updated = { ...baseConfig, whatsapp_number: '573001234567' }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ whatsapp_number: '+57 (300) 123-4567' })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ whatsapp_number: '573001234567' })
    )
  })

  it('permite null para whatsapp_number (borrar el número)', async () => {
    mockUpdate.mockResolvedValueOnce({ ...baseConfig, whatsapp_number: null })

    const req = makePatchRequest({ whatsapp_number: null })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.whatsapp_number).toBeNull()
  })
})

// ─────────────────────────────────────────────
// PATCH — happy path
// ─────────────────────────────────────────────
describe('PATCH /api/admin/config — happy path', () => {
  it('actualiza store_name correctamente', async () => {
    const updated = { ...baseConfig, store_name: 'VPS Coffee Roasting House' }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ store_name: 'VPS Coffee Roasting House' })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.store_name).toBe('VPS Coffee Roasting House')
  })

  it('actualiza logo_url correctamente', async () => {
    const logoUrl = 'https://example.com/logo.png'
    const updated = { ...baseConfig, logo_url: logoUrl }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ logo_url: logoUrl })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ logo_url: logoUrl })
    )
  })

  it('actualiza múltiples campos a la vez', async () => {
    const updated = {
      ...baseConfig,
      store_email: 'info@vpscoffee.com',
      whatsapp_number: '573009999999',
    }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({
      store_email: 'info@vpscoffee.com',
      whatsapp_number: '573009999999',
    })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.store_email).toBe('info@vpscoffee.com')
  })
})

// ─────────────────────────────────────────────
// PATCH — errores de BD
// ─────────────────────────────────────────────
describe('PATCH /api/admin/config — errores', () => {
  it('retorna 500 si updateStoreConfig lanza', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB write error'))

    const req = makePatchRequest({ store_name: 'Test' })
    const res = await PATCH(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })
})
