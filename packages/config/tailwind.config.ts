import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#614A2A',
          dark: '#604B30',
          cream: '#FFF0D1',
          'cream-warm': '#FFF1D3',
          yellow: '#FFF6B8',
          'yellow-pale': '#FDF8B9',
          text: '#2D1A0A',
        },
      },
      fontFamily: {
        display: ['var(--font-ahsing)', 'Georgia', 'serif'],
        brand: ['var(--font-geeeki)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hero: 'clamp(3rem, 8vw, 7rem)',
        section: 'clamp(2rem, 5vw, 4rem)',
        card: '1.25rem',
      },
      borderRadius: {
        arch: '50% 50% 0 0',
      },
      boxShadow: {
        card: '0 4px 24px rgba(97, 74, 42, 0.10)',
        'card-hover': '0 8px 32px rgba(97, 74, 42, 0.18)',
      },
      backgroundImage: {
        'gradient-cream': 'linear-gradient(135deg, #FFF0D1 0%, #FFF6B8 100%)',
      },
    },
  },
  plugins: [],
}

export default config
