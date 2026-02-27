import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f3',
          100: '#fce8e6',
          200: '#f9d4d0',
          300: '#f4b3ac',
          400: '#ec857a',
          500: '#e05d4f',
          600: '#cc4235',
          700: '#ac352a',
          800: '#8f2f26',
          900: '#782d26',
          950: '#40140f',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          muted: 'var(--surface-muted)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
