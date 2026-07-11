/**
 * Unit tests for the Skydropx OAuth auth module.
 * Now tests credential injection (no env vars).
 */

import { _clearTokenCacheForTests } from '../providers/skydropx/auth'

const BASE_URL = 'https://api-pro.skydropx.com'

const CREDS = {
  clientId: 'client-abc',
  clientSecret: 'secret-xyz',
  baseUrl: BASE_URL,
}

function makeTokenResponse(expiresIn = 7200) {
  const createdAt = Math.floor(Date.now() / 1000)
  return {
    access_token: `tok_${Math.random().toString(36).slice(2)}`,
    token_type: 'Bearer',
    expires_in: expiresIn,
    created_at: createdAt,
  }
}

beforeEach(() => {
  _clearTokenCacheForTests()
  jest.resetAllMocks()
})

// ─────────────────────────────────────────────
// getSkydropxToken
// ─────────────────────────────────────────────
describe('getSkydropxToken', () => {
  it('solicita un token nuevo cuando no hay cache', async () => {
    await jest.isolateModulesAsync(async () => {
      const tokenData = makeTokenResponse()
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => tokenData,
      } as unknown as Response)

      const { getSkydropxToken } = await import('../providers/skydropx/auth')
      const token = await getSkydropxToken(CREDS)

      expect(fetch).toHaveBeenCalledTimes(1)
      expect((fetch as jest.Mock).mock.calls[0][0]).toBe(`${BASE_URL}/api/v1/oauth/token`)
      expect(token).toBe(tokenData.access_token)
    })
  })

  it('reutiliza el token cacheado si no ha expirado', async () => {
    await jest.isolateModulesAsync(async () => {
      const tokenData = makeTokenResponse(7200)
      global.fetch = jest.fn().mockResolvedValue({
        ok: true, json: async () => tokenData,
      } as unknown as Response)

      const { getSkydropxToken } = await import('../providers/skydropx/auth')
      const t1 = await getSkydropxToken(CREDS)
      const t2 = await getSkydropxToken(CREDS)

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(t1).toBe(t2)
    })
  })

  it('renueva el token si faltan menos de 60s para expirar', async () => {
    await jest.isolateModulesAsync(async () => {
      const now = Math.floor(Date.now() / 1000)
      const expiredToken = { access_token: 'old', token_type: 'Bearer', expires_in: 30, created_at: now - 7170 }
      const freshToken = makeTokenResponse(7200)

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => expiredToken } as unknown as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => freshToken } as unknown as Response)

      const { getSkydropxToken } = await import('../providers/skydropx/auth')
      const t1 = await getSkydropxToken(CREDS)
      const t2 = await getSkydropxToken(CREDS)

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(t1).toBe('old')
      expect(t2).toBe(freshToken.access_token)
    })
  })

  it('cachea por clientId — credenciales diferentes usan tokens distintos', async () => {
    await jest.isolateModulesAsync(async () => {
      const tok1 = makeTokenResponse()
      const tok2 = makeTokenResponse()

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => tok1 } as unknown as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => tok2 } as unknown as Response)

      const { getSkydropxToken } = await import('../providers/skydropx/auth')
      const a = await getSkydropxToken({ clientId: 'client-A', clientSecret: 'secret', baseUrl: BASE_URL })
      const b = await getSkydropxToken({ clientId: 'client-B', clientSecret: 'secret', baseUrl: BASE_URL })

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(a).toBe(tok1.access_token)
      expect(b).toBe(tok2.access_token)
    })
  })

  it('lanza si la API responde con HTTP error', async () => {
    await jest.isolateModulesAsync(async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({}),
      } as unknown as Response)

      const { getSkydropxToken } = await import('../providers/skydropx/auth')
      await expect(getSkydropxToken(CREDS)).rejects.toThrow('Skydropx auth failed')
    })
  })
})

// ─────────────────────────────────────────────
// skydropxFetch
// ─────────────────────────────────────────────
describe('skydropxFetch', () => {
  it('adjunta Authorization: Bearer <token>', async () => {
    await jest.isolateModulesAsync(async () => {
      const tokenData = makeTokenResponse()
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => tokenData } as unknown as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)

      const { skydropxFetch } = await import('../providers/skydropx/auth')
      await skydropxFetch('/api/v1/shipments', CREDS)

      const [, options] = (fetch as jest.Mock).mock.calls[1]
      expect(options.headers['Authorization']).toBe(`Bearer ${tokenData.access_token}`)
    })
  })

  it('construye la URL completa con baseUrl del argumento', async () => {
    await jest.isolateModulesAsync(async () => {
      const tokenData = makeTokenResponse()
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => tokenData } as unknown as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response)

      const { skydropxFetch } = await import('../providers/skydropx/auth')
      await skydropxFetch('/api/v1/quotations/xyz', CREDS)

      const [url] = (fetch as jest.Mock).mock.calls[1]
      expect(url).toBe(`${BASE_URL}/api/v1/quotations/xyz`)
    })
  })
})
