export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      colors: {
        spruce: { 50:'#eef2fb', 100:'#dce4f7', 200:'#b9c8ee', 300:'#8fa6e0', 400:'#5f7fce', 500:'#3a5db8', 600:'#2a4aa8', 700:'#203a9b', 800:'#182d7a', 900:'#111f58', 950:'#0a1338' },
        paper: '#f5f7fc',
        marker: { yellow: '#f2c24b', coral: '#c8283c' },
      },
    },
  },
  plugins: [],
}
