/**
 * Skydropx OAuth 2.0 token management.
 *
 * Credentials are passed as arguments (loaded from shipping_config in the DB),
 * not from environment variables. This allows runtime reconfiguration without
 * redeployment.
 *
 * Token cache is keyed by clientId so multiple Skydropx accounts (multi-tenant)
 * are supported and warm serverless instances don't share stale tokens across configs.
 */

export interface SkydropxCredentials {
  clientId: string
  clientSecret: string
  baseUrl?: string
}

// Module-level cache: Map<clientId, { access_token, expires_at }>
const tokenCache = new Map<string, { access_token: string; expires_at: number }>()

export async function getSkydropxToken(credentials: SkydropxCredentials): Promise<string> {
  const { clientId, clientSecret, baseUrl = 'https://api-pro.skydropx.com' } = credentials
  const now = Date.now() / 1000
  const cached = tokenCache.get(clientId)

  // Reuse if valid with at least 60-second margin
  if (cached && cached.expires_at > now + 60) {
    return cached.access_token
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  const res = await fetch(`${baseUrl}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  if (!res.ok) {
    throw new Error(`Skydropx auth failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const entry = {
    access_token: data.access_token as string,
    expires_at: (data.created_at as number) + (data.expires_in as number),
  }
  tokenCache.set(clientId, entry)
  return entry.access_token
}

export async function skydropxFetch(
  path: string,
  credentials: SkydropxCredentials,
  options: RequestInit = {}
): Promise<Response> {
  const { baseUrl = 'https://api-pro.skydropx.com' } = credentials
  const token = await getSkydropxToken(credentials)
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

/** Exposed only for testing — clears all cached tokens */
export function _clearTokenCacheForTests(): void {
  tokenCache.clear()
}
