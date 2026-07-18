/**
 * Email Provider Factory
 *
 * ┌────────────────────────────────────────────────────────────┐
 * │  store_config.email_provider  │  Returned provider         │
 * ├────────────────────────────────────────────────────────────┤
 * │  'resend' (default)           │  ResendProvider(apiKey)    │
 * │  <future>                     │  <future>Provider(config)  │
 * └────────────────────────────────────────────────────────────┘
 *
 * Adding a new provider:
 *   1. Create src/providers/email/<Name>Provider.ts implementing EmailProvider.
 *   2. Add its credentials to store_config (migration + types.ts).
 *   3. Add a case below.
 *   4. Add option + credentials form in admin email config UI.
 */

import { ResendProvider } from './ResendProvider'
import type { EmailProvider } from './types'

export type { EmailProvider, EmailPayload } from './types'
export { ResendProvider } from './ResendProvider'
export type { ResendConfig } from './ResendProvider'

export interface EmailProviderConfig {
  /** Provider slug — from store_config.email_provider. Defaults to 'resend'. */
  provider?: string | null
  apiKey: string
}

/**
 * Factory — call once per request.
 * Do NOT cache across requests; admin can switch providers at any time.
 */
export function getEmailProvider(config: EmailProviderConfig): EmailProvider {
  const provider = config.provider ?? 'resend'
  switch (provider) {
    case 'resend':
    default:
      return new ResendProvider({ apiKey: config.apiKey })
  }
}
