/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        }
      },
      boxShadow: {
        soft: '0 18px 50px rgba(15, 23, 42, 0.18)'
      },
      backgroundImage: {
        glow: 'radial-gradient(circle at top, rgba(16,185,129,0.22), rgba(2,6,23,0) 45%)'
      }
    }
  },
  plugins: []
};
