/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary accent built around #FE4C1C — used sparingly for CTAs,
        // active states and gradients; neutrals stay dominant.
        brand: {
          50: '#fff4f0',
          100: '#ffe6dd',
          200: '#ffc8b5',
          300: '#ffa284',
          400: '#ff7551',
          500: '#fe4c1c',
          600: '#ed3a0a',
          700: '#c42d08',
          800: '#9c270f',
          900: '#7e2410',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #ff7551 0%, #fe4c1c 45%, #c42d08 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
