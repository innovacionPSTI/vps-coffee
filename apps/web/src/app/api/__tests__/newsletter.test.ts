/**
 * @jest-environment node
 */
/**
 * Unit tests for POST /api/newsletter
 *
 * Verifies subscription logic, deduplication, and email confirmation
 * behavior without hitting real DB or Resend.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockMaybeSingle = jest.fn()
const mockUpsert      = jest.fn()
const mockFrom        = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  eq:     jest.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
  upsert: mockUpsert,
}))

jest.mock('@vps/database', () => ({
  createServerClient: jest.fn(() => ({ from: mockFrom })),
  getStoreConfig: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
  sendNewsletterConfirmation: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '../newsletter/route'
import { getStoreConfig } from '@vps/database'
import { sendNewsletterConfirmation } from '@/lib/email'

const mockGetStoreConfig          = getStoreConfig as jest.MockedFunction<typeof getStoreConfig>
const mockSendNewsletterConfirmation = sendNewsletterConfirmation as jest.MockedFunction<typeof sendNewsletterConfirmation>

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const STORE_CONFIG = {
  resend_api_key:    're_test',
  resend_from_email: 'noreply@vpscoffee.com',
} as Awaited<ReturnType<typeof getStoreConfig>>

beforeEach(() => {
  jest.clearAllMocks()
  mockUpsert.mockResolvedValue({ error: null })
  mockSendNewsletterConfirmation.mockResolvedValue(undefined)
})

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/newsletter — validación', () => {
  it('retorna 400 si no se envía email', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/inválido/i)
  })

  it('retorna 400 si el email no contiene @', async () => {
    const res = await POST(makeRequest({ email: 'notanemail' }))
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/newsletter — primera suscripción', () => {
  beforeEach(() => {
    // Subscriber does NOT exist yet
    mockMaybeSingle.mockResolvedValue({ data: null })
    mockGetStoreConfig.mockResolvedValue(STORE_CONFIG)
  })

  it('retorna 200 y guarda el subscriber', async () => {
    const res = await POST(makeRequest({ email: 'new@example.com' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(mockUpsert).toHaveBeenCalledWith(
      { email: 'new@example.com', active: true },
      { onConflict: 'email' }
    )
  })

  it('envía email de confirmación en primera suscripción', async () => {
    await POST(makeRequest({ email: 'new@example.com' }))
    expect(mockSendNewsletterConfirmation).toHaveBeenCalledWith(
      'new@example.com',
      { apiKey: 're_test', fromEmail: 'noreply@vpscoffee.com' }
    )
  })

  it('no falla si el email de confirmación lanza error', async () => {
    mockSendNewsletterConfirmation.mockRejectedValueOnce(new Error('Resend down'))
    const res = await POST(makeRequest({ email: 'new@example.com' }))
    // Subscription is still saved
    expect(res.status).toBe(200)
    expect(mockUpsert).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/newsletter — re-suscripción (ya activo)', () => {
  beforeEach(() => {
    // Subscriber already active
    mockMaybeSingle.mockResolvedValue({ data: { active: true } })
    mockGetStoreConfig.mockResolvedValue(STORE_CONFIG)
  })

  it('no envía email de confirmación si ya está activo', async () => {
    const res = await POST(makeRequest({ email: 'existing@example.com' }))
    expect(res.status).toBe(200)
    expect(mockSendNewsletterConfirmation).not.toHaveBeenCalled()
  })

  it('actualiza el registro de todas formas (upsert)', async () => {
    await POST(makeRequest({ email: 'existing@example.com' }))
    expect(mockUpsert).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/newsletter — errores de BD', () => {
  it('retorna 500 si el upsert falla', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null })
    mockUpsert.mockResolvedValue({ error: new Error('DB error') })

    const res = await POST(makeRequest({ email: 'fail@example.com' }))
    expect(res.status).toBe(500)
  })
})
