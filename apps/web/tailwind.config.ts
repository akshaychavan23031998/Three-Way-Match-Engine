import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { brand: { 50: '#ecfdf5', 600: '#059669', 700: '#047857' } } } },
  plugins: [],
} satisfies Config;
