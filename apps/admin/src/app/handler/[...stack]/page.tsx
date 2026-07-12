import { Suspense } from 'react'
import { StackHandler } from '@stackframe/stack'
import { stackServerApp } from '@/stack'

/**
 * Stack Auth handler catch-all route para el panel admin.
 * Maneja sign-in, sign-out, email-verification, password-reset, etc.
 *
 * Envuelto en <Suspense> porque StackHandler usa useUser() internamente.
 */
export default function Handler(props: unknown) {
  return (
    <Suspense>
      <StackHandler fullPage app={stackServerApp} routeProps={props} />
    </Suspense>
  )
}
