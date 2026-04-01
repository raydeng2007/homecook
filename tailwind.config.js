/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      // ──────────────────────────────────────────────────────
      // Bordeaux & Champagne palette — warm artisanal cookbook
      // To change the palette, update these values + ThemeContext.tsx + useThemeColors.ts
      // ──────────────────────────────────────────────────────
      colors: {
        // Primary accent — champagne gold (constant across themes for opacity support)
        // To swap: change these hex values
        primary: {
          DEFAULT: '#D9B991',
          variant: '#B89870',
        },
        // Secondary — dusty bordeaux
        secondary: {
          DEFAULT: '#8B3A3A',
          variant: '#6B2424',
        },
        // Theme-aware surfaces (via NativeWind vars())
        background: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-bg)',
          '1': 'var(--color-surface-1)',
          '2': 'var(--color-surface-2)',
          '3': 'var(--color-surface-3)',
          '4': 'var(--color-surface-4)',
          '5': 'var(--color-surface-5)',
        },
        // Error — warm terracotta
        error: {
          DEFAULT: '#E07A5F',
          variant: '#C24D35',
        },
        // On colors (text on colored backgrounds — theme-aware via CSS var)
        on: {
          primary: 'var(--color-on-primary)',
          secondary: '#FAF3EB',
          background: '#FFFFFF',
          surface: '#FFFFFF',
          error: '#FAF3EB',
        },
        // Theme-aware text colors
        text: {
          DEFAULT: 'var(--color-text-high)',
          high: 'var(--color-text-high)',
          medium: 'var(--color-text-medium)',
          disabled: 'var(--color-text-disabled)',
        },
        // Warm palette for gradient recipe cards
        warm: {
          '1': '#D9B991',
          '2': '#C9A882',
          '3': '#E8C088',
          '4': '#A67C52',
          '5': '#8B5E3C',
        },
        // Elegant border colors
        border: {
          subtle: 'var(--color-border-subtle)',
          card: 'var(--color-border-card)',
          focus: 'var(--color-border-focus)',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
