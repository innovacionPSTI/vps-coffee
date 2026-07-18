import type { EmailPayload, EmailProvider } from './types'

const RESEND_API_URL = 'https://api.resend.com/emails'

export interface ResendConfig {
  apiKey: string
}

export class ResendProvider implements EmailProvider {
  readonly name = 'resend'

  constructor(private readonly config: ResendConfig) {}

  async send(payload: EmailPayload): Promise<void> {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Resend error ${res.status}: ${err}`)
    }
  }
}
