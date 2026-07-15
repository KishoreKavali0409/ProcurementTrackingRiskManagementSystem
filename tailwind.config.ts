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
          DEFAULT: '#0070d2',
          dark: '#005fb2',
          light: '#e8f4ff',
          50: '#f0f8ff',
          100: '#e8f4ff',
          500: '#0070d2',
          600: '#005fb2',
          700: '#004a8c',
        },
        shell: '#1a2638',
        surface: '#ffffff',
        'content-bg': '#f3f6f9',
        enterprise: {
          50: '#f8fafc',
          100: '#f3f6f9',
          200: '#e0e5ee',
          300: '#c9d3e0',
          400: '#9faab7',
          500: '#54698d',
          600: '#3e5372',
          700: '#2a3d5a',
          800: '#1a2638',
          900: '#0f1a27',
        },
        success: {
          DEFAULT: '#2e844a',
          bg: '#eaf5ea',
          light: '#4bca64',
        },
        warning: {
          DEFAULT: '#a86403',
          bg: '#fef7e7',
          light: '#dd8f0c',
        },
        danger: {
          DEFAULT: '#ba0517',
          bg: '#fef0f0',
          light: '#f56464',
        },
        info: {
          DEFAULT: '#0070d2',
          bg: '#e8f4ff',
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
        sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
        panel: '0 2px 8px rgba(0,0,0,0.08)',
        'inner-brand': 'inset 0 0 0 2px #0070d2',
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
    },
  },
  plugins: [],
}
export default config
