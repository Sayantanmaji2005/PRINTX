import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './client/customer/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#36abf7',
          500: '#0c8fe9',
          600: '#0171c7',
          700: '#025aa1',
          800: '#064d85',
          900: '#0b406e',
          950: '#072949',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(12, 143, 233, 0.3)',
        neo: '4px 4px 0px 0px #0f172a',
        'neo-sm': '2px 2px 0px 0px #0f172a',
        'neo-lg': '6px 6px 0px 0px #0f172a',
        'neo-hover': '5px 5px 0px 0px #0f172a',
      },
    },
  },
  plugins: [],
};

export default config;
