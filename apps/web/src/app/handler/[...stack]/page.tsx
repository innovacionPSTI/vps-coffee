import { Suspense } from 'react'
import { StackHandler } from '@stackframe/stack'
import { stackServerApp } from '@/stack'

/**
 * Stack Auth handler catch-all route.
 * Maneja internamente:
 *   - /handler/sign-in / sign-up   (Stack Auth redirige a /login y /registro)
 *   - /handler/email-verification
 *   - /handler/password-reset
 *   - /handler/magic-link
 *
 * Sin fullPage: el layout de /handler/ provee la cabecera y el centrado.
 * Envuelto en <Suspense> porque StackHandler usa useUser() internamente.
 */
export default function Handler(props: unknown) {
  return (
    <Suspense>
      <StackHandler app={stackServerApp} routeProps={props} fullPage={false} />
    </Suspense>
  )
}
