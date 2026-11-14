import colors from 'tailwindcss/colors'

// Theme-aware colours: the values live in src/index.css (:root = light, .dark = night).
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`
const scale = (name, shades, base = {}) => ({ ...base, ...Object.fromEntries(shades.map((s) => [s, v(`${name}-${s}`)])) })
const tints = Object.fromEntries(['red', 'amber', 'sky', 'emerald', 'violet', 'teal', 'pink', 'orange'].map((f) => [f, scale(f, [50, 100, 200, 300], colors[f])]))

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ...tints,
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        spruce: scale('spruce', [50, 100, 200, 300], { 400: '#4f6bb8', 500: '#324f9e', 600: '#254088', 700: '#1b3278', 800: '#13265e', 900: '#0b1a48', 950: '#050c28' }),
        paper: v('paper'),
        surface: v('surface'),
        marker: { yellow: '#f2c24b', coral: '#c8283c' },
      },
    },
  },
  plugins: [],
}
