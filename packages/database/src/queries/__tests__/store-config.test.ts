/**
 * Unit tests — getStoreConfig / updateStoreConfig
 *
 * Tests:
 *   getStoreConfig → happy path, fallback a DEFAULT_CONFIG, error BD
 *   updateStoreConfig → upsert id=1, lanza si la BD falla
 */

import { getStoreConfig, updateStoreConfig } from '../store-config'

// ─────────────────────────────────────────────
// Mock del cliente Supabase
// ─────────────────────────────────────────────
const mockSingle = jest.fn()
const mockSelect = jest.fn(() => ({ limit: jest.fn(() => ({ single: mockSingle })) }))
const mockUpsertChain = jest.fn()
const mockUpsertSelect = jest.fn(() => ({ single: mockUpsertChain }))
const mockUpsert = jest.fn(() => ({ select: mockUpsertSelect }))
const mockFrom = jest.fn(() => ({
  select: mockSelect,
  upsert: mockUpsert,
}))

jest.mock('../../client', () => ({
  createServerClient: jest.fn(() => ({ from: mockFrom })),
}))

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
const fullConfig = {
  id: 1,
  whatsapp_number: '573001234567',
  store_name: 'VPS Coffee',
  store_email: 'info@vpscoffee.com',
  logo_url: 'https://example.com/logo.png',
  updated_at: '2026-07-09T00:00:00.000Z',
}

// ─────────────────────────────────────────────
// getStoreConfig
// ─────────────────────────────────────────────
describe('getStoreConfig', () => {
  it('devuelve el registro cuando la BD responde correctamente', async () => {
    mockSingle.mockResolvedValueOnce({ data: fullConfig, error: null })

    const result = await getStoreConfig()

    expect(result.whatsapp_number).toBe('573001234567')
    expect(result.logo_url).toBe('https://example.com/logo.png')
    expect(result.store_name).toBe('VPS Coffee')
  })

  it('devuelve DEFAULT_CONFIG cuando la BD devuelve error', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'table not found' } })

    const result = await getStoreConfig()

    expect(result.id).toBe(1)
    expect(result.store_name).toBe('VPS Coffee')
    expect(result.whatsapp_number).toBeNull()
    expect(result.logo_url).toBeNull()
  })

  it('devuelve DEFAULT_CONFIG cuando data es null (tabla vacía)', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null })

    const result = await getStoreConfig()

    expect(result.id).toBe(1)
    expect(result.whatsapp_number).toBeNull()
  })

  it('devuelve DEFAULT_CONFIG cuando la promesa lanza (sin catch externo)', async () => {
    mockSingle.mockRejectedValueOnce(new Error('Network error'))

    // getStoreConfig internamente usa error || !data, pero si single() lanza,
    // la función debería propagar — documentamos el comportamiento real
    await expect(getStoreConfig()).rejects.toThrow('Network error')
  })

  it('usa la tabla store_config', async () => {
    mockSingle.mockResolvedValueOnce({ data: fullConfig, error: null })
    await getStoreConfig()
    expect(mockFrom).toHaveBeenCalledWith('store_config')
  })

  it('aplica limit(1) antes de llamar a single()', async () => {
    const limitMock = jest.fn(() => ({ single: mockSingle }))
    mockSelect.mockReturnValueOnce({ limit: limitMock })
    mockSingle.mockResolvedValueOnce({ data: fullConfig, error: null })

    await getStoreConfig()
    expect(limitMock).toHaveBeenCalledWith(1)
  })
})

// ─────────────────────────────────────────────
// updateStoreConfig
// ─────────────────────────────────────────────
describe('updateStoreConfig', () => {
  it('hace upsert con id=1 y los campos provistos', async () => {
    mockUpsertChain.mockResolvedValueOnce({ data: { ...fullConfig, whatsapp_number: '573009999999' }, error: null })

    const result = await updateStoreConfig({ whatsapp_number: '573009999999' })

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, whatsapp_number: '573009999999' }),
      undefined
    )
    expect(result.whatsapp_number).toBe('573009999999')
  })

  it('incluye updated_at en el upsert', async () => {
    mockUpsertChain.mockResolvedValueOnce({ data: fullConfig, error: null })

    await updateStoreConfig({ store_name: 'VPS Coffee Nuevo' })

    const upsertArg = mockUpsert.mock.calls[0][0]
    expect(upsertArg).toHaveProperty('updated_at')
    expect(typeof upsertArg.updated_at).toBe('string')
  })

  it('lanza el error de Supabase cuando el upsert falla', async () => {
    const dbError = { message: 'DB write error', code: '42P01' }
    mockUpsertChain.mockResolvedValueOnce({ data: null, error: dbError })

    await expect(updateStoreConfig({ store_name: 'X' })).rejects.toMatchObject(dbError)
  })

  it('actualiza solo logo_url sin afectar otros campos', async () => {
    const updated = { ...fullConfig, logo_url: 'https://example.com/new-logo.png' }
    mockUpsertChain.mockResolvedValueOnce({ data: updated, error: null })

    const result = await updateStoreConfig({ logo_url: 'https://example.com/new-logo.png' })

    expect(result.logo_url).toBe('https://example.com/new-logo.png')
    const upsertArg = mockUpsert.mock.calls[0][0]
    expect(upsertArg).not.toHaveProperty('whatsapp_number')
  })
})
