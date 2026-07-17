import baseConfig from '../../packages/config/tailwind.config'
import type { Config } from 'tailwindcss'

/**
 * El panel de admin usa CSS custom properties para sus colores brand,
 * igual que la web, pero con valores distintos e independientes.
 *
 * Los defaults de :root viven en globals.css (paleta corporativa slate/indigo).
 * El layout.tsx los sobreescribe con los valores almacenados en admin_config.
 *
 * brand-sidebar → fondo del sidebar  (controlado por admin_config.sidebar_color)
 * brand-primary → acento/botones     (controlado por admin_config.accent_color)
 * brand-cream   → texto sidebar / superficies claras (fijo: slate-50)
 */
const config: Config = {
  ...baseConfig,
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme?.extend,
      colors: {
        brand: {
          primary:      'rgb(var(--brand-primary)      / <alpha-value>)',
          dark:         'rgb(var(--brand-dark)         / <alpha-value>)',
          sidebar:      'rgb(var(--brand-sidebar)      / <alpha-value>)',
          cream:        'rgb(var(--brand-cream)        / <alpha-value>)',
          'cream-warm': 'rgb(var(--brand-cream-warm)   / <alpha-value>)',
          yellow:       'rgb(var(--brand-yellow)       / <alpha-value>)',
          'yellow-pale':'rgb(var(--brand-yellow-pale)  / <alpha-value>)',
          text:         'rgb(var(--brand-text)         / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        brand:   ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
}

export default config
