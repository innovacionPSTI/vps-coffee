/**
 * Tests unitarios — getAdminConfig / updateAdminConfig
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSingle  = jest.fn()
const mockSelect  = jest.fn(() => ({ limit: jest.fn(() => ({ single: mockSingle })) }))
const mockUpsert  = jest.fn(() => ({ select: jest.fn(() => ({ single: mockSingle })) }))
const mockFrom    = jest.fn(() => ({ select: mockSelect, upsert: mockUpsert }))

jest.mock('../../client', () => ({
  createServerClient: () => ({ from: mockFrom }),
}))

// ── Imports ───────────────────────────────────────────────────────────────────

import { getAdminConfig, updateAdminConfig } from '../admin-config'

// ── Tests — getAdminConfig ────────────────────────────────────────────────────

describe('getAdminConfig', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns DB row when found', async () => {
    const row = { id: 1, accent_color: '#4F46E5', sidebar_color: '#0F172A', updated_at: '2025-01-01' }
    mockSingle.mockResolvedValue({ data: row, error: null })

    const result = await getAdminConfig()
    expect(result.accent_color).toBe('#4F46E5')
    expect(result.sidebar_color).toBe('#0F172A')
  })

  it('returns DEFAULT_ADMIN_CONFIG when DB returns error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })

    const result = await getAdminConfig()
    expect(result.id).toBe(1)
    expect(result.accent_color).toBe('#4F46E5')
    expect(result.sidebar_color).toBe('#0F172A')
  })

  it('returns DEFAULT_ADMIN_CONFIG when data is null', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null })

    const result = await getAdminConfig()
    expect(result.id).toBe(1)
  })
})

// ── Tests — updateAdminConfig ─────────────────────────────────────────────────

describe('updateAdminConfig', () => {
  beforeEach(() => jest.clearAllMocks())

  it('upserts and returns updated config', async () => {
    const updated = { id: 1, accent_color: '#FF0000', sidebar_color: '#0F172A', updated_at: '2025-06-01' }
    mockSingle.mockResolvedValue({ data: updated, error: null })

    const result = await updateAdminConfig({ accent_color: '#FF0000' })
    expect(result.accent_color).toBe('#FF0000')
    expect(mockFrom).toHaveBeenCalledWith('admin_config')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, accent_color: '#FF0000' })
    )
  })

  it('throws on DB error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'constraint violation' } })

    await expect(updateAdminConfig({ sidebar_color: '#000' })).rejects.toMatchObject({
      message: 'constraint violation',
    })
  })

  it('includes updated_at in upsert payload', async () => {
    const updated = { id: 1, accent_color: '#4F46E5', sidebar_color: '#222', updated_at: '2025-06-01' }
    mockSingle.mockResolvedValue({ data: updated, error: null })

    await updateAdminConfig({ sidebar_color: '#222' })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) })
    )
  })
})
