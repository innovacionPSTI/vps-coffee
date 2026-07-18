import type { NextConfig } from 'next'

// ── Security headers ───────────────────────────────────────────────────────────

const CSP = [
  "default-src 'self'",
  // Next.js requires unsafe-inline for hydration scripts; nonce-based CSP requires custom server
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://res.cloudinary.com",
  // Stack Auth + Supabase + Vercel Analytics
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stack-auth.com https://*.vercel-insights.com https://vitals.vercel-insights.com",
  "media-src 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy',        value: CSP },
  { key: 'X-Frame-Options',               value: 'DENY' },
  { key: 'X-Content-Type-Options',        value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control',        value: 'on' },
  { key: 'Referrer-Policy',              value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',            value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security',     value: 'max-age=63072000; includeSubDomains; preload' },
]

// ── Config ─────────────────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  transpilePackages: ['@vps/ui', '@vps/database'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ]
  },

  // Modo mantenimiento
  async redirects() {
    if (process.env.MAINTENANCE_MODE === 'true') {
      return [
        {
          source: '/((?!maintenance).*)',
          destination: '/maintenance',
          permanent: false,
        },
      ]
    }
    return []
  },
}

export default nextConfig
