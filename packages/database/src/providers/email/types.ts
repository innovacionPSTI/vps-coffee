/**
 * EmailProvider abstraction.
 *
 * Any email service (Resend, SendGrid, Mailgun, …) must implement this
 * interface. All transactional email callers only depend on these types.
 *
 * Adding a new provider:
 *   1. Create src/providers/email/<Name>Provider.ts implementing EmailProvider.
 *   2. Add a case to getEmailProvider() in index.ts.
 *   3. Add the provider's credentials to store_config (migration + types.ts).
 *   4. Add an option in the admin email config UI.
 */

export interface EmailPayload {
  from: string
  to: string[]
  subject: string
  html: string
}

export interface EmailProvider {
  /** Slug used for logging / analytics (e.g. 'resend', 'sendgrid') */
  readonly name: string

  /**
   * Sends a transactional email.
   * Throws on delivery failure (HTTP error, auth error, etc.).
   * Callers should catch and handle errors — never let a failed email
   * block a checkout or order status update.
   */
  send(payload: EmailPayload): Promise<void>
}
