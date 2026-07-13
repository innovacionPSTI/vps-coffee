/**
 * Integration tests — PATCH + DELETE /api/account/addresses/[id]
 *
 * Covers: editar dirección, establecer como predeterminada, eliminar.
 * Auth mock: stackServerApp.getUser() retorna usuario o null según el test.
 * DB mock: createServerClient() retorna un cliente Supabase fake.
 */

import { NextRequest } from 'next/server'
import { PATCH, DELETE } from '../[id]/route'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = jest.fn()
jest.mock('@/stack', () => ({ stackServerApp: { getUser: () => mockGetUser() } }))

const mockFrom = jest.fn()
jest.mock('@vps/database', () => ({
  createServerClient: () => ({ from: mockFrom }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/account/addresses/addr-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function authUser() {
  mockGetUser.mockResolvedValue({ id: 'stack-1', primaryEmail: 'user@test.com' })
}

/**
 * Chains: from(table).select(fields).eq(...).maybeSingle()
 * Returns different results based on table name.
 */
function setupChain({
  customerId = 'cust-1',
  addressExists = true,
  updateData = { id: 'addr-1', city: 'Medellín' },
}: {
  customerId?: string | null
  addressExists?: boolean
  updateData?: object
} = {}) {
  mockFrom.mockImplementation((table: string) => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue(
        table === 'customers'
          ? { data: customerId ? { id: customerId } : null }
          : table === 'customer_addresses' && !addressExists
          ? { data: null }
          : { data: { id: 'addr-1' } }
      ),
      single: jest.fn().mockResolvedValue({ data: updateData, error: null }),
    }
    // eq returns the same chain to allow chaining
    chain.eq.mockReturnValue(chain)
    chain.select.mockReturnValue(chain)
    chain.update.mockReturnValue(chain)
    chain.delete.mockReturnValue(chain)
    return chain
  })
}

// ─── PATCH tests ──────────────────────────────────────────────────────────────

describe('PATCH /api/account/addresses/[id]', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await PATCH(makeRequest({}), makeParams('addr-1'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when customer not found', async () => {
    authUser()
    setupChain({ customerId: null })
    const res = await PATCH(makeRequest({ city: 'Bogotá' }), makeParams('addr-1'))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Cliente no encontrado')
  })

  it('returns 404 when address does not belong to customer', async () => {
    authUser()
    setupChain({ addressExists: false })
    const res = await PATCH(makeRequest({ city: 'Cali' }), makeParams('addr-1'))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Dirección no encontrada')
  })

  it('updates address fields and returns updated address', async () => {
    authUser()
    const updated = { id: 'addr-1', city: 'Medellín', department: 'Antioquia' }
    setupChain({ updateData: updated })
    const res = await PATCH(
      makeRequest({ city: 'Medellín', department: 'Antioquia' }),
      makeParams('addr-1')
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.address).toMatchObject(updated)
  })

  it('sets address as default and clears previous default', async () => {
    authUser()
    setupChain()
    const clearDefaultCalled = jest.fn()
    // Intercept the "clear other defaults" call
    mockFrom.mockImplementation((table: string) => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockImplementation(() => {
          if (table === 'customer_addresses') clearDefaultCalled()
          return chain
        }),
        delete: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'cust-1' } }),
        single: jest.fn().mockResolvedValue({ data: { id: 'addr-1', is_default: true }, error: null }),
      }
      chain.eq.mockReturnValue(chain)
      chain.select.mockReturnValue(chain)
      chain.update.mockReturnValue(chain)
      chain.delete.mockReturnValue(chain)
      return chain
    })
    const res = await PATCH(makeRequest({ is_default: true }), makeParams('addr-1'))
    expect(res.status).toBe(200)
    expect(clearDefaultCalled).toHaveBeenCalled()
  })
})

// ─── DELETE tests ─────────────────────────────────────────────────────────────

describe('DELETE /api/account/addresses/[id]', () => {
  beforeEach(() => { jest.clearAllMocks() })

  function makeDeleteRequest() {
    return new NextRequest('http://localhost/api/account/addresses/addr-1', {
      method: 'DELETE',
    })
  }

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await DELETE(makeDeleteRequest(), makeParams('addr-1'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when customer not found', async () => {
    authUser()
    setupChain({ customerId: null })
    const res = await DELETE(makeDeleteRequest(), makeParams('addr-1'))
    expect(res.status).toBe(404)
  })

  it('deletes address and returns ok:true', async () => {
    authUser()
    mockFrom.mockImplementation(() => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'cust-1' } }),
      }
      chain.eq.mockReturnValue(chain)
      chain.select.mockReturnValue(chain)
      chain.delete.mockReturnValue({ ...chain, error: null })
      return chain
    })
    const res = await DELETE(makeDeleteRequest(), makeParams('addr-1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
