import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0891b2',
        cssPrimary: '#0891b2',
        secondary: '#64748b',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        destructive: '#ef4444',
        background: '#f8fafc',
        card: '#ffffff',
        foreground: '#1e293b',
        muted: {
          foreground: '#64748b',
        },
        border: '#e2e8f0',
        popover: '#ffffff',
      },
      boxShadow: {
        card: '0 4px 20px rgba(2, 6, 23, 0.06)'
      },
      borderRadius: {
        ui: '8px'
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.3' }
        }
      },
      animation: {
        ticker: 'ticker 20s linear infinite',
        pulseDot: 'pulseDot 1.5s ease-in-out infinite'
      }
    }
  },
  plugins: []
} satisfies Config
