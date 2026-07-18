/**
 * Tests de integración — PATCH /api/admin/sistema
 * Tests unitarios    — getAdminConfig, updateAdminConfig
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetAdminUser = jest.fn()
jest.mock('@/lib/auth', () => ({ getAdminUser: () => mockGetAdminUser() }))

const mockUpdateAdminConfig = jest.fn()
jest.mock('@vps/database', () => ({
  updateAdminConfig: (...args: unknown[]) => mockUpdateAdminConfig(...args),
}))

// ── Imports ───────────────────────────────────────────────────────────────────

import { PATCH } from '../route'
import { NextRequest } from 'next/server'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAdminUser(role = 'super_admin') {
  return { id: '1', role }
}

function buildRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/admin/sistema', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const UPDATED_CONFIG = {
  id: 1,
  accent_color: '#FF0000',
  sidebar_color: '#111111',
  updated_at: '2025-01-01T00:00:00.000Z',
}

// ── PATCH /api/admin/sistema ──────────────────────────────────────────────────

describe('PATCH /api/admin/sistema', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 when unauthenticated', async () => {
    mockGetAdminUser.mockResolvedValue(null)
    const res = await PATCH(buildRequest({ accent_color: '#FF0000' }))
    expect(res.status).toBe(403)
  })

  it('returns 403 for insufficient role', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('gestor_tienda'))
    const res = await PATCH(buildRequest({ accent_color: '#FF0000' }))
    expect(res.status).toBe(403)
  })

  it('returns 403 for despachador role', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('despachador'))
    const res = await PATCH(buildRequest({ accent_color: '#FF0000' }))
    expect(res.status).toBe(403)
  })

  it('updates accent_color for admin', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('admin'))
    mockUpdateAdminConfig.mockResolvedValue(UPDATED_CONFIG)

    const res = await PATCH(buildRequest({ accent_color: '#FF0000' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.accent_color).toBe('#FF0000')
    expect(mockUpdateAdminConfig).toHaveBeenCalledWith({ accent_color: '#FF0000' })
  })

  it('updates sidebar_color for super_admin', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('super_admin'))
    mockUpdateAdminConfig.mockResolvedValue(UPDATED_CONFIG)

    const res = await PATCH(buildRequest({ sidebar_color: '#111111' }))
    expect(res.status).toBe(200)
    expect(mockUpdateAdminConfig).toHaveBeenCalledWith({ sidebar_color: '#111111' })
  })

  it('updates both colors at once', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('super_admin'))
    mockUpdateAdminConfig.mockResolvedValue(UPDATED_CONFIG)

    const res = await PATCH(buildRequest({ accent_color: '#FF0000', sidebar_color: '#111111' }))
    expect(res.status).toBe(200)
    expect(mockUpdateAdminConfig).toHaveBeenCalledWith({
      accent_color: '#FF0000',
      sidebar_color: '#111111',
    })
  })

  it('skips empty strings — does not pass falsy values to updateAdminConfig', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('admin'))
    mockUpdateAdminConfig.mockResolvedValue(UPDATED_CONFIG)

    // accent_color is empty string — should be filtered out
    const res = await PATCH(buildRequest({ accent_color: '', sidebar_color: '#111111' }))
    expect(res.status).toBe(200)
    expect(mockUpdateAdminConfig).toHaveBeenCalledWith({ sidebar_color: '#111111' })
  })

  it('propagates updateAdminConfig errors', async () => {
    mockGetAdminUser.mockResolvedValue(makeAdminUser('admin'))
    mockUpdateAdminConfig.mockRejectedValue(new Error('db error'))

    await expect(PATCH(buildRequest({ accent_color: '#FF0000' }))).rejects.toThrow('db error')
  })
})
