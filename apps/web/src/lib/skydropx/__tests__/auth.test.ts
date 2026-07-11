/**
 * Unit tests for Skydropx OAuth 2.0 token management.
 *
 * Strategy: mock global `fetch` to simulate Skydropx's /oauth/token endpoint.
 * We also reset the module-level `cachedToken` between tests by re-importing
 * the module via jest.isolateModules() so the closure is fresh.
 */

const MOCK_BASE = 'https://api-pro.skydropx.com'

// Helper: create a fake token response
function makeTokenResponse(expiresIn = 7200) {
  const createdAt = Math.floor(Date.now() / 1000)
  return {
    access_token: `mock_token_${Math.random().toString(36).slice(2)}`,
    token_type: 'Bearer',
    expires_in: expiresIn,
    created_at: createdAt,
  }
}

beforeEach(() => {
  // Set required env vars
  process.env.SKYDROPX_BASE_URL = MOCK_BASE
  process.env.SKYDROPX_CLIENT_ID = 'test_client_id'
  process.env.SKYDROPX_CLIENT_SECRET = 'test_client_secret'
  jest.resetAllMocks()
})

afterEach(() => {
  delete process.env.SKYDROPX_BASE_URL
  delete process.env.SKYDROPX_CLIENT_ID
  delete process.env.SKYDROPX_CLIENT_SECRET
})

// ─────────────────────────────────────────────
// getSkydropxToken
// ─────────────────────────────────────────────
describe('getSkydropxToken', () => {
  it('solicita un token nuevo cuando el cache está vacío', async () => {
    await jest.isolateModulesAsync(async () => {
      const tokenData = makeTokenResponse()
      global.fetch = jest.fn().mockResolvedValueOnce({
        json: async () => tokenData,
        ok: true,
      } as unknown as Response)

      const { getSkydropxToken } = await import('../auth')
      const token = await getSkydropxToken()

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith(
        `${MOCK_BASE}/api/v1/oauth/token`,
        expect.objectContaining({ method: 'POST' })
      )
      expect(token).toBe(tokenData.access_token)
    })
  })

  it('reutiliza el token cacheado si no ha expirado', async () => {
    await jest.isolateModulesAsync(async () => {
      const tokenData = makeTokenResponse(7200) // expira en 2 horas
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => tokenData,
        ok: true,
      } as unknown as Response)

      const { getSkydropxToken } = await import('../auth')

      // Primera llamada: debe hacer fetch
      const token1 = await getSkydropxToken()
      // Segunda llamada: debe usar cache
      const token2 = await getSkydropxToken()

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(token1).toBe(token2)
    })
  })

  it('renueva el token si faltan menos de 60 segundos para expirar', async () => {
    await jest.isolateModulesAsync(async () => {
      const now = Math.floor(Date.now() / 1000)
      // Token que expira en 30 segundos (dentro del margen de 60s)
      const expiredToken = {
        access_token: 'old_token',
        token_type: 'Bearer',
        expires_in: 30,
        created_at: now - 7170, // creado hace 7170s → expira en 30s
      }
      const freshToken = makeTokenResponse(7200)

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ json: async () => expiredToken, ok: true } as unknown as Response)
        .mockResolvedValueOnce({ json: async () => freshToken, ok: true } as unknown as Response)

      const { getSkydropxToken } = await import('../auth')

      const token1 = await getSkydropxToken() // primer fetch
      const token2 = await getSkydropxToken() // debe renovar

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(token1).toBe('old_token')
      expect(token2).toBe(freshToken.access_token)
    })
  })
})

// ─────────────────────────────────────────────
// skydropxFetch
// ─────────────────────────────────────────────
describe('skydropxFetch', () => {
  it('adjunta el header Authorization: Bearer <token>', async () => {
    await jest.isolateModulesAsync(async () => {
      const tokenData = makeTokenResponse()
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ json: async () => tokenData, ok: true } as unknown as Response)
        .mockResolvedValueOnce({ json: async () => ({ data: [] }), ok: true } as unknown as Response)

      const { skydropxFetch } = await import('../auth')
      await skydropxFetch('/api/v1/shipments')

      // Second call should have Authorization header
      const secondCallArgs = (fetch as jest.Mock).mock.calls[1]
      expect(secondCallArgs[1].headers['Authorization']).toBe(
        `Bearer ${tokenData.access_token}`
      )
    })
  })

  it('adjunta Content-Type application/json por defecto', async () => {
    await jest.isolateModulesAsync(async () => {
      const tokenData = makeTokenResponse()
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ json: async () => tokenData, ok: true } as unknown as Response)
        .mockResolvedValueOnce({ json: async () => ({}), ok: true } as unknown as Response)

      const { skydropxFetch } = await import('../auth')
      await skydropxFetch('/api/v1/quotations', { method: 'POST', body: '{}' })

      const secondCallArgs = (fetch as jest.Mock).mock.calls[1]
      expect(secondCallArgs[1].headers['Content-Type']).toBe('application/json')
    })
  })

  it('construye la URL correcta con el BASE_URL', async () => {
    await jest.isolateModulesAsync(async () => {
      const tokenData = makeTokenResponse()
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ json: async () => tokenData, ok: true } as unknown as Response)
        .mockResolvedValueOnce({ json: async () => ({}), ok: true } as unknown as Response)

      const { skydropxFetch } = await import('../auth')
      await skydropxFetch('/api/v1/quotations/abc123')

      const secondCallArgs = (fetch as jest.Mock).mock.calls[1]
      expect(secondCallArgs[0]).toBe(`${MOCK_BASE}/api/v1/quotations/abc123`)
    })
  })
})
