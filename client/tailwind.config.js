/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'tajawal': ['Tajawal', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        sidebar: {
          50: '#f0f4f9',
          100: '#e1e8f0',
          200: '#c3d1e0',
          300: '#a5bad0',
          400: '#87a3c0',
          500: '#698cb0',
          600: '#5b7a9e',
          700: '#4d688c',
          800: '#3f567a',
          900: '#314468',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 