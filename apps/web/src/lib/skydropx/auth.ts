const BASE = process.env.SKYDROPX_BASE_URL ?? 'https://api-pro.skydropx.com'
let cachedToken: { access_token: string; expires_at: number } | null = null

export async function getSkydropxToken(): Promise<string> {
  const now = Date.now() / 1000
  if (cachedToken && cachedToken.expires_at > now + 60) {
    return cachedToken.access_token
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.SKYDROPX_CLIENT_ID!,
    client_secret: process.env.SKYDROPX_CLIENT_SECRET!,
  })

  const res = await fetch(`${BASE}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = await res.json()
  cachedToken = {
    access_token: data.access_token,
    expires_at: data.created_at + data.expires_in,
  }
  return cachedToken.access_token
}

export async function skydropxFetch(path: string, options: RequestInit = {}) {
  const token = await getSkydropxToken()
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}
