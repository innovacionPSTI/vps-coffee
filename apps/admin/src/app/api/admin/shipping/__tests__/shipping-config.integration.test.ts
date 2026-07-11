/**
 * Integration tests — GET + PATCH /api/admin/shipping
 *
 * Tests:
 *   GET  → returns config with masked client_secret
 *   PATCH → validates provider, fixed_rate, skydropx required fields
 *   PATCH → saves and returns updated config
 *   PATCH → error paths (500)
 */

import { NextRequest } from 'next/server'

jest.mock('@vps/database', () => ({
  getShippingConfig: jest.fn(),
  updateShippingConfig: jest.fn(),
}))

import { getShippingConfig, updateShippingConfig } from '@vps/database'
import { GET, PATCH } from '../route'

const mockGet = getShippingConfig as jest.MockedFunction<typeof getShippingConfig>
const mockUpdate = updateShippingConfig as jest.MockedFunction<typeof updateShippingConfig>

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
const baseConfig = {
  id: 1,
  provider: 'fixed' as const,
  fixed_rate: 8000,
  skydropx_client_id: null,
  skydropx_client_secret: null,
  skydropx_address_from_id: null,
  skydropx_base_url: 'https://api-pro.skydropx.com',
  updated_at: new Date().toISOString(),
}

const skydropxConfig = {
  ...baseConfig,
  provider: 'skydropx' as const,
  skydropx_client_id: 'client-abc',
  skydropx_client_secret: 'super-secret-1234',
  skydropx_address_from_id: 'warehouse-01',
}

function makePatchRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/admin/shipping', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────
describe('GET /api/admin/shipping', () => {
  it('retorna la configuración actual', async () => {
    mockGet.mockResolvedValueOnce(baseConfig)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.provider).toBe('fixed')
    expect(data.fixed_rate).toBe(8000)
  })

  it('enmascara client_secret cuando existe', async () => {
    mockGet.mockResolvedValueOnce(skydropxConfig)
    const res = await GET()
    const data = await res.json()
    expect(data.skydropx_client_secret).not.toBe('super-secret-1234')
    expect(data.skydropx_client_secret).toMatch(/^••••/)
    // Last 4 chars should be visible
    expect(data.skydropx_client_secret).toContain('1234')
  })

  it('retorna null para client_secret cuando no hay credencial', async () => {
    mockGet.mockResolvedValueOnce(baseConfig)
    const res = await GET()
    const data = await res.json()
    expect(data.skydropx_client_secret).toBeNull()
  })

  it('retorna 500 si la BD falla', async () => {
    mockGet.mockRejectedValueOnce(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// ─────────────────────────────────────────────
// PATCH — validación
// ─────────────────────────────────────────────
describe('PATCH /api/admin/shipping — validación', () => {
  it('retorna 400 si el provider es inválido', async () => {
    const req = makePatchRequest({ provider: 'fedex_invalid' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/inválido/i)
  })

  it('retorna 400 si fixed_rate es negativo', async () => {
    const req = makePatchRequest({ fixed_rate: -1000 })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si se activa skydropx sin credenciales completas', async () => {
    // Simula que la config actual no tiene credenciales
    mockGet.mockResolvedValueOnce(baseConfig)
    const req = makePatchRequest({ provider: 'skydropx' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.missing).toContain('skydropx_client_id')
    expect(data.missing).toContain('skydropx_client_secret')
    expect(data.missing).toContain('skydropx_address_from_id')
  })

  it('permite activar skydropx si la config actual ya tiene credenciales', async () => {
    // Config actual ya tiene credenciales → solo cambiamos el provider
    mockGet.mockResolvedValueOnce(skydropxConfig)
    mockUpdate.mockResolvedValueOnce({ ...skydropxConfig, provider: 'skydropx' })

    const req = makePatchRequest({ provider: 'skydropx' })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
  })
})

// ─────────────────────────────────────────────
// PATCH — happy path
// ─────────────────────────────────────────────
describe('PATCH /api/admin/shipping — happy path', () => {
  it('actualiza fixed_rate correctamente', async () => {
    const updated = { ...baseConfig, fixed_rate: 12000 }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ fixed_rate: 12000 })
    const res = await PATCH(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.fixed_rate).toBe(12000)
  })

  it('cambia a tarifa fija correctamente', async () => {
    const updated = { ...baseConfig, provider: 'fixed' as const }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ provider: 'fixed', fixed_rate: 5000 })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ provider: 'fixed' }))
  })

  it('activa skydropx con credenciales completas en el body', async () => {
    mockGet.mockResolvedValueOnce(baseConfig) // no existing creds
    const updated = {
      ...skydropxConfig,
      skydropx_client_secret: '••••••••1234', // masked
    }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({
      provider: 'skydropx',
      skydropx_client_id: 'cid',
      skydropx_client_secret: 'new-secret',
      skydropx_address_from_id: 'wh-01',
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'skydropx', skydropx_client_id: 'cid' })
    )
  })

  it('retorna client_secret enmascarado en la respuesta del PATCH', async () => {
    mockGet.mockResolvedValueOnce(baseConfig)
    mockUpdate.mockResolvedValueOnce(skydropxConfig)

    const req = makePatchRequest({
      provider: 'skydropx',
      skydropx_client_id: 'cid',
      skydropx_client_secret: 'super-secret-1234',
      skydropx_address_from_id: 'wh-01',
    })
    const res = await PATCH(req)
    const data = await res.json()
    expect(data.skydropx_client_secret).not.toBe('super-secret-1234')
    expect(data.skydropx_client_secret).toContain('••••')
  })
})

// ─────────────────────────────────────────────
// PATCH — errores
// ─────────────────────────────────────────────
describe('PATCH /api/admin/shipping — errores', () => {
  it('retorna 500 si updateShippingConfig lanza', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB write error'))

    const req = makePatchRequest({ fixed_rate: 9000 })
    const res = await PATCH(req)
    expect(res.status).toBe(500)
  })
})
