import { StackServerApp } from '@stackframe/stack'

/**
 * Instancia del servidor de Stack Auth.
 * Lee las variables de entorno NEXT_PUBLIC_STACK_* y STACK_SECRET_SERVER_KEY.
 *
 * Las URLs de autenticación apuntan a las páginas personalizadas de VPS Coffee
 * en lugar de las páginas genéricas de Stack (/handler/sign-in).
 */
export const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  projectId: process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
  publishableClientKey: process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY,
  secretServerKey: process.env.HEXCLAVE_SECRET_SERVER_KEY,
  urls: {
    signIn: '/login',
    signUp: '/registro',
    afterSignIn: '/mi-cuenta',
    afterSignUp: '/mi-cuenta',
    afterSignOut: '/',
    // Rutas explícitas del handler para que los emails apunten al lugar correcto
    passwordReset: '/handler/password-reset',
    forgotPassword: '/recuperar-contrasena',
    emailVerification: '/handler/email-verification',
    magicLinkCallback: '/handler/magic-link',
  },
})
