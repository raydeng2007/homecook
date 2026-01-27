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
      // Material Design Dark Theme Colors
      colors: {
        // Primary - Purple (BB86FC)
        primary: {
          DEFAULT: '#BB86FC',
          variant: '#3700B3',
        },
        // Secondary - Teal (03DAC6)
        secondary: {
          DEFAULT: '#03DAC6',
          variant: '#018786',
        },
        // Background colors
        background: '#121212',
        // Surface colors (elevated surfaces get lighter)
        surface: {
          DEFAULT: '#121212',
          '1': '#1E1E1E',  // 5% white overlay
          '2': '#232323',  // 7% white overlay
          '3': '#252525',  // 8% white overlay
          '4': '#272727',  // 9% white overlay
          '5': '#2C2C2C',  // 11% white overlay
        },
        // Error state
        error: {
          DEFAULT: '#CF6679',
          variant: '#B00020',
        },
        // On colors (text/icons on top of surfaces)
        on: {
          primary: '#000000',
          secondary: '#000000',
          background: '#FFFFFF',
          surface: '#FFFFFF',
          error: '#000000',
        },
        // Text colors
        text: {
          DEFAULT: '#FFFFFF',
          high: 'rgba(255, 255, 255, 0.87)',    // High emphasis
          medium: 'rgba(255, 255, 255, 0.60)',  // Medium emphasis
          disabled: 'rgba(255, 255, 255, 0.38)', // Disabled
        },
      },
      // Custom font families (after loading fonts with expo-font)
      fontFamily: {
        sans: ['System'],
        // heading: ['Poppins-Bold'],
        // body: ['Inter-Regular'],
      },
      // Custom font sizes
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
      // Custom spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      // Custom border radius
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
