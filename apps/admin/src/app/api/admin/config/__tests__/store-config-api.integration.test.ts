/**
 * Integration tests — GET + PATCH /api/admin/config
 *
 * Tests:
 *   GET  → devuelve store_config; enmascara resend_api_key y agrega has_resend_api_key
 *   PATCH → valida whatsapp_number, normaliza dígitos, guarda logo_url
 *   PATCH → acepta campos resend_api_key y resend_from_email
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
  resend_api_key: 're_test_abcd1234',
  resend_from_email: 'pedidos@vpscoffee.com',
  terms_content: null,
  privacy_content: null,
  instagram_url: null,
  instagram_enabled: true,
  facebook_url: null,
  facebook_enabled: true,
  tiktok_url: null,
  tiktok_enabled: true,
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

  it('enmascara resend_api_key y no expone el valor real', async () => {
    mockGet.mockResolvedValueOnce(baseConfig)
    const res = await GET()
    const data = await res.json()

    // No debe devolver la clave real
    expect(data.resend_api_key).not.toBe('re_test_abcd1234')
    // Debe estar enmascarada o ser null, nunca el valor completo
    if (data.resend_api_key !== null) {
      expect(data.resend_api_key).toContain('••••')
    }
  })

  it('devuelve has_resend_api_key = true cuando hay una clave guardada', async () => {
    mockGet.mockResolvedValueOnce(baseConfig)
    const res = await GET()
    const data = await res.json()

    expect(data.has_resend_api_key).toBe(true)
  })

  it('devuelve has_resend_api_key = false cuando no hay clave', async () => {
    mockGet.mockResolvedValueOnce({ ...baseConfig, resend_api_key: null })
    const res = await GET()
    const data = await res.json()

    expect(data.has_resend_api_key).toBe(false)
    expect(data.resend_api_key).toBeNull()
  })

  it('devuelve resend_from_email en texto plano', async () => {
    mockGet.mockResolvedValueOnce(baseConfig)
    const res = await GET()
    const data = await res.json()

    expect(data.resend_from_email).toBe('pedidos@vpscoffee.com')
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
// PATCH — validación de WhatsApp
// ─────────────────────────────────────────────
describe('PATCH /api/admin/config — validación WhatsApp', () => {
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
// PATCH — happy path (campos generales)
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
// PATCH — campos Resend
// ─────────────────────────────────────────────
describe('PATCH /api/admin/config — Resend', () => {
  it('actualiza resend_from_email correctamente', async () => {
    const updated = { ...baseConfig, resend_from_email: 'hola@vpscoffee.com' }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ resend_from_email: 'hola@vpscoffee.com' })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ resend_from_email: 'hola@vpscoffee.com' })
    )
  })

  it('enmascara resend_api_key en la respuesta PATCH', async () => {
    const updated = { ...baseConfig, resend_api_key: 're_test_newkey5678' }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ resend_api_key: 're_test_newkey5678' })
    const res = await PATCH(req)
    const data = await res.json()

    expect(data.resend_api_key).not.toBe('re_test_newkey5678')
    expect(data.has_resend_api_key).toBe(true)
  })
})

// ─────────────────────────────────────────────
// PATCH — contenido legal
// ─────────────────────────────────────────────
describe('PATCH /api/admin/config — contenido legal', () => {
  it('guarda terms_content y lo devuelve en la respuesta', async () => {
    const content = '## Términos\n\nEsto es un ejemplo de texto legal.'
    const updated = { ...baseConfig, terms_content: content }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ terms_content: content })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ terms_content: content })
    )
    const data = await res.json()
    expect(data.terms_content).toBe(content)
  })

  it('guarda privacy_content correctamente', async () => {
    const content = '## Política de privacidad\n\nTus datos están seguros.'
    const updated = { ...baseConfig, privacy_content: content }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ privacy_content: content })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.privacy_content).toBe(content)
  })

  it('permite null para borrar el contenido legal', async () => {
    const updated = { ...baseConfig, terms_content: null, privacy_content: null }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ terms_content: null, privacy_content: null })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.terms_content).toBeNull()
    expect(data.privacy_content).toBeNull()
  })
})

// ─────────────────────────────────────────────
// PATCH — redes sociales
// ─────────────────────────────────────────────
describe('PATCH /api/admin/config — redes sociales', () => {
  it('guarda instagram_url e instagram_enabled', async () => {
    const updated = { ...baseConfig, instagram_url: 'https://instagram.com/vpscoffee', instagram_enabled: true }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ instagram_url: 'https://instagram.com/vpscoffee', instagram_enabled: true })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        instagram_url: 'https://instagram.com/vpscoffee',
        instagram_enabled: true,
      })
    )
  })

  it('guarda facebook_enabled = false (deshabilitar red)', async () => {
    const updated = { ...baseConfig, facebook_enabled: false }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ facebook_enabled: false })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.facebook_enabled).toBe(false)
  })

  it('guarda tiktok_url y tiktok_enabled juntos', async () => {
    const updated = { ...baseConfig, tiktok_url: 'https://tiktok.com/@vpscoffee', tiktok_enabled: true }
    mockUpdate.mockResolvedValueOnce(updated)

    const req = makePatchRequest({ tiktok_url: 'https://tiktok.com/@vpscoffee', tiktok_enabled: true })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.tiktok_url).toBe('https://tiktok.com/@vpscoffee')
  })

  it('devuelve campos de redes sociales en el GET', async () => {
    mockGet.mockResolvedValueOnce({
      ...baseConfig,
      instagram_url: 'https://instagram.com/vpscoffee',
      instagram_enabled: true,
      facebook_url: null,
      facebook_enabled: false,
    })
    const res = await GET()
    const data = await res.json()
    expect(data.instagram_url).toBe('https://instagram.com/vpscoffee')
    expect(data.facebook_enabled).toBe(false)
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
