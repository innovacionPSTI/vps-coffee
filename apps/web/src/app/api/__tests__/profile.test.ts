/**
 * @jest-environment node
 */
/**
 * Unit tests for GET /api/account/profile and PATCH /api/account/profile
 *
 * Verifies authentication guard, data retrieval, and update logic.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockMaybeSingle = jest.fn()
const mockUpdate      = jest.fn()
const mockFrom        = jest.fn(() => ({
  select:      jest.fn().mockReturnThis(),
  or:          jest.fn().mockReturnThis(),
  update:      jest.fn(() => ({ or: mockUpdate })),
  maybeSingle: mockMaybeSingle,
}))

jest.mock('@vps/database', () => ({
  createServerClient: jest.fn(() => ({ from: mockFrom })),
}))

const mockUserUpdate = jest.fn()
jest.mock('@/stack', () => ({
  stackServerApp: {
    getUser: jest.fn(),
  },
}))

import { NextRequest } from 'next/server'
import { GET, PATCH } from '../account/profile/route'
import { stackServerApp } from '@/stack'

const mockGetUser = stackServerApp.getUser as jest.MockedFunction<typeof stackServerApp.getUser>

const MOCK_USER = {
  id: 'stack-user-123',
  primaryEmail: 'user@example.com',
  displayName: 'Usuario Test',
  update: mockUserUpdate,
}

function makePatchRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/account/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUpdate.mockResolvedValue({ error: null })
  mockUserUpdate.mockResolvedValue(undefined)
})

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/account/profile', () => {
  it('retorna 401 si no hay sesión', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('No session'))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retorna los datos del customer cuando existe en BD', async () => {
    mockGetUser.mockResolvedValueOnce(MOCK_USER as any)
    mockMaybeSingle.mockResolvedValueOnce({
      data: { name: 'Juan', phone: '3001234567', email: 'user@example.com' },
    })

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      name:  'Juan',
      phone: '3001234567',
      email: 'user@example.com',
    })
  })

  it('usa displayName de Stack Auth si el customer no tiene nombre', async () => {
    mockGetUser.mockResolvedValueOnce(MOCK_USER as any)
    mockMaybeSingle.mockResolvedValueOnce({
      data: { name: null, phone: null, email: 'user@example.com' },
    })

    const res = await GET()
    const body = await res.json()
    expect(body.name).toBe('Usuario Test')
  })

  it('devuelve phone vacío si no está registrado', async () => {
    mockGetUser.mockResolvedValueOnce(MOCK_USER as any)
    mockMaybeSingle.mockResolvedValueOnce({ data: null })

    const res = await GET()
    const body = await res.json()
    expect(body.phone).toBe('')
    expect(body.email).toBe('user@example.com')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/account/profile', () => {
  it('retorna 401 si no hay sesión', async () => {
    mockGetUser.mockRejectedValueOnce(new Error('No session'))
    const res = await PATCH(makePatchRequest({ name: 'Nuevo Nombre' }))
    expect(res.status).toBe(401)
  })

  it('actualiza nombre y teléfono en la BD', async () => {
    mockGetUser.mockResolvedValueOnce(MOCK_USER as any)

    const res = await PATCH(makePatchRequest({ name: 'Nuevo', phone: '3009876543' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('actualiza displayName en Stack Auth cuando se cambia el nombre', async () => {
    mockGetUser.mockResolvedValueOnce(MOCK_USER as any)

    await PATCH(makePatchRequest({ name: 'Nombre Actualizado' }))
    expect(mockUserUpdate).toHaveBeenCalledWith({ displayName: 'Nombre Actualizado' })
  })

  it('no llama user.update si no se envía nombre', async () => {
    mockGetUser.mockResolvedValueOnce(MOCK_USER as any)

    await PATCH(makePatchRequest({ phone: '3001111111' }))
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })

  it('retorna 500 si la BD falla', async () => {
    mockGetUser.mockResolvedValueOnce(MOCK_USER as any)
    mockUpdate.mockResolvedValueOnce({ error: new Error('DB error') })

    const res = await PATCH(makePatchRequest({ name: 'Test' }))
    expect(res.status).toBe(500)
  })
})
