/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07090f',
          900: '#0b0f17',
          850: '#0f141d',
          800: '#131927',
          700: '#1c2333',
          600: '#2a3548',
          500: '#3a475e',
        },
        teal: {
          400: '#5eead4',
          500: '#2dd4bf',
          600: '#14b8a6',
        },
        rose: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
