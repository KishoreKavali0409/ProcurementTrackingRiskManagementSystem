import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#18181b',
          dark: '#09090b',
          light: '#f4f4f5',
          50: '#fafafa',
          100: '#f4f4f5',
          500: '#18181b',
          600: '#09090b',
          700: '#000000',
        },
        shell: '#18181b',
        surface: '#ffffff',
        'content-bg': '#fafafa',
        enterprise: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
        },
        success: {
          DEFAULT: '#16a34a',
          bg: '#f0fdf4',
          light: '#4ade80',
        },
        warning: {
          DEFAULT: '#d97706',
          bg: '#fef3c7',
          light: '#fbbf24',
        },
        danger: {
          DEFAULT: '#dc2626',
          bg: '#fef2f2',
          light: '#f87171',
        },
        info: {
          DEFAULT: '#27272a',
          bg: '#f4f4f5',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['11px', '16px'],
        sm: ['12px', '18px'],
        base: ['13px', '20px'],
        md: ['14px', '21px'],
        lg: ['15px', '22px'],
        xl: ['16px', '24px'],
        '2xl': ['18px', '26px'],
        '3xl': ['20px', '28px'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        panel: '0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',
        'inner-brand': 'inset 0 0 0 2px #18181b',
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
      },
    },
  },
  plugins: [],
}
export default config
