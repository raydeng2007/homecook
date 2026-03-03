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
      // Material Design Theme Colors — CSS variable–backed for dark/light toggle
      colors: {
        // Primary - Purple (stays constant across themes)
        primary: {
          DEFAULT: '#BB86FC',
          variant: '#3700B3',
        },
        // Secondary - Teal
        secondary: {
          DEFAULT: '#03DAC6',
          variant: '#018786',
        },
        // Theme-aware colors (via NativeWind vars())
        background: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-bg)',
          '1': 'var(--color-surface-1)',
          '2': 'var(--color-surface-2)',
          '3': 'var(--color-surface-3)',
          '4': 'var(--color-surface-4)',
          '5': 'var(--color-surface-5)',
        },
        // Error state
        error: {
          DEFAULT: '#CF6679',
          variant: '#B00020',
        },
        // On colors
        on: {
          primary: 'var(--color-on-primary)',
          secondary: '#000000',
          background: '#FFFFFF',
          surface: '#FFFFFF',
          error: '#000000',
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
          '1': '#FF8A65',
          '2': '#FFB74D',
          '3': '#FFD54F',
          '4': '#FFAB91',
          '5': '#FF7043',
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
